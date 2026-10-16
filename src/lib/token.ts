/** Huruf & angka yang tidak mudah tertukar saat dibaca/diketik (tanpa i, l, o, 0, 1). */
const TOKEN_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";

/** Token acak aman (crypto) untuk QR Code / tautan unduh. */
export function randomToken(length = 10): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => TOKEN_CHARS[b % TOKEN_CHARS.length]).join("");
}
