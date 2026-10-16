// Alur status job cetak (murni, dipakai server & klien).

export const PRINT_JOB_STATUS_LIST = [
  "dikirim",
  "mencetak",
  "berhasil",
  "gagal",
  "dibatalkan",
] as const;
export type PrintJobStatusValue = (typeof PRINT_JOB_STATUS_LIST)[number];

/**
 * Perpindahan status yang sah:
 * dikirim → mencetak | berhasil | gagal | dibatalkan
 * mencetak → berhasil | gagal
 * gagal → dikirim (coba cetak lagi) | dibatalkan
 * berhasil, dibatalkan → (akhir)
 */
const TRANSITIONS: Record<PrintJobStatusValue, PrintJobStatusValue[]> = {
  dikirim: ["mencetak", "berhasil", "gagal", "dibatalkan"],
  mencetak: ["berhasil", "gagal"],
  gagal: ["dikirim", "dibatalkan"],
  berhasil: [],
  dibatalkan: [],
};

export function isPrintJobStatus(v: unknown): v is PrintJobStatusValue {
  return (
    typeof v === "string" &&
    (PRINT_JOB_STATUS_LIST as readonly string[]).includes(v)
  );
}

export function canTransition(
  from: PrintJobStatusValue,
  to: PrintJobStatusValue,
) {
  return from === to || TRANSITIONS[from].includes(to);
}

export function isFinalStatus(s: PrintJobStatusValue) {
  return TRANSITIONS[s].length === 0;
}
