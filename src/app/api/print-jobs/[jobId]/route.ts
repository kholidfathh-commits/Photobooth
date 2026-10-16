import type { NextRequest } from "next/server";

import { isPrintJobStatus } from "@/lib/print-job-status";
import { ServiceError } from "@/server/errors";
import { apiError, isValidId } from "@/server/http";
import {
  getPrintJob,
  printJobJson,
  updatePrintJobStatus,
} from "@/server/services/print-jobs";

/** GET /api/print-jobs/:jobId — status terkini job cetak. */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/print-jobs/[jobId]">,
) {
  const { jobId } = await ctx.params;
  if (!isValidId(jobId))
    return apiError(400, "id_tidak_valid", "Format id job tidak valid");
  try {
    const job = await getPrintJob(jobId);
    return Response.json(
      { job: printJobJson(job) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof ServiceError)
      return apiError(err.status, err.code, err.message);
    throw err;
  }
}

/**
 * PATCH /api/print-jobs/:jobId — laporkan status cetak dari iPad.
 * Body: { status: "mencetak" | "berhasil" | "gagal" | "dikirim" | "dibatalkan",
 *         error?: string }. 409 bila perpindahan status tidak sah.
 */
export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/print-jobs/[jobId]">,
) {
  const { jobId } = await ctx.params;
  if (!isValidId(jobId))
    return apiError(400, "id_tidak_valid", "Format id job tidak valid");

  let body: { status?: unknown; error?: unknown };
  try {
    body = await req.json();
  } catch {
    return apiError(
      400,
      "json_tidak_valid",
      "Isi permintaan bukan JSON yang valid",
    );
  }
  if (!isPrintJobStatus(body.status)) {
    return apiError(
      422,
      "status_tidak_valid",
      "Status harus salah satu: dikirim, mencetak, berhasil, gagal, dibatalkan",
    );
  }
  try {
    const job = await updatePrintJobStatus(
      jobId,
      body.status,
      typeof body.error === "string" ? body.error : null,
    );
    return Response.json({ job: printJobJson(job) });
  } catch (err) {
    if (err instanceof ServiceError)
      return apiError(err.status, err.code, err.message);
    console.error("Gagal memperbarui job cetak", err);
    return apiError(500, "gagal_perbarui", "Status job cetak gagal diperbarui");
  }
}
