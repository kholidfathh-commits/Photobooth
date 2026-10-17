// Katalog frame Potretin (data runtime). Gambar latar/depan tiap frame
// dibuat sekali oleh `npm run frames:build` (scripts/build-frames.ts) dan
// disimpan di public/frames/<id>/. Semua hasil berukuran 9:16 (1080×1920).

/** Ukuran dasar hasil akhir (px) — pas layar HP. */
export const CANVAS = { width: 1080, height: 1920 } as const;

/** Naikkan bila gambar frame dibuat ulang, agar cache browser diperbarui. */
export const FRAMES_VERSION = 1;

export interface SlotRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Tata letak slot foto (semua 4:3, sama dengan jepretan kamera):
 * - tumpuk-3: 3 foto bertumpuk, tulisan di bawah
 * - kolase-3: 1 foto besar + 2 kecil, area tulisan besar di bawah
 * - tumpuk-2: 2 foto besar bertumpuk, tulisan di bawah
 */
export type LayoutKey = "tumpuk-3" | "kolase-3" | "tumpuk-2";

export const LAYOUTS: Record<LayoutKey, SlotRect[]> = {
  "tumpuk-3": [
    { x: 190, y: 70, width: 700, height: 525 },
    { x: 190, y: 619, width: 700, height: 525 },
    { x: 190, y: 1168, width: 700, height: 525 },
  ],
  "kolase-3": [
    { x: 60, y: 60, width: 960, height: 720 },
    { x: 60, y: 804, width: 468, height: 351 },
    { x: 552, y: 804, width: 468, height: 351 },
  ],
  "tumpuk-2": [
    { x: 80, y: 90, width: 920, height: 690 },
    { x: 80, y: 810, width: 920, height: 690 },
  ],
};

export interface DateStyle {
  x: number;
  y: number;
  size: number;
  color: string;
  align: "left" | "center" | "right";
  font: "sans" | "serif" | "mono";
  weight: number;
  /** Jarak antarhuruf (px). */
  spacing: number;
  /** "panjang" = 17 Oktober 2026, "titik" = 17.10.2026 */
  format: "panjang" | "titik";
}

export interface FrameTheme {
  id: string;
  name: string;
  slotCount: 2 | 3;
  layout: LayoutKey;
  /** Sudut membulat slot foto (px). */
  radius: number;
  /** Warna wakil untuk tampilan aplikasi (kartu, ilustrasi). */
  background: string;
  accent: string;
  /** Warna slot kosong (sebelum ada foto). */
  placeholder: string;
  /** Ada lapisan depan (hiasan yang menimpa foto)? */
  hasFront: boolean;
  date: DateStyle;
}

const BOTTOM_3 = 1855; // baris tanggal untuk tumpuk-3
const BOTTOM_K = 1700; // kolase-3
const BOTTOM_2 = 1835; // tumpuk-2

const date = (
  y: number,
  color: string,
  font: DateStyle["font"],
  extra: Partial<DateStyle> = {},
): DateStyle => ({
  x: CANVAS.width / 2,
  y,
  size: 30,
  color,
  align: "center",
  font,
  weight: 500,
  spacing: 4,
  format: "panjang",
  ...extra,
});

