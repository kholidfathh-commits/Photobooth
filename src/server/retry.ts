import "server-only";

export interface RetryOptions {
  /** Jumlah percobaan maksimum (termasuk yang pertama). */
  attempts?: number;
  /** Jeda awal (ms); berlipat dua tiap percobaan. */
  baseDelayMs?: number;
  /** Jeda maksimum (ms). */
  maxDelayMs?: number;
  /** Apakah error ini layak dicoba ulang. */
  shouldRetry?: (err: unknown) => boolean;
  /** Dipanggil sebelum menunggu percobaan berikutnya. */
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
  /** Fungsi tunggu (bisa diganti saat uji). */
  sleep?: (ms: number) => Promise<void>;
}

/** Jeda backoff eksponensial + jitter penuh: acak 50–100% dari base·2^(n-1). */
export function backoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  random = Math.random,
): number {
  const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
  return Math.round(exp * (0.5 + random() * 0.5));
}

/**
 * Jalankan `fn`, ulangi bila gagal dengan backoff eksponensial selama
 * `shouldRetry(err)` bernilai true dan percobaan belum habis.
 */
export async function retryWithBackoff<T>(
  fn: (attempt: number) => Promise<T>,
  {
    attempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 8000,
    shouldRetry = () => true,
    onRetry,
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  }: RetryOptions = {},
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= attempts || !shouldRetry(err)) throw err;
      const delay = backoffDelay(attempt, baseDelayMs, maxDelayMs);
      onRetry?.(err, attempt, delay);
      await sleep(delay);
    }
  }
}
