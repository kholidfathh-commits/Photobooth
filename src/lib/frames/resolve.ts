import type { Frame } from "../types";

import {
  CANVAS,
  findTheme,
  LAYOUTS,
  type DateStyle,
  type FrameTheme,
  type SlotRect,
} from "./themes";

/**
 * Tema untuk sebuah frame. Frame katalog memakai desainnya sendiri; frame
 * lain (mis. ditambahkan langsung di database) memakai tata letak bawaan
 * dengan warna dari datanya, tanpa gambar latar.
 */
export function resolveTheme(frame: Frame): FrameTheme & { hasArt: boolean } {
  const theme = findTheme(frame.id);
  if (theme) return { ...theme, hasArt: true };
  return {
    id: frame.id,
    name: frame.name,
    kategori: "Minimalis",
    slotCount: frame.slotCount,
    layout: frame.slotCount === 2 ? "tumpuk-2" : "tumpuk-3",
    radius: 16,
    background: frame.background,
    accent: frame.accent,
    placeholder: `${frame.accent}22`,
    hasFront: false,
    hasArt: false,
    date: {
      x: CANVAS.width / 2,
      y: frame.slotCount === 2 ? 1835 : 1880,
      size: 30,
      color: frame.accent,
      align: "center",
      font: "sans",
      weight: 500,
      spacing: 4,
      format: "panjang",
    },
  };
}

export function slotRectsFor(frame: Frame): SlotRect[] {
  return LAYOUTS[resolveTheme(frame).layout];
}

const FONT_STACK: Record<DateStyle["font"], string> = {
  sans: "-apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "Menlo, 'Courier New', Courier, monospace",
};

export function dateFont(style: DateStyle, scale = 1): string {
  return `${style.weight} ${Math.round(style.size * scale)}px ${FONT_STACK[style.font]}`;
}

/** Teks tanggal sesuai gaya frame: "17 Oktober 2026" atau "17.10.2026". */
export function formatFrameDate(
  date: Date,
  format: DateStyle["format"],
): string {
  if (format === "titik") {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(date.getDate())}.${p(date.getMonth() + 1)}.${date.getFullYear()}`;
  }
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
