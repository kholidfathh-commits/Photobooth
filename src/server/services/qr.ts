import "server-only";

import { eq } from "drizzle-orm";
import QRCode from "qrcode";

import { db } from "@/db";
import { photostrips, type PhotostripRow } from "@/db/schema";
import { randomToken } from "@/lib/token";

/** Batas percobaan bila token acak kebetulan bentrok dengan yang ada. */
const MAX_TOKEN_TRIES = 5;

function isUniqueViolation(err: unknown) {
  const text = String((err as { cause?: unknown })?.cause ?? err);
  return /UNIQUE constraint failed/i.test(text);
}

/**
 * Jalankan `write(token)` dengan token acak baru; bila bentrok dengan token
 * unik yang sudah ada (sangat jarang), ulangi dengan token lain.
 */
export async function withUniqueToken<T>(
  write: (token: string) => Promise<T>,
): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await write(randomToken());
    } catch (err) {
      if (!isUniqueViolation(err) || i >= MAX_TOKEN_TRIES) throw err;
    }
  }
}

/**
 * Pastikan photostrip punya token QR yang aktif. Token yang sudah ada
 * dipertahankan (QR lama tetap berlaku); token yang dicabut diganti baru.
 */
export async function ensureActiveQrToken(
  photostrip: PhotostripRow,
): Promise<PhotostripRow> {
  if (photostrip.qrToken && !photostrip.tokenRevokedAt) return photostrip;
  return withUniqueToken(async (qrToken) => {
    const [row] = await db
      .update(photostrips)
      .set({ qrToken, tokenRevokedAt: null })
      .where(eq(photostrips.id, photostrip.id))
      .returning();
    return row;
  });
}

export interface QrPayload {
  token: string;
  /** Alamat halaman unduh publik yang dikodekan di QR. */
  url: string;
  path: string;
  /** Gambar QR (SVG) siap tampil: data:image/svg+xml;… */
  svgDataUrl: string;
}

/** Buat isi QR (URL halaman unduh + gambar SVG) untuk sebuah token. */
export async function buildQrPayload(
  token: string,
  baseUrl: string,
): Promise<QrPayload> {
  const path = `/unduh/${encodeURIComponent(token)}`;
  const url = `${baseUrl.replace(/\/+$/, "")}${path}`;
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
  });
  return {
    token,
    url,
    path,
    svgDataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  };
}

/** Alamat dasar publik: NEXT_PUBLIC_APP_URL bila diisi, selain itu origin permintaan. */
export function publicBaseUrl(requestOrigin: string) {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || requestOrigin;
}
