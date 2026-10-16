import type { NextRequest } from "next/server";

import { ServiceError } from "@/server/errors";
import { apiError, isValidId } from "@/server/http";
import { getUploadMetadata } from "@/server/services/upload-metadata";

/**
 * GET /api/sessions/:id/photostrip/upload-metadata — metadata hasil akhir
 * untuk proses unggah (nama berkas unik, folder tanggal, ukuran, MD5,
 * status unggah). Kunci penyimpanan internal tidak dikirim ke klien.
 */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/sessions/[id]/photostrip/upload-metadata">,
) {
  const { id } = await ctx.params;
  if (!isValidId(id)) {
    return apiError(400, "id_tidak_valid", "Format id sesi tidak valid");
  }
  try {
    const { storageKey: _internal, ...metadata } = await getUploadMetadata(id);
    void _internal;
    return Response.json(
      { metadata },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof ServiceError) {
      return apiError(err.status, err.code, err.message);
    }
    console.error("Gagal membaca metadata unggah", err);
    return apiError(500, "gagal_metadata", "Metadata hasil gagal dibaca");
  }
}
