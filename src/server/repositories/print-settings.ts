import "server-only";

import { eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { printSettings, type PrintSettingsRow } from "@/db/schema";
import { DEFAULT_PRINT_SETTINGS, type PrintSettings } from "@/lib/print-layout";

export function toPrintSettings(
  row: PrintSettingsRow | undefined,
): PrintSettings {
  if (!row) return DEFAULT_PRINT_SETTINGS;
  const strips = row.stripsPerSheet;
  return {
    printerEnabled: row.printerEnabled,
    paperSize: row.paperSize,
    orientation: row.orientation,
    stripsPerSheet: strips === 1 || strips === 4 ? strips : 2,
  };
}

/**
 * Pengaturan cetak yang berlaku: baris khusus iPad (device_id) bila ada,
 * selain itu pengaturan umum acara, selain itu bawaan aplikasi.
 */
export async function getEffectivePrintSettings(
  deviceId?: string | null,
): Promise<{
  settings: PrintSettings;
  source: "perangkat" | "acara" | "bawaan";
  updatedAt: string | null;
}> {
  if (deviceId) {
    const [own] = await db
      .select()
      .from(printSettings)
      .where(eq(printSettings.deviceId, deviceId))
      .limit(1);
    if (own)
      return {
        settings: toPrintSettings(own),
        source: "perangkat",
        updatedAt: own.updatedAt,
      };
  }
  const [general] = await db
    .select()
    .from(printSettings)
    .where(isNull(printSettings.deviceId))
    .limit(1);
  return general
    ? {
        settings: toPrintSettings(general),
        source: "acara",
        updatedAt: general.updatedAt,
      }
    : { settings: DEFAULT_PRINT_SETTINGS, source: "bawaan", updatedAt: null };
}

/**
 * Simpan (sebagian) pengaturan cetak untuk acara (deviceId null) atau untuk
 * satu iPad. Kolom yang tidak dikirim mempertahankan nilai lama / bawaan.
 */
export async function savePrintSettingsRow(
  deviceId: string | null,
  patch: Partial<PrintSettings>,
): Promise<PrintSettings> {
  const [existing] = await db
    .select()
    .from(printSettings)
    .where(
      deviceId
        ? eq(printSettings.deviceId, deviceId)
        : isNull(printSettings.deviceId),
    )
    .limit(1);
  const base = existing
    ? toPrintSettings(existing)
    : (await getEffectivePrintSettings(null)).settings;
  const next: PrintSettings = { ...base, ...patch };
  const values = {
    printerEnabled: next.printerEnabled,
    paperSize: next.paperSize,
    orientation: next.orientation,
    stripsPerSheet: next.stripsPerSheet,
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    await db
      .update(printSettings)
      .set(values)
      .where(eq(printSettings.id, existing.id));
  } else {
    await db.insert(printSettings).values({
      id: deviceId ? `perangkat-${deviceId}` : "default",
      deviceId,
      ...values,
    });
  }
  return next;
}
