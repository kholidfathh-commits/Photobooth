import type { NextRequest } from "next/server";

import { apiError, isValidId } from "@/server/http";
import {
  findPhotostripWithUpload,
  sessionExists,
} from "@/server/repositories/photostrips";
import { buildQrPayload, publicBaseUrl } from "@/server/services/qr";

/**
 * GET /api/sessions/:id/qr — QR Code unduhan sesi. Hanya tersedia setelah
 * unggahan ke Drive berhasil (409 qr_belum_siap sebelum itu).
 * 200: { qr: { token, url, path, svgDataUrl } }
 */
export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/sessions/[id]/qr">,
) {
  const { id } = await ctx.params;
  if (!isValidId(id)) {
    return apiError(400, "id_tidak_valid", "Format id sesi tidak valid");
  }
  const row = await findPhotostripWithUpload(id);
  if (!row) {
    return (await sessionExists(id))
      ? apiError(404, "hasil_belum_ada", "Sesi ini belum punya hasil foto")
      : apiError(404, "sesi_tidak_ada", "Sesi tidak ditemukan");
  }
  if (row.upload?.status !== "berhasil" || row.photostrip.tokenRevokedAt) {
    return apiError(
      409,
      "qr_belum_siap",
      "QR Code muncul setelah foto berhasil diunggah",
    );
  }
  const qr = await buildQrPayload(
    row.photostrip.qrToken,
    publicBaseUrl(req.nextUrl.origin),
  );
  return Response.json({ qr }, { headers: { "Cache-Control": "no-store" } });
}
