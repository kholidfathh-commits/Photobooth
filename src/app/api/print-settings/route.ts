import type { NextRequest } from "next/server";

import { apiError } from "@/server/http";
import { parsePrintSettingsPatch } from "@/lib/validate-print-settings";
import { isOperatorRequest } from "@/server/operator-auth";
import {
  getEffectivePrintSettings,
  savePrintSettingsRow,
} from "@/server/repositories/print-settings";

/**
 * GET /api/print-settings?device=<id> — pengaturan cetak publik yang berlaku
 * untuk iPad ini (aktif/nonaktif, kertas, orientasi, susunan). Tanpa login:
 * hanya baca, tidak berisi data rahasia.
 * 200: { settings: { printerEnabled, paperSize, orientation, stripsPerSheet },
 *        source: "perangkat" | "acara" | "bawaan", updatedAt }
 */
export async function GET(req: NextRequest) {
  const device = req.nextUrl.searchParams.get("device");
  if (device !== null && !/^[A-Za-z0-9-]{1,64}$/.test(device)) {
    return apiError(
      400,
      "perangkat_tidak_valid",
      "Format id perangkat tidak valid",
    );
  }
  const result = await getEffectivePrintSettings(device);
  return Response.json(result, {
    // Boleh di-cache singkat; perubahan operator terasa dalam ±30 detik.
    headers: {
      "Cache-Control": "public, max-age=15, stale-while-revalidate=30",
    },
  });
}

/**
 * PUT /api/print-settings?device=<id> — operator menyimpan pengaturan cetak.
 * Tanpa `device` = pengaturan umum acara (semua iPad); dengan `device` =
 * khusus iPad itu. Body JSON sebagian: { printerEnabled?, paperSize?,
 * orientation?, stripsPerSheet? }. Wajib header operator (lihat
 * OPERATOR_TOKEN). 200: { settings, source }.
 */
export async function PUT(req: NextRequest) {
  if (!isOperatorRequest(req.headers)) {
    return apiError(
      401,
      "bukan_operator",
      "Hanya operator yang boleh mengubah pengaturan",
    );
  }
  const device = req.nextUrl.searchParams.get("device");
  if (device !== null && !/^[A-Za-z0-9-]{1,64}$/.test(device)) {
    return apiError(
      400,
      "perangkat_tidak_valid",
      "Format id perangkat tidak valid",
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(
      400,
      "json_tidak_valid",
      "Isi permintaan bukan JSON yang valid",
    );
  }
  const parsed = parsePrintSettingsPatch(body);
  if (!parsed.ok) {
    return Response.json(
      {
        error: {
          code: "pengaturan_tidak_valid",
          message: "Ada pengaturan yang tidak valid",
          fields: parsed.errors,
        },
      },
      { status: 422 },
    );
  }

  const settings = await savePrintSettingsRow(device, parsed.patch);
  return Response.json(
    { settings, source: device ? "perangkat" : "acara" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
