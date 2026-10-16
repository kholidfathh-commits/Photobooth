// Validasi jepretan terhadap slot frame. Murni (tanpa I/O) sehingga dipakai
// bersama oleh server (sebelum komposisi/penyimpanan) dan browser.

export interface PhotoSlotRef {
  orderIndex: number;
}

export type PhotoSlotIssue =
  | { code: "jumlah_kurang"; message: string; missing: number[] }
  | { code: "jumlah_lebih"; message: string }
  | { code: "urutan_di_luar_slot"; message: string; orderIndex: number }
  | { code: "urutan_ganda"; message: string; orderIndex: number }
  | { code: "urutan_tidak_valid"; message: string };

export interface PhotoSlotValidation {
  ok: boolean;
  issues: PhotoSlotIssue[];
}

/**
 * Pastikan jumlah foto pas dengan jumlah slot frame: tiap slot 0..slotCount-1
 * terisi tepat satu foto, tanpa urutan ganda atau di luar jangkauan.
 */
export function validatePhotosForFrame(
  slotCount: number,
  photos: PhotoSlotRef[],
): PhotoSlotValidation {
  const issues: PhotoSlotIssue[] = [];

  if (!Number.isInteger(slotCount) || (slotCount !== 2 && slotCount !== 3)) {
    return {
      ok: false,
      issues: [
        {
          code: "urutan_tidak_valid",
          message: `Frame harus berisi 2 atau 3 slot (didapat ${slotCount})`,
        },
      ],
    };
  }

  const seen = new Set<number>();
  for (const { orderIndex } of photos) {
    if (!Number.isInteger(orderIndex)) {
      issues.push({
        code: "urutan_tidak_valid",
        message: "Urutan foto harus bilangan bulat",
      });
    } else if (orderIndex < 0 || orderIndex >= slotCount) {
      issues.push({
        code: "urutan_di_luar_slot",
        message: `Foto urutan ${orderIndex + 1} melebihi ${slotCount} slot frame`,
        orderIndex,
      });
    } else if (seen.has(orderIndex)) {
      issues.push({
        code: "urutan_ganda",
        message: `Ada lebih dari satu foto untuk slot ${orderIndex + 1}`,
        orderIndex,
      });
    } else {
      seen.add(orderIndex);
    }
  }

  if (photos.length > slotCount) {
    issues.push({
      code: "jumlah_lebih",
      message: `Frame hanya memuat ${slotCount} foto, tetapi dikirim ${photos.length}`,
    });
  }

  const missing = Array.from({ length: slotCount }, (_, i) => i).filter(
    (i) => !seen.has(i),
  );
  if (missing.length > 0) {
    issues.push({
      code: "jumlah_kurang",
      message: `Slot ${missing.map((i) => i + 1).join(", ")} belum berisi foto`,
      missing,
    });
  }

  return { ok: issues.length === 0, issues };
}
