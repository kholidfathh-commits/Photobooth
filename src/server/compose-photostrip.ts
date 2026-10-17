import "server-only";

import sharp, { type OverlayOptions } from "sharp";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { formatFrameDate, resolveTheme } from "@/lib/frames/resolve";
import { CANVAS, LAYOUTS } from "@/lib/frames/themes";
import { arrangeShots, photostripSize } from "@/lib/photostrip";
import type { Frame } from "@/lib/types";
import { validatePhotosForFrame } from "@/lib/validate-photos";

/**
 * Layanan komposisi photostrip resolusi tinggi di server (sharp).
 * Memakai gambar & tata letak frame yang sama dengan versi canvas di
 * browser (lib/photostrip.ts), jadi hasilnya identik dengan pratinjau.
 */

export interface SourcePhoto {
  orderIndex: number;
  /** Waktu jepret (ISO); dipakai bila ada dua foto di slot yang sama. */
  takenAt: string;
  /** Isi file gambar (JPEG/PNG/WebP/HEIC). */
  data: Buffer;
}

export interface ComposeImageOptions {
  /** Pengali resolusi; 1 = 1080×1920 (9:16). */
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

const MAX_SCALE = 3;

/** Gambar frame dari public/frames (disertakan ke fungsi server, lihat next.config). */
async function frameAsset(
  id: string,
  kind: "latar" | "depan",
): Promise<Buffer | null> {
  try {
    return await readFile(
      path.join(
        /*turbopackIgnore: true*/ process.cwd(),
        "public",
        "frames",
        id,
        `${kind}.webp`,
      ),
    );
  } catch {
    return null;
  }
}

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
    scale = 1,
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

  const theme = resolveTheme(frame);
  const size = photostripSize(scale);
  const s = (n: number) => Math.round(n * scale);
  const radius = s(theme.radius);
  const rects = LAYOUTS[theme.layout];
  const arranged = arrangeShots(frame.slotCount, photos);

  const layers: OverlayOptions[] = [];

  // 1) Latar frame (gambar katalog), diskalakan ke ukuran hasil.
  const latar = theme.hasArt ? await frameAsset(theme.id, "latar") : null;
  if (latar) {
    layers.push({
      input: await sharp(latar).resize(size.width, size.height).toBuffer(),
      left: 0,
      top: 0,
    });
  }

  // 2) Foto di slot.
  const slots = await Promise.all(
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
            `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="${theme.placeholder}"/></svg>`,
          );
      return { input, left, top };
    }),
  );
  layers.push(...slots);

  // 3) Hiasan depan.
  const depan =
    theme.hasArt && theme.hasFront ? await frameAsset(theme.id, "depan") : null;
  if (depan) {
    layers.push({
      input: await sharp(depan).resize(size.width, size.height).toBuffer(),
      left: 0,
      top: 0,
    });
  }

  // 4) Tanggal (dan merek untuk frame tanpa desain).
  const d = theme.date;
  const family =
    d.font === "mono"
      ? "DejaVu Sans Mono, Menlo, monospace"
      : d.font === "serif"
        ? "DejaVu Serif, Georgia, serif"
        : "DejaVu Sans, Helvetica, Arial, sans-serif";
  const anchor =
    d.align === "left" ? "start" : d.align === "right" ? "end" : "middle";
  const textSvg = `<svg width="${size.width}" height="${size.height}" viewBox="0 0 ${CANVAS.width} ${CANVAS.height}">
  ${latar ? "" : `<text x="${CANVAS.width / 2}" y="${d.y - 100}" text-anchor="middle" dominant-baseline="middle" font-family="DejaVu Serif, Georgia, serif" font-weight="700" font-size="96" fill="${theme.accent}">Potretin</text>`}
  <text x="${d.x}" y="${d.y}" text-anchor="${anchor}" dominant-baseline="middle" font-family="${family}" font-weight="${d.weight}" font-size="${d.size}" letter-spacing="${d.spacing}" fill="${d.color}">${escapeXml(formatFrameDate(date, d.format))}</text>
</svg>`;
  layers.push({ input: Buffer.from(textSvg), left: 0, top: 0 });

  const buffer = await sharp({
    create: {
      width: size.width,
      height: size.height,
      channels: 3,
      background: theme.background,
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
