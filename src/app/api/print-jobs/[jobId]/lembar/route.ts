import type { NextRequest } from "next/server";

import { ServiceError } from "@/server/errors";
import { apiError, isValidId } from "@/server/http";
import { renderPrintSheet } from "@/server/services/print-jobs";

/**
 * GET /api/print-jobs/:jobId/lembar — lembar cetak JPEG (300 dpi, seukuran
 * kertas) berisi photostrip tersusun sesuai pengaturan job.
 */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/print-jobs/[jobId]/lembar">,
) {
  const { jobId } = await ctx.params;
  if (!isValidId(jobId)) {
    return apiError(400, "id_tidak_valid", "Format id job tidak valid");
  }
  try {
    const sheet = await renderPrintSheet(jobId);
    return new Response(new Uint8Array(sheet.buffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `inline; filename="lembar-cetak-${jobId}.jpg"`,
        "Cache-Control": "private, no-store",
        "X-Paper-Size-Mm": `${sheet.widthMm}x${sheet.heightMm}`,
      },
    });
  } catch (err) {
    if (err instanceof ServiceError)
      return apiError(err.status, err.code, err.message);
    console.error("Gagal membuat lembar cetak", err);
    return apiError(500, "gagal_lembar", "Lembar cetak gagal dibuat");
  }
}
