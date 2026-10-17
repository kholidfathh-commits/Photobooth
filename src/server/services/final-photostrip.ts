import "server-only";

import { eq } from "drizzle-orm";
import sharp, { type Metadata } from "sharp";

import { db } from "@/db";
import { frames, photostrips, sessions, type PhotostripRow } from "@/db/schema";
import { CANVAS } from "@/lib/frames/themes";
import { ServiceError } from "@/server/errors";
import { storage } from "@/server/storage";

import { withUniqueToken } from "./qr";

/** Batas ukuran berkas hasil akhir yang diterima (byte). */
export const MAX_FINAL_BYTES = 15 * 1024 * 1024;
/** Lebar minimum agar tetap tajam saat dicetak (px). */
export const MIN_FINAL_WIDTH = 1080;
/** Toleransi beda rasio tinggi:lebar terhadap tata letak frame. */
const RATIO_TOLERANCE = 0.02;

const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);

/** Kunci berkas hasil akhir sesi di penyimpanan. */
export function finalPhotostripKey(sessionId: string) {
  return `hasil/${sessionId}.jpg`;
}

/**
 * Simpan berkas photostrip final resolusi tinggi untuk sebuah sesi:
 * validasi format, ukuran, dan rasio terhadap frame sesi → normalisasi ke
 * JPEG → simpan ke penyimpanan → catat/ubah baris `photostrips`.
 * Token QR dipertahankan bila sesi sudah pernah punya hasil (QR lama tetap
 * berlaku).
 */
export async function saveFinalPhotostrip(
  sessionId: string,
  input: Buffer,
): Promise<PhotostripRow> {
  if (input.length === 0) {
    throw new ServiceError(400, "berkas_kosong", "Berkas hasil foto kosong");
  }
  if (input.length > MAX_FINAL_BYTES) {
    throw new ServiceError(
      413,
      "berkas_terlalu_besar",
      `Berkas melebihi ${MAX_FINAL_BYTES / 1024 / 1024} MB`,
    );
  }

  const [row] = await db
    .select({ sessionId: sessions.id, slotCount: frames.slotCount })
    .from(sessions)
    .innerJoin(frames, eq(frames.id, sessions.frameId))
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (!row)
    throw new ServiceError(404, "sesi_tidak_ada", "Sesi tidak ditemukan");

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
  if (!meta.format || !ACCEPTED_FORMATS.has(meta.format)) {
    throw new ServiceError(
      415,
      "format_tidak_didukung",
      "Gunakan JPEG, PNG, atau WebP",
    );
  }
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < MIN_FINAL_WIDTH) {
    throw new ServiceError(
      422,
      "resolusi_rendah",
      `Lebar minimal ${MIN_FINAL_WIDTH} px agar tajam saat dicetak (didapat ${width} px)`,
    );
  }
  // Semua hasil berukuran 9:16 (lihat CANVAS).
  const ratioDiff = Math.abs(height / width - CANVAS.height / CANVAS.width);
  if (ratioDiff > RATIO_TOLERANCE) {
    throw new ServiceError(
      422,
      "rasio_tidak_cocok",
      `Ukuran ${width}x${height} bukan 9:16`,
    );
  }

  const jpeg =
    meta.format === "jpeg"
      ? input
      : await sharp(input).jpeg({ quality: 92, mozjpeg: true }).toBuffer();

  const key = finalPhotostripKey(sessionId);
  await storage().put(key, jpeg);

  const resolution = `${width}x${height}`;
  const finalUrl = `storage:${key}`;
  const [existing] = await db
    .select()
    .from(photostrips)
    .where(eq(photostrips.sessionId, sessionId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(photostrips)
      .set({ resolution, finalUrl })
      .where(eq(photostrips.id, existing.id))
      .returning();
    return updated;
  }

  // Token QR unik; diulang dengan token lain bila (jarang) bentrok.
  return withUniqueToken(async (qrToken) => {
    const [created] = await db
      .insert(photostrips)
      .values({
        id: `strip-${crypto.randomUUID()}`,
        sessionId,
        qrToken,
        resolution,
        finalUrl,
      })
      .returning();
    return created;
  });
}
