import type { NextRequest } from "next/server";

import { ServiceError } from "@/server/errors";
import { apiError, isValidId } from "@/server/http";
import {
  createPrintJob,
  listPrintJobsForSession,
  printJobJson,
} from "@/server/services/print-jobs";

/**
 * POST /api/sessions/:id/print-jobs — kirim job cetak hasil sesi.
 * Body JSON opsional: { deviceId?: string, copies?: 1–5 }.
 * 201: { job: { id, status, paperSize, orientation, layout, copies },
 *        sheetUrl } — sheetUrl = lembar JPEG 300 dpi siap dicetak (AirPrint).
 * 409 cetak_nonaktif bila operator mematikan fitur cetak.
 */
export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/sessions/[id]/print-jobs">,
) {
  const { id } = await ctx.params;
  if (!isValidId(id)) {
    return apiError(400, "id_tidak_valid", "Format id sesi tidak valid");
  }
  let body: { deviceId?: unknown; copies?: unknown } = {};
  if (req.headers.get("content-type")?.includes("application/json")) {
    try {
      body = await req.json();
    } catch {
      return apiError(
        400,
        "json_tidak_valid",
        "Isi permintaan bukan JSON yang valid",
      );
    }
  }
  const deviceId =
    typeof body.deviceId === "string" &&
    /^[A-Za-z0-9-]{1,64}$/.test(body.deviceId)
      ? body.deviceId
      : null;
  const copies = body.copies === undefined ? 1 : Number(body.copies);

  try {
    const { job } = await createPrintJob(id, { deviceId, copies });
    return Response.json(
      {
        job: {
          id: job.id,
          status: job.status,
          paperSize: job.paperSize,
          orientation: job.orientation,
          layout: job.layout,
          copies: job.copies,
          requestedAt: job.requestedAt,
        },
        sheetUrl: `/api/print-jobs/${job.id}/lembar`,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof ServiceError)
      return apiError(err.status, err.code, err.message);
    console.error("Gagal membuat job cetak", err);
    return apiError(500, "gagal_cetak", "Job cetak gagal dibuat");
  }
}

/** GET /api/sessions/:id/print-jobs — riwayat job cetak sesi (terbaru dulu). */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/sessions/[id]/print-jobs">,
) {
  const { id } = await ctx.params;
  if (!isValidId(id)) {
    return apiError(400, "id_tidak_valid", "Format id sesi tidak valid");
  }
  const jobs = await listPrintJobsForSession(id);
  return Response.json(
    { jobs: jobs.map(printJobJson) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
