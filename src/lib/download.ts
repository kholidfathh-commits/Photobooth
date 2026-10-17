// Bentuk data halaman unduh publik (dipakai server & tampilan).

export interface DownloadInfo {
  qrToken: string;
  /** URL gambar photostrip yang bisa diunduh. */
  imageUrl: string;
  fileName: string;
  frameName: string;
  width: number;
  height: number;
  createdAt: string;
}

/** Rapikan token dari URL: hapus spasi & ubah ke huruf kecil. */
export function normalizeToken(raw: string): string {
  let token = raw;
  try {
    token = decodeURIComponent(raw);
  } catch {
    /* biarkan apa adanya */
  }
  return token.replace(/\s+/g, "").toLowerCase();
}

/** Token QR berupa huruf kecil & angka, 6–32 karakter. */
export function isValidToken(token: string): boolean {
  return /^[a-z0-9]{6,32}$/.test(token);
}

/** Contoh data untuk mode pengembangan (token yang tidak ada di database). */
export function demoDownloadInfo(qrToken: string): DownloadInfo {
  return {
    qrToken,
    imageUrl: "/mock/photostrip-contoh.svg",
    fileName: `potretin-${qrToken}.jpg`,
    frameName: "CFD Pagi (contoh)",
    width: 600,
    height: 1376,
    createdAt: "2026-10-14T07:05:00.000Z",
  };
}
