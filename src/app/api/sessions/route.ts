import type { NextRequest } from "next/server";

import { apiError } from "@/server/http";
import { findFrameById } from "@/server/repositories/frames";
import { insertSession, toSessionModel } from "@/server/repositories/sessions";

/**
 * POST /api/sessions — mulai sesi foto baru (setelah reset / "Sesi Baru").
 * Body: { frameId: string, deviceId?: string }.
 * 201: { session }. 422 bila frame tidak ada / tidak aktif.
 */
export async function POST(req: NextRequest) {
  let body: { frameId?: unknown; deviceId?: unknown };
  try {
    body = await req.json();
  } catch {
    return apiError(
      400,
      "json_tidak_valid",
      "Isi permintaan bukan JSON yang valid",
    );
  }
  if (
    typeof body.frameId !== "string" ||
    !/^[A-Za-z0-9-]{1,100}$/.test(body.frameId)
  ) {
    return apiError(422, "frame_tidak_valid", "frameId wajib diisi");
  }
  const frame = await findFrameById(body.frameId);
  if (!frame || !frame.isActive) {
    return apiError(
      422,
      "frame_tidak_ada",
      "Frame tidak ditemukan atau tidak aktif",
    );
  }
  const deviceId =
    typeof body.deviceId === "string" &&
    /^[A-Za-z0-9-]{1,64}$/.test(body.deviceId)
      ? body.deviceId
      : null;
  const session = await insertSession({ frameId: frame.id, deviceId });
  return Response.json({ session: toSessionModel(session) }, { status: 201 });
}
