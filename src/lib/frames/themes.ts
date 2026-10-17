// Katalog frame Potretin (data runtime). Gambar latar/depan tiap frame
// dibuat sekali oleh `npm run frames:build` (scripts/build-frames.ts) dan
// disimpan di public/frames/<id>/. Semua hasil berukuran 9:16 (1080×1920).

import { KOLEKSI, type Kategori, type KoleksiSpec } from "./koleksi";

export { KATEGORI_URUT, type Kategori } from "./koleksi";

/** Ukuran dasar hasil akhir (px) — pas layar HP. */
export const CANVAS = { width: 1080, height: 1920 } as const;

/** Naikkan bila gambar frame dibuat ulang, agar cache browser diperbarui. */
export const FRAMES_VERSION = 2;

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
 * - tumpuk-3-atas / tumpuk-2-atas: seperti di atas, tulisan di bagian atas
 * - tumpuk-3-kiri: 3 foto di kiri, tulisan tegak di kolom kanan
 * - kolase-3-balik: 2 foto kecil di atas, 1 besar di bawahnya
 */
export type LayoutKey =
  | "tumpuk-3"
  | "kolase-3"
  | "tumpuk-2"
  | "tumpuk-3-atas"
  | "tumpuk-3-kiri"
  | "kolase-3-balik"
  | "tumpuk-2-atas";

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
  "tumpuk-3-atas": [
    { x: 200, y: 280, width: 680, height: 510 },
    { x: 200, y: 814, width: 680, height: 510 },
    { x: 200, y: 1348, width: 680, height: 510 },
  ],
  "tumpuk-3-kiri": [
    { x: 56, y: 171, width: 680, height: 510 },
    { x: 56, y: 705, width: 680, height: 510 },
    { x: 56, y: 1239, width: 680, height: 510 },
  ],
  "kolase-3-balik": [
    { x: 60, y: 60, width: 468, height: 351 },
    { x: 552, y: 60, width: 468, height: 351 },
    { x: 60, y: 435, width: 960, height: 720 },
  ],
  "tumpuk-2-atas": [
    { x: 80, y: 420, width: 920, height: 690 },
    { x: 80, y: 1140, width: 920, height: 690 },
  ],
};

/** Area tulisan utama tiap tata letak (dipakai desain frame koleksi). */
export interface TextArea {
  cx: number;
  cy: number;
  maxW: number;
  maxH: number;
  /** Tulisan diputar 90° (kolom tegak). */
  vertical?: boolean;
  /** Baris tanggal bila ada tulisan utama / bila tanpa tulisan. */
  dateY: number;
  dateYPolos: number;
}

export const TEXT_AREAS: Record<LayoutKey, TextArea> = {
  "tumpuk-3": {
    cx: 540,
    cy: 1772,
    maxW: 480,
    maxH: 100,
    dateY: 1855,
    dateYPolos: 1806,
  },
  "tumpuk-2": {
    cx: 540,
    cy: 1655,
    maxW: 660,
    maxH: 150,
    dateY: 1835,
    dateYPolos: 1710,
  },
  "kolase-3": {
    cx: 540,
    cy: 1430,
    maxW: 820,
    maxH: 190,
    dateY: 1650,
    dateYPolos: 1540,
  },
  "kolase-3-balik": {
    cx: 540,
    cy: 1430,
    maxW: 820,
    maxH: 190,
    dateY: 1650,
    dateYPolos: 1540,
  },
  "tumpuk-3-atas": {
    cx: 540,
    cy: 128,
    maxW: 520,
    maxH: 104,
    dateY: 232,
    dateYPolos: 142,
  },
  "tumpuk-2-atas": {
    cx: 540,
    cy: 190,
    maxW: 700,
    maxH: 150,
    dateY: 350,
    dateYPolos: 214,
  },
  "tumpuk-3-kiri": {
    cx: 908,
    cy: 960,
    maxW: 1380,
    maxH: 190,
    vertical: true,
    dateY: 1842,
    dateYPolos: 1842,
  },
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
  kategori: Kategori;
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

const ASLI: FrameTheme[] = [
  // ---------- 3 foto ----------
  {
    id: "klasik-putih",
    kategori: "Minimalis",
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
    kategori: "Elegan",
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
    kategori: "Retro",
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
    kategori: "Ceria",
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
    kategori: "Ceria",
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
    kategori: "Tekstur",
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
    kategori: "Alam",
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
    kategori: "Retro",
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
    kategori: "Alam",
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
    kategori: "Ceria",
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
    kategori: "Minimalis",
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
    kategori: "Retro",
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
    kategori: "Gradasi",
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
    kategori: "Pola",
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
    kategori: "Ceria",
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
    kategori: "Alam",
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
    kategori: "Alam",
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
    kategori: "Ceria",
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

/** Ubah spesifikasi ringkas koleksi menjadi tema runtime. */
function dariKoleksi(k: KoleksiSpec): FrameTheme {
  const area = TEXT_AREAS[k.layout];
  const polos = k.teks === null;
  return {
    id: k.id,
    name: k.name,
    kategori: k.kategori,
    slotCount: LAYOUTS[k.layout].length as 2 | 3,
    layout: k.layout,
    radius: k.radius,
    background: k.bg,
    accent: k.ink,
    placeholder: k.soft,
    hasFront: Boolean(k.front),
    date: date(
      polos ? area.dateYPolos : area.dateY,
      k.dateColor ?? k.ink,
      k.dateFont,
      {
        size: polos ? 40 : 30,
        spacing: polos ? 8 : 5,
        weight: k.dateFont === "sans" ? 600 : 500,
        format: k.dateFont === "mono" ? "titik" : "panjang",
      },
    ),
  };
}

export const THEMES: FrameTheme[] = [...ASLI, ...KOLEKSI.map(dariKoleksi)];

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
