import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { photos, type PhotostripRow } from "@/db/schema";
import {
  ComposeError,
  composePhotostripImage,
  type SourcePhoto,
} from "@/server/compose-photostrip";
import { ServiceError } from "@/server/errors";
import { findSessionWithFrame } from "@/server/repositories/sessions";
import { storage } from "@/server/storage";

import { saveFinalPhotostrip } from "./final-photostrip";

/**
 * Susun ulang hasil akhir sesi dari jepretan mentah yang tersimpan —
 * dipanggil setelah pelanggan mengulang (retake) satu/lebih foto.
 * Token QR lama tetap berlaku; berkas & resolusi diperbarui.
 */
export async function regeneratePhotostrip(
  sessionId: string,
  { scale = 3 }: { scale?: number } = {},
): Promise<PhotostripRow> {
  const found = await findSessionWithFrame(sessionId);
  if (!found)
    throw new ServiceError(404, "sesi_tidak_ada", "Sesi tidak ditemukan");

  const rows = await db
    .select()
    .from(photos)
    .where(eq(photos.sessionId, sessionId));

  const sources: SourcePhoto[] = await Promise.all(
    rows.map(async (row) => {
      const key = row.rawUrl?.startsWith("storage:")
        ? row.rawUrl.slice("storage:".length)
        : null;
      const data = key ? await storage().get(key) : null;
      if (!data) {
        throw new ServiceError(
          409,
          "foto_mentah_hilang",
          `Berkas foto ${row.orderIndex + 1} tidak ditemukan di server`,
        );
      }
      return { orderIndex: row.orderIndex, takenAt: row.takenAt, data };
    }),
  );

  if (sources.length === 0) {
    throw new ServiceError(
      422,
      "jumlah_kurang",
      "Sesi belum punya foto untuk disusun",
    );
  }

  try {
    const composed = await composePhotostripImage(found.frame, sources, {
      scale,
    });
    return await saveFinalPhotostrip(sessionId, composed.buffer);
  } catch (err) {
    if (err instanceof ComposeError) {
      throw new ServiceError(
        422,
        err.issues[0]?.code ?? "gagal_komposisi",
        err.message,
      );
    }
    throw err;
  }
}
