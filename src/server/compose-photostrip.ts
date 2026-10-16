import "server-only";

import sharp, { type OverlayOptions } from "sharp";

import {
  arrangeShots,
  photostripSize,
  photostripSlotRects,
  STRIP_BASE,
} from "@/lib/photostrip";
import type { Frame } from "@/lib/types";
import { validatePhotosForFrame } from "@/lib/validate-photos";

/**
 * Layanan komposisi photostrip resolusi tinggi di server (sharp).
 * Tata letaknya sama persis dengan versi canvas di browser
 * (lib/photostrip.ts), jadi hasil cetak/unduh identik dengan pratinjau.
 */

export interface SourcePhoto {
  orderIndex: number;
  /** Waktu jepret (ISO); dipakai bila ada dua foto di slot yang sama. */
  takenAt: string;
  /** Isi file gambar (JPEG/PNG/WebP/HEIC). */
  data: Buffer;
}

export interface ComposeImageOptions {
  /** Pengali resolusi; 3 = lebar 1800 px (≈300 dpi pada 6 inci). */
  scale?: number;
  date?: Date;
  /** Kualitas JPEG 1–100. */
  quality?: number;
  /** Izinkan slot kosong (mis. pratinjau). Default: semua slot wajib terisi. */
  allowIncomplete?: boolean;
}

export interface ComposedImage {
  buffer: Buffer;
  width: number;
  height: number;
  /** Mis. "1800x4128" — disimpan di kolom photostrips.resolution. */
  resolution: string;
  mimeType: "image/jpeg";
}

export class ComposeError extends Error {
  constructor(
    message: string,
    /** Rincian masalah validasi (bila ada). */
    readonly issues: { code: string; message: string }[] = [],
  ) {
    super(message);
    this.name = "ComposeError";
  }
}

const MAX_SCALE = 4;

function escapeXml(text: string) {
  return text.replace(/[<>&'"]/g, (c) =>
    c === "<"
      ? "&lt;"
      : c === ">"
        ? "&gt;"
        : c === "&"
          ? "&amp;"
          : c === "'"
            ? "&apos;"
            : "&quot;",
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Foto dipotong memenuhi slot (cover) dengan sudut membulat. */
async function slotImage(
  data: Buffer,
  width: number,
  height: number,
  radius: number,
  index: number,
): Promise<Buffer> {
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}"/></svg>`,
  );
  try {
    return await sharp(data)
      .rotate() // ikuti orientasi EXIF dari kamera
      .resize(width, height, { fit: "cover", position: "centre" })
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();
  } catch {
    throw new ComposeError(`Foto ${index + 1} tidak bisa dibaca`);
  }
}

export async function composePhotostripImage(
  frame: Frame,
  photos: SourcePhoto[],
  {
    scale = 3,
    date = new Date(),
    quality = 90,
    allowIncomplete = false,
  }: ComposeImageOptions = {},
): Promise<ComposedImage> {
  if (!(scale > 0 && scale <= MAX_SCALE)) {
    throw new ComposeError(`Skala harus di antara 0 dan ${MAX_SCALE}`);
  }
  if (photos.length === 0)
    throw new ComposeError("Tidak ada foto untuk digabung");

  const check = validatePhotosForFrame(frame.slotCount, photos);
  const blocking = check.issues.filter(
    (i) => !(allowIncomplete && i.code === "jumlah_kurang"),
  );
  if (blocking.length > 0) {
    throw new ComposeError(blocking.map((i) => i.message).join("; "), blocking);
  }

  const size = photostripSize(frame.slotCount, scale);
  const s = (n: number) => Math.round(n * scale);
  const radius = s(STRIP_BASE.radius);
  const rects = photostripSlotRects(frame.slotCount);
  const arranged = arrangeShots(frame.slotCount, photos);

  const layers: OverlayOptions[] = await Promise.all(
    arranged.map(async (photo, i) => {
      const r = rects[i];
      const [left, top, width, height] = [
        s(r.x),
        s(r.y),
        s(r.width),
        s(r.height),
      ];
      const input = photo
        ? await slotImage(photo.data, width, height, radius, i)
        : Buffer.from(
            `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="${frame.accent}" fill-opacity="0.13"/></svg>`,
          );
      return { input, left, top };
    }),
  );

  // Caption & tanggal di bagian bawah (sama dengan versi canvas).
  const footerTop = rects[rects.length - 1].y + rects[rects.length - 1].height;
  const cx = STRIP_BASE.width / 2;
  const footer = STRIP_BASE.footer;
  const font = "Helvetica Neue, Helvetica, Arial, sans-serif";
  const captionSvg = `<svg width="${size.width}" height="${size.height}" viewBox="0 0 ${STRIP_BASE.width} ${size.height / scale}">
  <text x="${cx}" y="${footerTop + footer * 0.42}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-weight="700" font-size="24" letter-spacing="6" fill="${frame.accent}">${escapeXml(frame.caption.toUpperCase())}</text>
  <text x="${cx}" y="${footerTop + footer * 0.72}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-weight="500" font-size="16" letter-spacing="1" fill="${frame.accent}" fill-opacity="0.7">${escapeXml(formatDate(date))}</text>
</svg>`;
  layers.push({ input: Buffer.from(captionSvg), left: 0, top: 0 });

  const buffer = await sharp({
    create: {
      width: size.width,
      height: size.height,
      channels: 3,
      background: frame.background,
    },
  })
    .composite(layers)
    .jpeg({ quality, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .withMetadata({ density: 300 })
    .toBuffer();

  return {
    buffer,
    width: size.width,
    height: size.height,
    resolution: `${size.width}x${size.height}`,
    mimeType: "image/jpeg",
  };
}
