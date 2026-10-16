import "server-only";

/**
 * Pembatas laju sederhana (jendela tetap, di memori per instans server) untuk
 * endpoint publik — menyulitkan tebak-tebakan token QR. Cukup untuk skala
 * event; untuk banyak instans gunakan penyimpanan bersama.
 */
export function createRateLimiter({
  limit,
  windowMs,
}: {
  limit: number;
  windowMs: number;
}) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function check(key: string, now = Date.now()) {
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      }
      return { ok: true, retryAfterSec: 0 };
    }
    entry.count++;
    return entry.count <= limit
      ? { ok: true, retryAfterSec: 0 }
      : { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  };
}

/** Alamat klien dari header proxy (Vercel) — hanya untuk pembatasan laju. */
export function clientKey(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "lokal"
  );
}

/** Batas bersama endpoint unduh publik: 60 permintaan / menit / alamat. */
export const publicDownloadLimiter = createRateLimiter({
  limit: 60,
  windowMs: 60_000,
});
