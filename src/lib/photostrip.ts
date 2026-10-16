// Penggabungan jepretan + frame menjadi satu gambar photostrip (di browser,
// lewat canvas) — hemat beban server, sesuai arsitektur PRD.

import type { Frame, Shot } from "./types";

/** Ukuran dasar photostrip (px) sebelum dikali skala. */
export const STRIP_BASE = {
  width: 600,
  padding: 28,
  gap: 16,
  radius: 14,
  footer: 92,
} as const;

export interface ComposeOptions {
  /** Pengali resolusi; 1 = lebar 600 px. */
  scale?: number;
  /** Tanggal yang dicetak di bawah caption. */
  date?: Date;
  mimeType?: "image/jpeg" | "image/png";
  quality?: number;
}

export interface ComposedPhotostrip {
  blob: Blob;
  width: number;
  height: number;
}

/** Ukuran akhir photostrip untuk jumlah slot & skala tertentu. */
export function photostripSize(slotCount: number, scale = 1) {
  const { width, padding, gap, footer } = STRIP_BASE;
  const slotW = width - padding * 2;
  const slotH = Math.round((slotW * 3) / 4);
  const height = padding + slotCount * slotH + (slotCount - 1) * gap + footer;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    slotW,
    slotH,
  };
}

export interface SlotRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Posisi tiap slot foto (koordinat dasar, sebelum skala), dari atas ke bawah. */
export function photostripSlotRects(slotCount: number): SlotRect[] {
  const { padding, gap } = STRIP_BASE;
  const { slotW, slotH } = photostripSize(slotCount);
  return Array.from({ length: slotCount }, (_, i) => ({
    x: padding,
    y: padding + i * (slotH + gap),
    width: slotW,
    height: slotH,
  }));
}

/**
 * Susun jepretan ke slot frame sesuai urutan pengambilan (orderIndex):
 * slot ke-i berisi foto dengan orderIndex i. Bila ada dua foto untuk slot
 * yang sama (mis. hasil ulang), yang terbaru dipakai. Foto dengan urutan di
 * luar jumlah slot mengisi slot kosong pertama; sisanya diabaikan.
 */
export function arrangeShots<T extends Pick<Shot, "orderIndex" | "takenAt">>(
  slotCount: number,
  shots: T[],
): (T | null)[] {
  const slots: (T | null)[] = Array.from({ length: slotCount }, () => null);
  const newestFirst = [...shots].sort((a, b) =>
    b.takenAt.localeCompare(a.takenAt),
  );
  const leftovers: T[] = [];

  for (const shot of newestFirst) {
    const i = shot.orderIndex;
    if (i >= 0 && i < slotCount) {
      if (!slots[i]) slots[i] = shot;
    } else {
      leftovers.push(shot);
    }
  }
  leftovers
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .forEach((shot) => {
      const empty = slots.indexOf(null);
      if (empty !== -1) slots[empty] = shot;
    });

  return slots;
}

/** Sidik unik kombinasi frame + jepretan; berubah bila ada foto diulang. */
export function photostripSourceKey(frame: Frame, shots: Shot[]): string {
  return [frame.id, ...shots.map((s) => `${s.orderIndex}:${s.id}`)].join("|");
}

/** Batas waktu memuat satu foto sebelum dianggap gagal (ms). */
const LOAD_TIMEOUT_MS = 10_000;

function loadImage(src: string, index: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(
      () => reject(new Error(`Foto ${index + 1} terlalu lama dimuat`)),
      LOAD_TIMEOUT_MS,
    );
    img.decoding = "async";
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`Foto ${index + 1} tidak bisa dibaca`));
    };
    img.src = src;
  });
}

/** Gambar foto memenuhi kotak (object-fit: cover) dengan sudut membulat. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Gabungkan jepretan sesi ke dalam frame menjadi satu gambar photostrip.
 * Slot diisi sesuai orderIndex; slot tanpa foto dibiarkan berwarna polos.
 */
export async function composePhotostrip(
  frame: Frame,
  shots: Shot[],
  {
    scale = 1,
    date = new Date(),
    mimeType = "image/jpeg",
    quality = 0.92,
  }: ComposeOptions = {},
): Promise<ComposedPhotostrip> {
  const { padding, gap, radius, footer } = STRIP_BASE;
  const size = photostripSize(frame.slotCount, scale);

  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung di perangkat ini");

  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Latar frame
  ctx.fillStyle = frame.background;
  ctx.fillRect(0, 0, STRIP_BASE.width, size.height / scale);

  // Slot foto, diisi sesuai urutan pengambilan
  const rects = photostripSlotRects(frame.slotCount);
  const images = await Promise.all(
    arrangeShots(frame.slotCount, shots).map((shot, i) =>
      shot ? loadImage(shot.src, i) : null,
    ),
  );
  images.forEach((img, i) => {
    const { x, y, width, height } = rects[i];
    if (img) {
      drawCover(ctx, img, x, y, width, height, radius);
    } else {
      ctx.fillStyle = `${frame.accent}22`;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
    }
  });

  // Caption & tanggal di bagian bawah
  const footerTop =
    padding + frame.slotCount * size.slotH + (frame.slotCount - 1) * gap;
  const centerX = STRIP_BASE.width / 2;
  ctx.fillStyle = frame.accent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) ctx.letterSpacing = "6px";
  ctx.font =
    "700 24px ui-sans-serif, -apple-system, 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(frame.caption.toUpperCase(), centerX, footerTop + footer * 0.42);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "1px";
  ctx.globalAlpha = 0.7;
  ctx.font =
    "500 16px ui-sans-serif, -apple-system, 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(formatDate(date), centerX, footerTop + footer * 0.72);
  ctx.globalAlpha = 1;

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error("Gagal membuat gambar photostrip")),
      mimeType,
      quality,
    ),
  );

  return { blob, width: size.width, height: size.height };
}
