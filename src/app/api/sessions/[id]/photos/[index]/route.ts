import type { NextRequest } from "next/server";

import { ServiceError } from "@/server/errors";
import { apiError, isValidId } from "@/server/http";
import { MAX_RAW_BYTES, saveRawPhoto } from "@/server/services/raw-photos";

/**
 * PUT /api/sessions/:id/photos/:index — unggah/ganti jepretan mentah untuk
 * slot ke-index (mulai 0). Body: gambar mentah (Content-Type image/*).
 * 200: { photo: { id, sessionId, orderIndex, takenAt } }
 */
export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/sessions/[id]/photos/[index]">,
) {
  const { id, index } = await ctx.params;
  if (!isValidId(id)) {
    return apiError(400, "id_tidak_valid", "Format id sesi tidak valid");
  }
  if (!/^\d{1,2}$/.test(index)) {
    return apiError(400, "urutan_tidak_valid", "Urutan foto harus angka");
  }
  const type = req.headers.get("content-type")?.split(";")[0].trim() ?? "";
  if (!type.startsWith("image/")) {
    return apiError(415, "bukan_gambar", "Kirim berkas gambar sebagai body");
  }
  if (Number(req.headers.get("content-length") ?? 0) > MAX_RAW_BYTES) {
    return apiError(413, "berkas_terlalu_besar", "Berkas foto terlalu besar");
  }

  try {
    const body = Buffer.from(await req.arrayBuffer());
    const photo = await saveRawPhoto(id, Number(index), body);
    return Response.json({
      photo: {
        id: photo.id,
        sessionId: photo.sessionId,
        orderIndex: photo.orderIndex,
        takenAt: photo.takenAt,
      },
    });
  } catch (err) {
    if (err instanceof ServiceError) {
      return apiError(err.status, err.code, err.message);
    }
    console.error("Gagal menyimpan foto mentah", err);
    return apiError(500, "gagal_menyimpan", "Foto gagal disimpan");
  }
}
