import type { NextRequest } from "next/server";

import { ServiceError } from "@/server/errors";
import { apiError, isValidId } from "@/server/http";
import {
  findPhotostripWithUpload,
  sessionExists,
} from "@/server/repositories/photostrips";
import { uploadPhotostripToDrive } from "@/server/services/drive-upload";
import { buildQrPayload, publicBaseUrl } from "@/server/services/qr";

// Unggah ke Drive bisa memakan waktu di jaringan event yang lambat.
export const maxDuration = 60;

/**
 * POST /api/sessions/:id/photostrip/upload — unggah hasil akhir sesi ke
 * Google Drive. Idempoten (aman dipanggil ulang saat coba lagi).
 * 200: { upload: { status, attempts, fileName, driveFileId, reused },
 *        qr: { token, url, path, svgDataUrl } } — QR terbit setelah sukses.
 * 409 sedang_diunggah · 503 drive_sementara_gagal (boleh coba lagi) ·
 * 502 drive_menolak · 404 sesi/hasil tidak ada.
 */
export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/sessions/[id]/photostrip/upload">,
) {
  const { id } = await ctx.params;
  if (!isValidId(id)) {
    return apiError(400, "id_tidak_valid", "Format id sesi tidak valid");
  }
  try {
    const { upload, reused, photostrip } = await uploadPhotostripToDrive(id);
    const qr = await buildQrPayload(
      photostrip.qrToken,
      publicBaseUrl(req.nextUrl.origin),
    );
    return Response.json({
      upload: {
        status: upload.status,
        attempts: upload.attempts,
        fileName: upload.fileName,
        driveFileId: upload.driveFileId,
        reused,
      },
      qr,
    });
  } catch (err) {
    if (err instanceof ServiceError) {
      const res = apiError(err.status, err.code, err.message);
      if (err.status === 503) res.headers.set("Retry-After", "10");
      return res;
    }
    console.error("Gagal mengunggah ke Drive", err);
    return apiError(500, "gagal_unggah", "Unggahan gagal");
  }
}

/**
 * GET /api/sessions/:id/photostrip/upload — status unggahan ke Drive dan
 * tautan unduhan publik.
 * 200: { upload: { status: "belum" | "menunggu" | "mengunggah" | "berhasil"
 *        | "gagal", attempts, lastError, nextRetryAt, fileName, updatedAt },
 *        download: { qrToken, path, url } }
 * Tautan unduhan sudah bisa dipakai begitu hasil tersimpan; halaman unduh
 * menampilkan foto dari Drive bila sudah terunggah.
 */
export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/sessions/[id]/photostrip/upload">,
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

  const { photostrip, upload } = row;
  const path = `/unduh/${photostrip.qrToken}`;
  return Response.json(
    {
      upload: {
        status: upload?.status ?? "belum",
        attempts: upload?.attempts ?? 0,
        lastError: upload?.status === "gagal" ? upload.lastError : null,
        nextRetryAt: upload?.nextRetryAt ?? null,
        fileName: upload?.fileName ?? null,
        driveFileId: photostrip.driveFileId,
        updatedAt: upload?.updatedAt ?? null,
      },
      download: {
        qrToken: photostrip.qrToken,
        path,
        url: `${publicBaseUrl(req.nextUrl.origin)}${path}`,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
