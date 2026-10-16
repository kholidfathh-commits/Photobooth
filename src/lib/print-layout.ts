// Pengaturan & perhitungan susunan cetak photostrip di satu lembar kertas.
// Murni (tanpa DOM) — dipakai pratinjau, lembar cetak, dan backend print job.

export const PAPER_SIZES = {
  "4R": { label: "4R (10×15 cm)", width: 102, height: 152 },
  A6: { label: "A6 (10,5×14,8 cm)", width: 105, height: 148 },
  A5: { label: "A5 (14,8×21 cm)", width: 148, height: 210 },
  A4: { label: "A4 (21×29,7 cm)", width: 210, height: 297 },
} as const;
export type PaperSize = keyof typeof PAPER_SIZES;

export type Orientation = "potret" | "lanskap";
/** Jumlah photostrip yang disusun dalam satu lembar. */
export type StripsPerSheet = 1 | 2 | 4;

export interface PrintSettings {
  /** Fitur cetak aktif? Matikan bila tidak ada printer di lokasi acara. */
  printerEnabled: boolean;
  paperSize: PaperSize;
  orientation: Orientation;
  stripsPerSheet: StripsPerSheet;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  printerEnabled: true,
  paperSize: "4R",
  orientation: "potret",
  stripsPerSheet: 2,
};

export interface Placement {
  /** Posisi & ukuran dalam milimeter dari pojok kiri atas kertas. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** true = strip diputar 90° agar lebih besar di kertas lanskap. */
  rotated: boolean;
}

export interface PrintLayout {
  paper: { width: number; height: number };
  placements: Placement[];
  /** Lebar strip tercetak (mm), untuk info ke operator. */
  stripWidthMm: number;
}

const MARGIN = 4; // mm
const GAP = 4; // mm

/**
 * Susun `stripsPerSheet` photostrip (rasio lebar:tinggi = stripW:stripH)
 * sebesar mungkin di kertas. Mencoba semua susunan kolom×baris dan rotasi
 * 90°, lalu memilih yang membuat strip paling besar.
 */
export function computePrintLayout(
  settings: PrintSettings,
  stripW: number,
  stripH: number,
): PrintLayout {
  const base = PAPER_SIZES[settings.paperSize];
  const paper =
    settings.orientation === "potret"
      ? { width: base.width, height: base.height }
      : { width: base.height, height: base.width };
  const n = settings.stripsPerSheet;
  const usableW = paper.width - MARGIN * 2;
  const usableH = paper.height - MARGIN * 2;

  let best: {
    cols: number;
    rows: number;
    w: number;
    h: number;
    rotated: boolean;
  } | null = null;
  for (let cols = 1; cols <= n; cols++) {
    if (n % cols !== 0) continue;
    const rows = n / cols;
    const cellW = (usableW - GAP * (cols - 1)) / cols;
    const cellH = (usableH - GAP * (rows - 1)) / rows;
    for (const rotated of [false, true]) {
      const [sw, sh] = rotated ? [stripH, stripW] : [stripW, stripH];
      const scale = Math.min(cellW / sw, cellH / sh);
      if (scale <= 0) continue;
      const w = sw * scale;
      const h = sh * scale;
      if (!best || w * h > best.w * best.h)
        best = { cols, rows, w, h, rotated };
    }
  }
  if (!best) throw new Error("Kertas terlalu kecil untuk susunan ini");

  const { cols, rows, w, h, rotated } = best;
  const totalW = cols * w + (cols - 1) * GAP;
  const totalH = rows * h + (rows - 1) * GAP;
  const offsetX = (paper.width - totalW) / 2;
  const offsetY = (paper.height - totalH) / 2;

  const placements: Placement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      placements.push({
        x: offsetX + c * (w + GAP),
        y: offsetY + r * (h + GAP),
        width: w,
        height: h,
        rotated,
      });
    }
  }
  return { paper, placements, stripWidthMm: Math.round(rotated ? h : w) };
}
