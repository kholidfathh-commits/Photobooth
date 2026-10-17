import "server-only";

import { createHash } from "node:crypto";

import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { photostrips, uploads } from "@/db/schema";
import {
  demoDownloadInfo,
  isValidToken,
  type DownloadInfo,
} from "@/lib/download";
import { getDriveService } from "@/server/drive";
import { findPhotostripByToken } from "@/server/repositories/photostrips";
import { findSessionWithFrame } from "@/server/repositories/sessions";
import { storage } from "@/server/storage";

/**
 * Data publik halaman unduh berdasarkan token QR — hanya yang aman
 * ditampilkan (tanpa id sesi/perangkat). Token tidak valid, tidak ada, atau
 * dicabut → null. Dengan `demoFallback` (hanya di pengembangan), token tak
 * dikenal memakai data contoh agar alur tiruan di frontend tetap bisa dicoba.
 */
export async function getPublicDownload(
  qrToken: string,
  { demoFallback = false }: { demoFallback?: boolean } = {},
): Promise<DownloadInfo | null> {
  if (!isValidToken(qrToken)) return null;

  const strip = await findPhotostripByToken(qrToken);
  if (!strip || strip.tokenRevokedAt) {
    return demoFallback && process.env.NODE_ENV !== "production" && !strip
      ? demoDownloadInfo(qrToken)
      : null;
  }
  const found = await findSessionWithFrame(strip.sessionId);
  const [width, height] = strip.resolution.split("x").map(Number);
  // Nama berkas yang tercatat saat diunggah (tetap ada walau berkas
  // sementara di server sudah dibersihkan).
  const [upload] = await db
    .select({ fileName: uploads.fileName })
    .from(uploads)
    .where(eq(uploads.photostripId, strip.id))
    .limit(1);
  const fileName = upload?.fileName ?? `street-photobooth-${qrToken}.jpg`;
  return {
    qrToken,
    imageUrl: `/api/unduh/${qrToken}/berkas`,
    fileName,
    frameName: found?.frame.name ?? "Street Photobooth",
    width: width || 600,
    height: height || 1376,
    createdAt: strip.createdAt,
  };
}

/**
 * Isi berkas photostrip untuk token: dari penyimpanan server bila masih ada,
 * selain itu dari Google Drive. Null bila tidak ditemukan.
 */
export async function getPublicDownloadFile(
  qrToken: string,
): Promise<{ data: Buffer; fileName: string; etag: string } | null> {
  if (!isValidToken(qrToken)) return null;
  const strip = await findPhotostripByToken(qrToken);
  if (!strip || strip.tokenRevokedAt) return null;

  const key = strip.finalUrl?.startsWith("storage:")
    ? strip.finalUrl.slice("storage:".length)
    : null;
  let data = key ? await storage().get(key) : null;
  if (!data && strip.driveFileId) {
    data = await getDriveService().downloadFile(strip.driveFileId);
  }
  if (!data) return null;

  const info = await getPublicDownload(qrToken);
  return {
    data,
    fileName: info?.fileName ?? `street-photobooth-${qrToken}.jpg`,
    etag: `"${createHash("md5").update(data).digest("hex")}"`,
  };
}

/** Catat satu unduhan (hitungan & waktu terakhir) — tanpa data pengunduh. */
export async function recordDownload(qrToken: string) {
  await db
    .update(photostrips)
    .set({
      downloadCount: sql`${photostrips.downloadCount} + 1`,
      lastDownloadedAt: new Date().toISOString(),
    })
    .where(eq(photostrips.qrToken, qrToken));
}
