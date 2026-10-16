const KEY = "photobooth:perangkat";

/**
 * Penanda iPad ini (acak, dibuat sekali & disimpan di perangkat) — untuk
 * pengaturan cetak per iPad dan catatan sesi. Bukan data pribadi.
 */
export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing && /^ipad-[a-z0-9]{8}$/.test(existing)) return existing;
    const id = `ipad-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return "ipad-tanpanama";
  }
}
