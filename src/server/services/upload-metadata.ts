import "server-only";

import { createHash } from "node:crypto";

import {
  DEFAULT_TIME_ZONE,
  photostripFileName,
  photostripFolderPath,
} from "@/lib/file-naming";
import { ServiceError } from "@/server/errors";
import { findPhotostripBySession } from "@/server/repositories/photostrips";
import { findSessionWithFrame } from "@/server/repositories/sessions";
import { storage } from "@/server/storage";

/** Zona waktu acara (WIB) untuk penamaan berkas & folder per tanggal. */
const EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE ?? DEFAULT_TIME_ZONE;

export interface UploadMetadata {
  sessionId: string;
  photostripId: string;
  /** Nama berkas unik per sesi (lihat photostripFileName). */
  fileName: string;
  /** Jalur folder di Drive, dari akar ke bawah: ["Street Photobooth", "2026-10-14"]. */
  folderPath: string[];
  mimeType: "image/jpeg";
  sizeBytes: number;
  /** MD5 heksadesimal — dicocokkan dengan md5Checksum dari Google Drive. */
  md5: string;
  /** Kunci berkas di penyimpanan server. */
  storageKey: string;
  resolution: string;
  qrToken: string;
  frameName: string;
  /** Sudah pernah diunggah? (driveFileId terisi) */
  alreadyUploaded: boolean;
  driveFileId: string | null;
  /** Deskripsi berkas di Drive (tanpa data pribadi). */
  description: string;
}

/**
 * Kumpulkan semua yang dibutuhkan proses unggah ke Google Drive untuk hasil
 * akhir sebuah sesi: nama berkas unik, folder per tanggal, ukuran, checksum,
 * dan status unggah sebelumnya. Melempar ServiceError bila sesi/hasil/berkas
 * belum ada.
 */
export async function getUploadMetadata(
  sessionId: string,
): Promise<UploadMetadata> {
  const found = await findSessionWithFrame(sessionId);
  if (!found)
    throw new ServiceError(404, "sesi_tidak_ada", "Sesi tidak ditemukan");

  const photostrip = await findPhotostripBySession(sessionId);
  if (!photostrip) {
    throw new ServiceError(
      404,
      "hasil_belum_ada",
      "Sesi ini belum punya hasil foto",
    );
  }
  const storageKey = photostrip.finalUrl?.startsWith("storage:")
    ? photostrip.finalUrl.slice("storage:".length)
    : null;
  const file = storageKey ? await storage().get(storageKey) : null;
  if (!storageKey || !file) {
    throw new ServiceError(
      409,
      "berkas_hilang",
      "Berkas hasil akhir tidak ada di server",
    );
  }

  const { startedAt } = found.session;
  return {
    sessionId,
    photostripId: photostrip.id,
    fileName: photostripFileName({
      startedAt,
      frameName: found.frame.name,
      qrToken: photostrip.qrToken,
      timeZone: EVENT_TIME_ZONE,
    }),
    folderPath: photostripFolderPath(startedAt, EVENT_TIME_ZONE),
    mimeType: "image/jpeg",
    sizeBytes: file.length,
    md5: createHash("md5").update(file).digest("hex"),
    storageKey,
    resolution: photostrip.resolution,
    qrToken: photostrip.qrToken,
    frameName: found.frame.name,
    alreadyUploaded: Boolean(photostrip.driveFileId),
    driveFileId: photostrip.driveFileId,
    description: `Street Photobooth · frame ${found.frame.name} · ${photostrip.resolution}`,
  };
}
