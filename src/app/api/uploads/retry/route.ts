import type { NextRequest } from "next/server";

import { apiError } from "@/server/http";
import { retryDueUploads } from "@/server/services/retry-uploads";

export const maxDuration = 60;

/**
 * Pekerja coba ulang unggahan Drive yang gagal (backoff terjadwal).
 * Dipanggil cron (GET, mis. Vercel Cron) atau manual (POST).
 * Bila CRON_SECRET diisi, wajib header `Authorization: Bearer <CRON_SECRET>`.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return apiError(401, "tidak_berwenang", "Token cron tidak valid");
  }
  const limit = Math.min(
    20,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 5) || 5),
  );
  const result = await retryDueUploads(limit);
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}

export const GET = handle;
export const POST = handle;
