import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { photos, uploads } from "@/db/schema";
import { ServiceError } from "@/server/errors";
import { findPhotostripBySession } from "@/server/repositories/photostrips";
import {
  findSessionById,
  markSessionCleared,
  updateSessionStatus,
  type SessionModel,
  toSessionModel,
} from "@/server/repositories/sessions";
import { storage } from "@/server/storage";

export interface CloseSessionResult {
  session: SessionModel;
  /** Foto mentah dihapus dari server. */
  rawPhotosCleared: boolean;
  /** Berkas hasil lokal dihapus (hanya bila sudah aman di Google Drive). */
  finalFileCleared: boolean;
  /** Hasil masih menunggu unggah — berkas lokal sengaja dipertahankan. */
  pendingUpload: boolean;
}

/**
 * Tutup sesi setelah pelanggan selesai: status "selesai" (punya hasil) atau
 * "dibatalkan" (belum ada hasil), lalu bersihkan data sementara agar tidak
 * tertukar dengan pelanggan berikutnya:
 * - foto mentah selalu dihapus (tidak dibutuhkan lagi);
 * - berkas hasil lokal dihapus HANYA bila sudah tersimpan di Google Drive —
 *   bila belum, dipertahankan agar pekerja coba-ulang tetap bisa mengunggah.
 * Token QR & berkas di Drive tetap berlaku. Aman dipanggil berulang.
 */
export async function closeSession(
  sessionId: string,
): Promise<CloseSessionResult> {
  const session = await findSessionById(sessionId);
  if (!session)
    throw new ServiceError(404, "sesi_tidak_ada", "Sesi tidak ditemukan");

  const photostrip = await findPhotostripBySession(sessionId);
  const status = photostrip ? "selesai" : "dibatalkan";
  if (session.status === "berjalan")
    await updateSessionStatus(sessionId, status);

  // Foto mentah: hapus berkas & tautannya.
  await storage().deletePrefix(`mentah/${sessionId}`);
  await db
    .update(photos)
    .set({ rawUrl: null })
    .where(eq(photos.sessionId, sessionId));

  let finalFileCleared = false;
  let pendingUpload = false;
  if (photostrip) {
    const [upload] = await db
      .select({ status: uploads.status })
      .from(uploads)
      .where(eq(uploads.photostripId, photostrip.id))
      .limit(1);
    const safeInDrive =
      Boolean(photostrip.driveFileId) && upload?.status === "berhasil";
    if (safeInDrive && photostrip.finalUrl?.startsWith("storage:")) {
      await storage().delete(photostrip.finalUrl.slice("storage:".length));
      finalFileCleared = true;
    }
    pendingUpload = !safeInDrive;
  }

  if (!pendingUpload) await markSessionCleared(sessionId);
  const fresh = await findSessionById(sessionId);
  return {
    session: toSessionModel(fresh!),
    rawPhotosCleared: true,
    finalFileCleared,
    pendingUpload,
  };
}
