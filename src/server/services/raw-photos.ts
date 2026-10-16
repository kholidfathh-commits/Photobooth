import "server-only";

import { and, eq } from "drizzle-orm";
import sharp, { type Metadata } from "sharp";

import { db } from "@/db";
import { photos, type PhotoRow } from "@/db/schema";
import { ServiceError } from "@/server/errors";
import { findSessionWithFrame } from "@/server/repositories/sessions";
import { storage } from "@/server/storage";

/** Batas ukuran satu jepretan mentah (byte). */
export const MAX_RAW_BYTES = 20 * 1024 * 1024;

export function rawPhotoKey(sessionId: string, orderIndex: number) {
  return `mentah/${sessionId}/${orderIndex}.jpg`;
}

/**
 * Simpan (atau ganti, saat retake) jepretan mentah untuk slot tertentu:
 * validasi sesi & slot, normalisasi ke JPEG tegak (ikuti EXIF), simpan ke
 * penyimpanan, lalu catat di tabel `photos` (satu baris per slot).
 */
export async function saveRawPhoto(
  sessionId: string,
  orderIndex: number,
  input: Buffer,
): Promise<PhotoRow> {
  const found = await findSessionWithFrame(sessionId);
  if (!found)
    throw new ServiceError(404, "sesi_tidak_ada", "Sesi tidak ditemukan");
  const { slotCount } = found.frame;
  if (
    !Number.isInteger(orderIndex) ||
    orderIndex < 0 ||
    orderIndex >= slotCount
  ) {
    throw new ServiceError(
      422,
      "urutan_di_luar_slot",
      `Urutan foto harus 1–${slotCount} untuk frame ini`,
    );
  }
  if (input.length === 0 || input.length > MAX_RAW_BYTES) {
    throw new ServiceError(
      input.length === 0 ? 400 : 413,
      input.length === 0 ? "berkas_kosong" : "berkas_terlalu_besar",
      input.length === 0 ? "Berkas foto kosong" : "Berkas foto melebihi 20 MB",
    );
  }

  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new ServiceError(
      415,
      "bukan_gambar",
      "Berkas bukan gambar yang valid",
    );
  }
  if (!meta.format || !["jpeg", "png", "webp", "heif"].includes(meta.format)) {
    throw new ServiceError(
      415,
      "format_tidak_didukung",
      "Gunakan JPEG, PNG, WebP, atau HEIC",
    );
  }

  const jpeg = await sharp(input)
    .rotate()
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
  const key = rawPhotoKey(sessionId, orderIndex);
  await storage().put(key, jpeg);

  const values = {
    sessionId,
    orderIndex,
    rawUrl: `storage:${key}`,
    takenAt: new Date().toISOString(),
  };
  const [existing] = await db
    .select({ id: photos.id })
    .from(photos)
    .where(
      and(eq(photos.sessionId, sessionId), eq(photos.orderIndex, orderIndex)),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(photos)
      .set(values)
      .where(eq(photos.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(photos)
    .values({ id: `foto-${crypto.randomUUID()}`, ...values })
    .returning();
  return created;
}
