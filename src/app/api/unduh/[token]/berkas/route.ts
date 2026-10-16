import type { NextRequest } from "next/server";

import { apiError } from "@/server/http";
import { clientKey, publicDownloadLimiter } from "@/server/rate-limit";
import {
  getPublicDownloadFile,
  recordDownload,
} from "@/server/services/public-download";

/** Content-Disposition aman untuk nama berkas (ASCII + RFC 5987). */
function disposition(type: "attachment" | "inline", fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

async function serve(req: NextRequest, token: string, headOnly: boolean) {
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

  const file = await getPublicDownloadFile(token);
  if (!file) {
    return apiError(
      404,
      "tautan_tidak_valid",
      "Foto untuk tautan ini tidak ditemukan",
    );
  }

  const asAttachment = req.nextUrl.searchParams.get("unduh") === "1";
  const headers = new Headers({
    "Content-Type": "image/jpeg",
    "Content-Disposition": disposition(
      asAttachment ? "attachment" : "inline",
      file.fileName,
    ),
    ETag: file.etag,
    // Berkas per token tidak berubah kecuali di-retake; cache privat di HP.
    "Cache-Control": "private, max-age=3600, must-revalidate",
    "X-Robots-Tag": "noindex",
    "X-Content-Type-Options": "nosniff",
  });

  // Sudah punya versi yang sama → 304 tanpa isi (hemat kuota di jaringan event).
  if (!asAttachment && req.headers.get("if-none-match") === file.etag) {
    return new Response(null, { status: 304, headers });
  }
  headers.set("Content-Length", String(file.data.length));
  if (headOnly) return new Response(null, { headers });

  if (asAttachment) await recordDownload(token);
  return new Response(new Uint8Array(file.data), { headers });
}

/**
 * GET /api/unduh/:token/berkas — berkas JPEG photostrip publik (tanpa login).
 * `?unduh=1` → lampiran (memicu unduhan) dan dihitung sebagai unduhan.
 * Mendukung ETag/If-None-Match (304) dan HEAD. 429 bila terlalu sering.
 */
export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/unduh/[token]/berkas">,
) {
  const { token } = await ctx.params;
  return serve(req, token, false);
}

export async function HEAD(
  req: NextRequest,
  ctx: RouteContext<"/api/unduh/[token]/berkas">,
) {
  const { token } = await ctx.params;
  return serve(req, token, true);
}
