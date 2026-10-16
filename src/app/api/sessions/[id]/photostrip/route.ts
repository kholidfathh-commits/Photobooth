import type { NextRequest } from "next/server";

import type { PhotostripRow } from "@/db/schema";

import { ServiceError } from "@/server/errors";
import { apiError, isValidId } from "@/server/http";
import {
  findPhotostripBySession,
  sessionExists,
} from "@/server/repositories/photostrips";
import {
  MAX_FINAL_BYTES,
  saveFinalPhotostrip,
} from "@/server/services/final-photostrip";

/**
 * GET /api/sessions/:id/photostrip — hasil foto (photostrip) sebuah sesi.
 * 200: { photostrip: { id, sessionId, resolution, qrToken, finalUrl,
 *        driveFileId, downloadPath, createdAt } }
 * 404: sesi tidak ada, atau sesi belum punya hasil (code berbeda).
 */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/sessions/[id]/photostrip">,
) {
  const { id } = await ctx.params;
  if (!isValidId(id)) {
    return apiError(400, "id_tidak_valid", "Format id sesi tidak valid");
  }

  const photostrip = await findPhotostripBySession(id);
  if (!photostrip) {
    return (await sessionExists(id))
      ? apiError(404, "hasil_belum_ada", "Sesi ini belum punya hasil foto")
      : apiError(404, "sesi_tidak_ada", "Sesi tidak ditemukan");
  }

  return Response.json(
    { photostrip: toJson(photostrip) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * POST /api/sessions/:id/photostrip — simpan berkas hasil akhir resolusi
 * tinggi. Body: gambar mentah (Content-Type image/jpeg | image/png |
 * image/webp), maks 15 MB, lebar ≥ 1200 px, rasio sesuai frame sesi.
 * 201: { photostrip } (baru) · 200: { photostrip } (menimpa hasil lama,
 * token QR tetap).
 */
export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/sessions/[id]/photostrip">,
) {
  const { id } = await ctx.params;
  if (!isValidId(id)) {
    return apiError(400, "id_tidak_valid", "Format id sesi tidak valid");
  }
  const type = req.headers.get("content-type")?.split(";")[0].trim() ?? "";
  if (!type.startsWith("image/")) {
    return apiError(415, "bukan_gambar", "Kirim berkas gambar sebagai body");
  }
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_FINAL_BYTES) {
    return apiError(413, "berkas_terlalu_besar", "Berkas terlalu besar");
  }

  try {
    const existed = Boolean(await findPhotostripBySession(id));
    const body = Buffer.from(await req.arrayBuffer());
    const photostrip = await saveFinalPhotostrip(id, body);
    return Response.json(
      { photostrip: toJson(photostrip) },
      { status: existed ? 200 : 201 },
    );
  } catch (err) {
    if (err instanceof ServiceError) {
      return apiError(err.status, err.code, err.message);
    }
    console.error("Gagal menyimpan hasil foto", err);
    return apiError(500, "gagal_menyimpan", "Hasil foto gagal disimpan");
  }
}

function toJson(photostrip: PhotostripRow) {
  return {
    id: photostrip.id,
    sessionId: photostrip.sessionId,
    resolution: photostrip.resolution,
    qrToken: photostrip.qrToken,
    finalUrl: photostrip.finalUrl,
    driveFileId: photostrip.driveFileId,
    downloadPath: `/unduh/${photostrip.qrToken}`,
    createdAt: photostrip.createdAt,
  };
}
