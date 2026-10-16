import type { NextRequest } from "next/server";

import { apiError } from "@/server/http";
import { findFrameById } from "@/server/repositories/frames";
import {
  findSessionById,
  insertSession,
  toSessionModel,
} from "@/server/repositories/sessions";

/** Id sesi buatan iPad: "sesi-" + UUID. */
const CLIENT_ID =
  /^sesi-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * POST /api/sessions — daftarkan sesi foto.
 * Body: { frameId: string, id?: "sesi-<uuid>", deviceId?: string, startedAt?: ISO }.
 * Bila `id` dikirim dan sesi sudah ada → 200 dengan sesi yang sama
 * (idempoten, aman diulang saat koneksi putus-sambung). Baru → 201.
 * 422 bila frame tidak ada / tidak aktif.
 */
export async function POST(req: NextRequest) {
  let body: {
    frameId?: unknown;
    deviceId?: unknown;
    id?: unknown;
    startedAt?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return apiError(
      400,
      "json_tidak_valid",
      "Isi permintaan bukan JSON yang valid",
    );
  }

  const id =
    typeof body.id === "string" && CLIENT_ID.test(body.id)
      ? body.id
      : undefined;
  if (body.id !== undefined && !id) {
    return apiError(422, "id_tidak_valid", "Format id sesi tidak valid");
  }
  if (id) {
    const existing = await findSessionById(id);
    if (existing) return Response.json({ session: toSessionModel(existing) });
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
  // Waktu mulai dari iPad dipakai untuk nama berkas; tolak yang tidak masuk akal.
  const startedAt =
    typeof body.startedAt === "string" &&
    !Number.isNaN(Date.parse(body.startedAt)) &&
    Math.abs(Date.parse(body.startedAt) - Date.now()) < 7 * 86_400_000
      ? new Date(body.startedAt).toISOString()
      : undefined;

  const session = await insertSession({
    id,
    frameId: frame.id,
    deviceId,
    startedAt,
  });
  return Response.json({ session: toSessionModel(session) }, { status: 201 });
}
