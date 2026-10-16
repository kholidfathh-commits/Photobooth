import type { NextRequest } from "next/server";

import { ServiceError } from "@/server/errors";
import { apiError, isValidId } from "@/server/http";
import { closeSession } from "@/server/services/close-session";

/**
 * POST /api/sessions/:id/close — tutup & bersihkan sesi ("Selesai").
 * 200: { session, rawPhotosCleared, finalFileCleared, pendingUpload }.
 * Idempoten: aman dipanggil ulang (mis. setelah unggahan tertunda selesai).
 */
export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/sessions/[id]/close">,
) {
  const { id } = await ctx.params;
  if (!isValidId(id))
    return apiError(400, "id_tidak_valid", "Format id sesi tidak valid");
  try {
    return Response.json(await closeSession(id));
  } catch (err) {
    if (err instanceof ServiceError)
      return apiError(err.status, err.code, err.message);
    console.error("Gagal menutup sesi", err);
    return apiError(500, "gagal_tutup", "Sesi gagal ditutup");
  }
}
