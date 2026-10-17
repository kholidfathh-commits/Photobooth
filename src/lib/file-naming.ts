// Penamaan berkas hasil foto yang unik & rapi per sesi. Murni (tanpa I/O)
// agar dipakai sama di server (unggah Drive) dan browser (tampilan).

export const FILE_PREFIX = "potretin";
export const ROOT_FOLDER_NAME = "Potretin";
/** Zona waktu acara (WIB) — tanggal & jam di nama berkas mengikuti ini. */
export const DEFAULT_TIME_ZONE = "Asia/Jakarta";

/** Tanggal (YYYY-MM-DD) dan jam (HHmm) sebuah waktu ISO di zona tertentu. */
export function datePartsIn(timeZone: string, iso: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour === "24" ? "00" : parts.hour}${parts.minute}`,
  };
}

/** Bagian aman untuk nama berkas: huruf kecil, angka, tanda hubung. */
export function slugPart(text: string, max = 24) {
  return (
    text
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, max)
      .replace(/-+$/g, "") || "x"
  );
}

/**
 * Nama berkas unik per sesi:
 * `potretin_<tanggal>_<jam>_<frame>_<token>.jpg`, mis.
 * potretin_2026-10-14_0705_klasik-putih_k3m9x2pqra.jpg.
 * Keunikan dijamin oleh token QR (unik di database); tanggal, jam, dan
 * nama frame membuat berkas mudah dicari & urut di Drive.
 */
export function photostripFileName({
  startedAt,
  frameName,
  qrToken,
  timeZone = DEFAULT_TIME_ZONE,
}: {
  startedAt: string;
  frameName: string;
  qrToken: string;
  timeZone?: string;
}) {
  const { date, time } = datePartsIn(timeZone, startedAt);
  return `${FILE_PREFIX}_${date}_${time}_${slugPart(frameName)}_${slugPart(qrToken, 32)}.jpg`;
}

/** Folder Drive per tanggal acara: ["Potretin", "2026-10-14"]. */
export function photostripFolderPath(
  startedAt: string,
  timeZone = DEFAULT_TIME_ZONE,
) {
  return [ROOT_FOLDER_NAME, datePartsIn(timeZone, startedAt).date];
}
