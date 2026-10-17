// Data cadangan & contoh untuk tampilan (frame katalog, foto contoh).

import { THEMES } from "./frames/themes";
import type { Frame, PhotoSession, Shot } from "./types";

/**
 * Frame cadangan (dipakai sebelum daftar dari server termuat / saat offline):
 * seluruh katalog frame Potretin.
 */
export const MOCK_FRAMES: Frame[] = THEMES.map((t) => ({
  id: t.id,
  name: t.name,
  slotCount: t.slotCount,
  background: t.background,
  accent: t.accent,
  caption: "Potretin",
  isActive: true,
}));

/** Gambar SVG polos sebagai pengganti hasil jepretan kamera. */
export function mockShotImage(label: string, from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
  </linearGradient></defs>
  <rect width="400" height="300" fill="url(#g)"/>
  <circle cx="200" cy="125" r="48" fill="rgba(255,255,255,0.55)"/>
  <rect x="120" y="185" width="160" height="90" rx="45" fill="rgba(255,255,255,0.55)"/>
  <text x="20" y="40" font-family="sans-serif" font-size="22" fill="rgba(255,255,255,0.9)">${label}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const MOCK_SHOTS: Shot[] = [
  {
    id: "shot-1",
    orderIndex: 0,
    src: mockShotImage("Foto 1", "#f97316", "#db2777"),
    takenAt: "2026-10-14T07:01:05.000Z",
  },
  {
    id: "shot-2",
    orderIndex: 1,
    src: mockShotImage("Foto 2", "#0ea5e9", "#6366f1"),
    takenAt: "2026-10-14T07:01:10.000Z",
  },
  {
    id: "shot-3",
    orderIndex: 2,
    src: mockShotImage("Foto 3", "#22c55e", "#0d9488"),
    takenAt: "2026-10-14T07:01:15.000Z",
  },
];

/** Sesi contoh: frame 3 foto, belum ada jepretan, siap mulai. */
export const MOCK_SESSION: PhotoSession = {
  id: "sesi-tiruan-001",
  frameId: "frame-cfd-pagi",
  status: "siap",
  shots: [],
  startedAt: "2026-10-14T07:00:00.000Z",
};

export function findFrame(frameId: string): Frame {
  return MOCK_FRAMES.find((f) => f.id === frameId) ?? MOCK_FRAMES[0];
}
