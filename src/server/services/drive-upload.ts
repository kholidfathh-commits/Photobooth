import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  photostrips,
  uploads,
  type PhotostripRow,
  type UploadRow,
} from "@/db/schema";
import { DriveConfigError, DriveError, getDriveService } from "@/server/drive";
import { ServiceError } from "@/server/errors";
import { retryWithBackoff } from "@/server/retry";
import { storage } from "@/server/storage";

import { ensureActiveQrToken } from "./qr";
import { getUploadMetadata } from "./upload-metadata";

/** Unggahan berstatus "mengunggah" lebih lama dari ini dianggap macet. */
const STALE_MS = 2 * 60_000;

/** Jeda coba ulang terjadwal setelah gagal ke-n: 10 dtk, 20, 40, … maks 10 menit. */
export function uploadRetryDelayMs(attempts: number) {
  return Math.min(10_000 * 2 ** Math.max(0, attempts - 1), 10 * 60_000);
}

/** Setelah sekian kali gagal, berhenti menjadwalkan coba ulang otomatis. */
export const MAX_SCHEDULED_ATTEMPTS = 8;

/** Percobaan langsung di dalam satu permintaan (jeda ±1 dtk, 2 dtk). */
const IN_REQUEST_ATTEMPTS = 3;

export interface DriveUploadResult {
  upload: UploadRow;
  /** Photostrip setelah unggah sukses — token QR dijamin aktif. */
  photostrip: PhotostripRow;
  /** true bila berkas sudah ada di Drive sebelumnya (tidak diunggah ulang). */
  reused: boolean;
}

const now = () => new Date().toISOString();

/**
 * Unggah hasil akhir sebuah sesi ke Google Drive (folder per tanggal, nama
 * unik), jadikan dapat diakses lewat tautan, lalu catat di `uploads` dan
 * `photostrips.drive_file_id`. Idempoten: bila berkas yang sama (MD5 cocok)
 * sudah ada di Drive, tidak diunggah ulang. Gagal → status "gagal" dengan
 * jadwal coba ulang, dan ServiceError (retryable untuk error jaringan/5xx).
 */
export async function uploadPhotostripToDrive(
  sessionId: string,
): Promise<DriveUploadResult> {
  const meta = await getUploadMetadata(sessionId);
  const data = await storage().get(meta.storageKey);
  if (!data) {
    throw new ServiceError(
      409,
      "berkas_hilang",
      "Berkas hasil akhir tidak ada di server",
    );
  }

  // Catat / kunci sesi unggahan (satu per photostrip).
  const [existing] = await db
    .select()
    .from(uploads)
    .where(eq(uploads.photostripId, meta.photostripId))
    .limit(1);
  if (
    existing?.status === "mengunggah" &&
    Date.now() - Date.parse(existing.updatedAt) < STALE_MS
  ) {
    throw new ServiceError(
      409,
      "sedang_diunggah",
      "Hasil foto ini sedang diunggah",
    );
  }
  const base = {
    fileName: meta.fileName,
    sizeBytes: meta.sizeBytes,
    md5: meta.md5,
    status: "mengunggah" as const,
    lastError: null,
    nextRetryAt: null,
    updatedAt: now(),
  };
  const [row] = existing
    ? await db
        .update(uploads)
        .set({ ...base, attempts: existing.attempts + 1 })
        .where(eq(uploads.id, existing.id))
        .returning()
    : await db
        .insert(uploads)
        .values({
          id: `unggah-${crypto.randomUUID()}`,
          photostripId: meta.photostripId,
          attempts: 1,
          ...base,
        })
        .returning();

  const finish = async (
    driveFileId: string,
    driveFolderId: string | null,
    reused: boolean,
  ) => {
    await db
      .update(photostrips)
      .set({ driveFileId })
      .where(eq(photostrips.id, meta.photostripId));
    const [done] = await db
      .update(uploads)
      .set({
        status: "berhasil",
        driveFileId,
        driveFolderId: driveFolderId ?? row.driveFolderId,
        lastError: null,
        nextRetryAt: null,
        updatedAt: now(),
        finishedAt: now(),
      })
      .where(eq(uploads.id, row.id))
      .returning();
    // QR baru "terbit" setelah unggahan sukses: pastikan token aktif.
    const [strip] = await db
      .select()
      .from(photostrips)
      .where(eq(photostrips.id, meta.photostripId))
      .limit(1);
    const photostrip = await ensureActiveQrToken(strip);
    return { upload: done, reused, photostrip };
  };

  const drive = (() => {
    try {
      return getDriveService();
    } catch (err) {
      return err as Error;
    }
  })();

  const attemptUpload = async () => {
    if (drive instanceof Error) throw drive;

    // 1) Sudah tercatat di DB dan berkasnya masih sama di Drive?
    if (meta.driveFileId) {
      const file = await drive.getFile(meta.driveFileId);
      if (file?.md5Checksum === meta.md5)
        return await finish(file.id, null, true);
    }
    // 2) Pernah terunggah tapi DB belum sempat dicatat?
    const found = await drive.findByAppProperty(
      "photostripId",
      meta.photostripId,
    );
    if (found?.md5Checksum === meta.md5)
      return await finish(found.id, null, true);

    // 3) Unggah baru.
    const folderId = await drive.ensureFolderPath(meta.folderPath);
    const file = await drive.uploadFile({
      name: meta.fileName,
      mimeType: meta.mimeType,
      data,
      folderId,
      description: meta.description,
      appProperties: { photostripId: meta.photostripId, sessionId },
    });
    if (file.md5Checksum && file.md5Checksum !== meta.md5) {
      throw new DriveError("Checksum berkas di Drive tidak cocok", null, true);
    }
    await drive.makePublic(file.id);
    return await finish(file.id, folderId, false);
  };

  try {
    // Gangguan sesaat (jaringan, 429, 5xx) dicoba ulang langsung dengan backoff.
    return await retryWithBackoff(attemptUpload, {
      attempts: IN_REQUEST_ATTEMPTS,
      baseDelayMs: 1000,
      shouldRetry: (err) => err instanceof DriveError && err.retryable,
      onRetry: (err, attempt, delay) =>
        console.warn(
          `[unggah] percobaan ${attempt} gagal (${(err as Error).message}); ulang dalam ${delay} ms`,
        ),
    });
  } catch (err) {
    const retryable =
      err instanceof DriveError
        ? err.retryable
        : !(err instanceof DriveConfigError);
    const message = err instanceof Error ? err.message : "Unggahan gagal";
    const attempts = row.attempts;
    const scheduleRetry = retryable && attempts < MAX_SCHEDULED_ATTEMPTS;
    await db
      .update(uploads)
      .set({
        status: "gagal",
        lastError: message.slice(0, 500),
        nextRetryAt: scheduleRetry
          ? new Date(Date.now() + uploadRetryDelayMs(attempts)).toISOString()
          : null,
        updatedAt: now(),
      })
      .where(eq(uploads.id, row.id));

    if (err instanceof DriveConfigError) {
      throw new ServiceError(500, "drive_belum_diatur", message);
    }
    throw new ServiceError(
      retryable ? 503 : 502,
      retryable ? "drive_sementara_gagal" : "drive_menolak",
      retryable
        ? "Google Drive sedang tidak bisa dihubungi, coba lagi sebentar"
        : "Google Drive menolak unggahan",
    );
  }
}
