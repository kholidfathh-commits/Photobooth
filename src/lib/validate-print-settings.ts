import { PAPER_SIZES, type PrintSettings } from "./print-layout";

export type PrintSettingsPatch = Partial<PrintSettings>;

/**
 * Validasi isian pengaturan cetak dari klien. Mengembalikan patch yang bersih
 * atau daftar kesalahan per kolom (pesan Bahasa Indonesia).
 */
export function parsePrintSettingsPatch(
  input: unknown,
):
  | { ok: true; patch: PrintSettingsPatch }
  | { ok: false; errors: Record<string, string> } {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: { body: "Isi permintaan harus objek JSON" } };
  }
  const v = input as Record<string, unknown>;
  const patch: PrintSettingsPatch = {};
  const errors: Record<string, string> = {};

  if ("printerEnabled" in v) {
    if (typeof v.printerEnabled === "boolean")
      patch.printerEnabled = v.printerEnabled;
    else errors.printerEnabled = "Harus true atau false";
  }
  if ("paperSize" in v) {
    if (typeof v.paperSize === "string" && v.paperSize in PAPER_SIZES)
      patch.paperSize = v.paperSize as PrintSettings["paperSize"];
    else
      errors.paperSize = `Pilih salah satu: ${Object.keys(PAPER_SIZES).join(", ")}`;
  }
  if ("orientation" in v) {
    if (v.orientation === "potret" || v.orientation === "lanskap")
      patch.orientation = v.orientation;
    else errors.orientation = "Pilih potret atau lanskap";
  }
  if ("stripsPerSheet" in v) {
    if (
      v.stripsPerSheet === 1 ||
      v.stripsPerSheet === 2 ||
      v.stripsPerSheet === 4
    )
      patch.stripsPerSheet = v.stripsPerSheet;
    else errors.stripsPerSheet = "Pilih 1, 2, atau 4";
  }
  if (Object.keys(errors).length === 0 && Object.keys(patch).length === 0) {
    errors.body = "Tidak ada pengaturan yang diubah";
  }
  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, patch };
}
