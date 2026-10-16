import type { NextRequest } from "next/server";

import { ServiceError } from "@/server/errors";
import { apiError, isValidId } from "@/server/http";
import { regeneratePhotostrip } from "@/server/services/regenerate-photostrip";

/**
 * POST /api/sessions/:id/photostrip/regenerate — susun ulang hasil akhir
 * dari jepretan mentah tersimpan (setelah retake). Token QR tetap.
 * 200: { photostrip: { id, resolution, qrToken, downloadPath } }
 */
export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/sessions/[id]/photostrip/regenerate">,
) {
  const { id } = await ctx.params;
  if (!isValidId(id)) {
    return apiError(400, "id_tidak_valid", "Format id sesi tidak valid");
  }
  try {
    const photostrip = await regeneratePhotostrip(id);
    return Response.json({
      photostrip: {
        id: photostrip.id,
        sessionId: photostrip.sessionId,
        resolution: photostrip.resolution,
        qrToken: photostrip.qrToken,
        downloadPath: `/unduh/${photostrip.qrToken}`,
      },
    });
  } catch (err) {
    if (err instanceof ServiceError) {
      return apiError(err.status, err.code, err.message);
    }
    console.error("Gagal menyusun ulang hasil foto", err);
    return apiError(500, "gagal_regenerasi", "Hasil foto gagal disusun ulang");
  }
}
