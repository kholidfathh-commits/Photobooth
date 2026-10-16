import "server-only";

import sharp, { type OverlayOptions } from "sharp";

import { computePrintLayout, type PrintSettings } from "@/lib/print-layout";

/** Resolusi lembar cetak bawaan (titik per inci). */
export const DEFAULT_PRINT_DPI = 300;

export interface PrintSheetOptions {
  dpi?: number;
  /** Tambahkan garis potong tipis di sekitar tiap strip (untuk 2/4 strip). */
  cutMarks?: boolean;
}

export interface PrintSheet {
  buffer: Buffer;
  widthPx: number;
  heightPx: number;
  widthMm: number;
  heightMm: number;
  strips: number;
}

/**
 * Layanan komposisi lembar cetak: susun photostrip di kertas sesuai
 * pengaturan (ukuran, orientasi, jumlah strip) memakai computePrintLayout —
 * perhitungan yang sama dengan pratinjau di layar — lalu render JPEG
 * resolusi cetak (300 dpi) lengkap dengan metadata DPI.
 */
export async function composePrintSheet(
  stripImage: Buffer,
  settings: Pick<PrintSettings, "paperSize" | "orientation" | "stripsPerSheet">,
  {
    dpi = DEFAULT_PRINT_DPI,
    cutMarks = settings.stripsPerSheet > 1,
  }: PrintSheetOptions = {},
): Promise<PrintSheet> {
  const meta = await sharp(stripImage).metadata();
  if (!meta.width || !meta.height)
    throw new Error("Gambar photostrip tidak valid");

  const layout = computePrintLayout(
    { printerEnabled: true, ...settings },
    meta.width,
    meta.height,
  );
  const px = (mm: number) => Math.round((mm / 25.4) * dpi);
  const widthPx = px(layout.paper.width);
  const heightPx = px(layout.paper.height);

  // Satu kali resize (+rotasi) dipakai untuk semua salinan di lembar.
  const first = layout.placements[0];
  const slotW = px(first.width);
  const slotH = px(first.height);
  const stripTile = await (
    first.rotated ? sharp(stripImage).rotate(90) : sharp(stripImage)
  )
    .resize(slotW, slotH, { fit: "contain", background: "#ffffff" })
    .jpeg({ quality: 95 })
    .toBuffer();

  const overlays: OverlayOptions[] = layout.placements.map((p) => ({
    input: stripTile,
    left: px(p.x),
    top: px(p.y),
  }));

  if (cutMarks) {
    // Garis putus-putus abu tipis 1 mm di luar tepi tiap strip.
    const gap = px(1);
    const rects = layout.placements
      .map((p) => {
        const x = px(p.x) - gap;
        const y = px(p.y) - gap;
        return `<rect x="${x}" y="${y}" width="${slotW + gap * 2}" height="${slotH + gap * 2}" fill="none" stroke="#bdbdbd" stroke-width="${Math.max(1, Math.round(dpi / 150))}" stroke-dasharray="${px(2)} ${px(1.5)}"/>`;
      })
      .join("");
    overlays.unshift({
      input: Buffer.from(
        `<svg width="${widthPx}" height="${heightPx}">${rects}</svg>`,
      ),
      left: 0,
      top: 0,
    });
  }

  const buffer = await sharp({
    create: {
      width: widthPx,
      height: heightPx,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite(overlays)
    .jpeg({ quality: 95, chromaSubsampling: "4:4:4" })
    .withMetadata({ density: dpi })
    .toBuffer();

  return {
    buffer,
    widthPx,
    heightPx,
    widthMm: layout.paper.width,
    heightMm: layout.paper.height,
    strips: layout.placements.length,
  };
}
