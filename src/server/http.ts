import "server-only";

/** Bentuk error API yang seragam: { error: { code, message } }. */
export function apiError(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

/** Id sesi/foto: huruf, angka, dan tanda hubung; 1–100 karakter. */
export function isValidId(id: string): boolean {
  return /^[A-Za-z0-9-]{1,100}$/.test(id);
}
