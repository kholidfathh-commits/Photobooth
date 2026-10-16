import type { NextRequest } from "next/server";

import { apiError } from "@/server/http";
import { clientKey, publicDownloadLimiter } from "@/server/rate-limit";
import { getPublicDownload } from "@/server/services/public-download";

/**
 * GET /api/unduh/:token — data publik foto untuk halaman unduh (tanpa login).
 * 200: { foto: { qrToken, imageUrl, fileName, frameName, width, height, createdAt } }
 * 404: token tidak valid / tidak ditemukan / dicabut.
 */
export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/unduh/[token]">,
) {
  const limit = publicDownloadLimiter(clientKey(req.headers));
  if (!limit.ok) {
    const res = apiError(
      429,
      "terlalu_sering",
      "Terlalu banyak permintaan, coba sebentar lagi",
    );
    res.headers.set("Retry-After", String(limit.retryAfterSec));
    return res;
  }
  const { token } = await ctx.params;
  const info = await getPublicDownload(token);
  if (!info) {
    return apiError(
      404,
      "tautan_tidak_valid",
      "Foto untuk tautan ini tidak ditemukan",
    );
  }
  return Response.json(
    { foto: info },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );
}
