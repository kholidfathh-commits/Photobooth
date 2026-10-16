/**
 * Alamat dasar aplikasi untuk tautan publik (halaman unduh / QR).
 * Pakai NEXT_PUBLIC_APP_URL bila diisi (domain produksi), selain itu origin
 * halaman yang sedang dibuka.
 */
export function appBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/** Tautan halaman unduh publik untuk satu photostrip (tanpa login). */
export function downloadUrl(qrToken: string): string {
  return `${appBaseUrl()}/unduh/${encodeURIComponent(qrToken)}`;
}

/** Tautan tanpa skema (https://), lebih pendek untuk ditampilkan. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "");
}
