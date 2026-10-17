// Penggabungan jepretan + frame menjadi satu gambar 9:16 (di browser, lewat
// canvas) — hemat beban server. Desain frame: src/lib/frames/.

import {
  dateFont,
  formatFrameDate,
  resolveTheme,
  slotRectsFor,
} from "./frames/resolve";
import { CANVAS, frameAssetUrl, LAYOUTS, type SlotRect } from "./frames/themes";
import type { Frame, Shot } from "./types";

/** Ukuran maksimum hasil gabungan agar muat dikirim ke server (byte). */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export interface ComposeOptions {
  /** Pengali resolusi; 1 = 1080×1920 (9:16, seukuran layar HP). */
  scale?: number;
  /** Tanggal yang dicetak di frame. */
  date?: Date;
  mimeType?: "image/jpeg" | "image/png";
  quality?: number;
}

export interface ComposedPhotostrip {
  blob: Blob;
  width: number;
  height: number;
}

export type { SlotRect };

/** Ukuran akhir photostrip (selalu 9:16) untuk skala tertentu. */
export function photostripSize(scale = 1) {
  return {
    width: Math.round(CANVAS.width * scale),
    height: Math.round(CANVAS.height * scale),
  };
}

/** Posisi tiap slot foto frame (koordinat dasar 1080×1920). */
export function photostripSlotRects(frame: Frame): SlotRect[] {
  return slotRectsFor(frame);
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

function loadImage(src: string, label: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(
      () => reject(new Error(`${label} terlalu lama dimuat`)),
      LOAD_TIMEOUT_MS,
    );
    img.decoding = "async";
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`${label} tidak bisa dibaca`));
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

/**
 * Gabungkan jepretan sesi ke dalam frame menjadi satu gambar 9:16:
 * latar frame → foto di tiap slot → hiasan depan → tanggal.
 * Slot tanpa foto diisi warna polos.
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
  const theme = resolveTheme(frame);
  const size = photostripSize(scale);

  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung di perangkat ini");

  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const [latar, depan, ...photos] = await Promise.all([
    theme.hasArt
      ? loadImage(frameAssetUrl(theme.id, "latar"), "Gambar frame")
      : null,
    theme.hasArt && theme.hasFront
      ? loadImage(frameAssetUrl(theme.id, "depan"), "Hiasan frame")
      : null,
    ...arrangeShots(frame.slotCount, shots).map((shot, i) =>
      shot ? loadImage(shot.src, `Foto ${i + 1}`) : null,
    ),
  ]);

  // 1) Latar frame (atau warna polos untuk frame tanpa desain).
  if (latar) {
    ctx.drawImage(latar, 0, 0, CANVAS.width, CANVAS.height);
  } else {
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  }

  // 2) Foto di slot, sesuai urutan pengambilan.
  const rects = LAYOUTS[theme.layout];
  photos.forEach((img, i) => {
    const { x, y, width, height } = rects[i];
    if (img) {
      drawCover(ctx, img, x, y, width, height, theme.radius);
    } else {
      ctx.fillStyle = theme.placeholder;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, theme.radius);
      ctx.fill();
    }
  });

  // 3) Hiasan yang menimpa foto (selotip, bunga, kilau, …).
  if (depan) ctx.drawImage(depan, 0, 0, CANVAS.width, CANVAS.height);

  // Frame tanpa desain: tulis merek dengan font sistem.
  if (!latar) {
    ctx.fillStyle = theme.accent;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 96px Georgia, 'Times New Roman', serif";
    ctx.fillText("Potretin", CANVAS.width / 2, theme.date.y - 100);
  }

  // 4) Tanggal sesi.
  const d = theme.date;
  ctx.fillStyle = d.color;
  ctx.textAlign = d.align;
  ctx.textBaseline = "middle";
  ctx.font = dateFont(d);
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${d.spacing}px`;
  ctx.fillText(formatFrameDate(date, d.format), d.x, d.y);

  const toBlob = (q: number) =>
    new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error("Gagal membuat gambar photostrip")),
        mimeType,
        q,
      ),
    );

  // Batas unggah server (Vercel ±4,5 MB): turunkan kualitas JPEG sedikit
  // demi sedikit bila berkas terlalu besar.
  let q = quality;
  let blob = await toBlob(q);
  while (mimeType === "image/jpeg" && blob.size > MAX_UPLOAD_BYTES && q > 0.6) {
    q = Math.round((q - 0.08) * 100) / 100;
    blob = await toBlob(q);
  }

  return { blob, width: size.width, height: size.height };
}