export const THEMES: FrameTheme[] = [
  // ---------- 3 foto ----------
  {
    id: "klasik-putih",
    name: "Klasik Putih",
    slotCount: 3,
    layout: "tumpuk-3",
    radius: 6,
    background: "#ffffff",
    accent: "#111111",
    placeholder: "#eeeeee",
    hasFront: false,
    date: date(BOTTOM_3, "#6b6b6b", "serif", { spacing: 6 }),
  },
  {
    id: "hitam-elegan",
    name: "Hitam Elegan",
    slotCount: 3,
    layout: "tumpuk-3",
    radius: 4,
    background: "#0c0c0c",
    accent: "#d4af37",
    placeholder: "#1f1f1f",
    hasFront: false,
    date: date(BOTTOM_3, "#d4af37", "serif", { spacing: 8 }),
  },
  {
    id: "film-analog",
    name: "Film Analog",
    slotCount: 3,
    layout: "tumpuk-3",
    radius: 2,
    background: "#141414",
    accent: "#f59e0b",
    placeholder: "#262626",
    hasFront: false,
    date: date(BOTTOM_3, "#f59e0b", "mono", { format: "titik", weight: 700 }),
  },
  {
    id: "neon-malam",
    name: "Neon Malam",
    slotCount: 3,
    layout: "tumpuk-3",
    radius: 18,
    background: "#0b0620",
    accent: "#ff3ea5",
    placeholder: "#1c1338",
    hasFront: false,
    date: date(BOTTOM_3, "#5ee7ff", "mono", { format: "titik", weight: 700 }),
  },
  {
    id: "pastel-manis",
    name: "Pastel Manis",
    slotCount: 3,
    layout: "tumpuk-3",
    radius: 28,
    background: "#ffd6e7",
    accent: "#e0457b",
    placeholder: "#ffe9f2",
    hasFront: true,
    date: date(BOTTOM_3, "#c43b6d", "sans", { weight: 700 }),
  },
  {
    id: "kertas-kraft",
    name: "Kertas Kraft",
    slotCount: 3,
    layout: "tumpuk-3",
    radius: 0,
    background: "#c9a47c",
    accent: "#3b2a1a",
    placeholder: "#f3ead9",
    hasFront: true,
    date: date(BOTTOM_3, "#3b2a1a", "mono", { format: "titik" }),
  },
  {
    id: "laut-biru",
    name: "Laut Biru",
    slotCount: 3,
    layout: "tumpuk-3",
    radius: 20,
    background: "#0e7dc2",
    accent: "#ffffff",
    placeholder: "#5fb3e6",
    hasFront: false,
    date: date(BOTTOM_3, "#e0f2fe", "sans", { weight: 600 }),
  },
  {
    id: "retro-70an",
    name: "Retro 70an",
    slotCount: 3,
    layout: "kolase-3",
    radius: 24,
    background: "#fbefd5",
    accent: "#c2410c",
    placeholder: "#f3dfb6",
    hasFront: false,
    date: date(1470, "#7c2d12", "sans", { weight: 700, size: 34 }),
  },
  {
    id: "botani",
    name: "Botani",
    slotCount: 3,
    layout: "kolase-3",
    radius: 16,
    background: "#dfe8d8",
    accent: "#2f4a32",
    placeholder: "#c9d8c0",
    hasFront: true,
    date: date(BOTTOM_K, "#2f4a32", "serif", { size: 34, spacing: 6 }),
  },
  {
    id: "pop-ceria",
    name: "Pop Ceria",
    slotCount: 3,
    layout: "kolase-3",
    radius: 0,
    background: "#ffd60a",
    accent: "#111111",
    placeholder: "#fff1a8",
    hasFront: false,
    date: date(BOTTOM_K, "#111111", "sans", { weight: 800, size: 36 }),
  },

  // ---------- 2 foto ----------
  {
    id: "monokrom",
    name: "Monokrom",
    slotCount: 2,
    layout: "tumpuk-2",
    radius: 0,
    background: "#f4f4f4",
    accent: "#0a0a0a",
    placeholder: "#dddddd",
    hasFront: false,
    date: date(BOTTOM_2, "#f4f4f4", "mono", { format: "titik", spacing: 10 }),
  },
  {
    id: "polaroid",
    name: "Polaroid",
    slotCount: 2,
    layout: "tumpuk-2",
    radius: 0,
    background: "#e9e5dc",
    accent: "#2b2b2b",
    placeholder: "#d9d4c8",
    hasFront: false,
    date: date(BOTTOM_2, "#555555", "sans", { weight: 600 }),
  },
  {
    id: "gradasi-jingga",
    name: "Gradasi Jingga",
    slotCount: 2,
    layout: "tumpuk-2",
    radius: 24,
    background: "#ff8a5b",
    accent: "#ffffff",
    placeholder: "#ffc29f",
    hasFront: false,
    date: date(BOTTOM_2, "#fff1e6", "sans", { weight: 600 }),
  },
  {
    id: "kotak-kotak",
    name: "Kotak-Kotak",
    slotCount: 2,
    layout: "tumpuk-2",
    radius: 18,
    background: "#e94b4b",
    accent: "#e94b4b",
    placeholder: "#fbd5d5",
    hasFront: false,
    date: date(BOTTOM_2, "#ffffff", "sans", { weight: 700 }),
  },
  {
    id: "y2k-krom",
    name: "Y2K Krom",
    slotCount: 2,
    layout: "tumpuk-2",
    radius: 30,
    background: "#c7b8ff",
    accent: "#1e1b4b",
    placeholder: "#e3dcff",
    hasFront: true,
    date: date(BOTTOM_2, "#1e1b4b", "mono", { format: "titik", weight: 700 }),
  },
  {
    id: "galaksi",
    name: "Galaksi",
    slotCount: 2,
    layout: "tumpuk-2",
    radius: 20,
    background: "#0f1238",
    accent: "#c4b5fd",
    placeholder: "#1e2358",
    hasFront: false,
    date: date(BOTTOM_2, "#c4b5fd", "mono", { format: "titik", spacing: 8 }),
  },
  {
    id: "bunga-liar",
    name: "Bunga Liar",
    slotCount: 2,
    layout: "tumpuk-2",
    radius: 22,
    background: "#fff7ed",
    accent: "#9d174d",
    placeholder: "#fde7d3",
    hasFront: true,
    date: date(BOTTOM_2, "#9d174d", "serif", { spacing: 6 }),
  },
  {
    id: "warna-warni",
    name: "Warna-Warni",
    slotCount: 2,
    layout: "tumpuk-2",
    radius: 26,
    background: "#ffffff",
    accent: "#2563eb",
    placeholder: "#eef2ff",
    hasFront: false,
    date: date(BOTTOM_2, "#334155", "sans", { weight: 700 }),
  },
];

const BY_ID = new Map(THEMES.map((t) => [t.id, t]));

export function findTheme(id: string): FrameTheme | undefined {
  return BY_ID.get(id);
}

/** Alamat gambar frame di /public. */
export function frameAssetUrl(
  id: string,
  kind: "latar" | "depan" | "pratinjau",
): string {
  return `/frames/${id}/${kind}.webp?v=${FRAMES_VERSION}`;
}
