import type { NextRequest } from "next/server";

import { apiError } from "@/server/http";
import { cleanupStaleSessions } from "@/server/services/cleanup-sessions";

export const maxDuration = 60;

/**
 * Pembersihan data sesi lama (cron, mis. tiap jam). GET untuk cron, POST
 * untuk manual. Query: `jam` = umur sesi ditinggalkan (bawaan 6).
 * Bila CRON_SECRET diisi, wajib `Authorization: Bearer <CRON_SECRET>`.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return apiError(401, "tidak_berwenang", "Token cron tidak valid");
  }
  const hours = Number(req.nextUrl.searchParams.get("jam") ?? 6);
  if (!Number.isFinite(hours) || hours < 1 || hours > 24 * 30) {
    return apiError(422, "jam_tidak_valid", "Parameter jam harus 1–720");
  }
  const result = await cleanupStaleSessions({ abandonedAfterHours: hours });
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}

export const GET = handle;
export const POST = handle;
