import { listActiveFrames } from "@/server/repositories/frames";

/**
 * GET /api/frames — daftar frame aktif untuk halaman Pilih Frame.
 * 200: { frames: Frame[] } (id, name, slotCount, background, accent, caption).
 * Frame baru cukup ditambahkan sebagai baris di tabel `frames`.
 */
export async function GET() {
  const frames = await listActiveFrames();
  return Response.json(
    { frames },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}
