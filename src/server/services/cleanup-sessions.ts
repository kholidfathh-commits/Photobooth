import "server-only";

import { and, eq, isNull, lt, ne } from "drizzle-orm";

import { db } from "@/db";
import { sessions } from "@/db/schema";

import { closeSession } from "./close-session";

export interface CleanupOptions {
  /** Sesi "berjalan" lebih tua dari ini dianggap ditinggalkan (jam). */
  abandonedAfterHours?: number;
  /** Batas sesi yang diproses per panggilan. */
  limit?: number;
  now?: Date;
}

export interface CleanupResult {
  abandonedClosed: string[];
  cleared: string[];
  /** Sesi yang hasilnya belum terunggah — berkas lokal sengaja dipertahankan. */
  keptForUpload: string[];
  failed: { sessionId: string; message: string }[];
}

/**
 * Pembersihan berkala data sesi lama (dipanggil cron):
 * 1. Sesi "berjalan" yang ditinggalkan > N jam → ditutup (selesai/dibatalkan)
 *    dan foto mentahnya dihapus.
 * 2. Sesi tertutup yang belum dibersihkan → coba bersihkan lagi; berkas hasil
 *    lokal baru dihapus bila sudah aman di Google Drive.
 * Tidak pernah menghapus hasil yang belum terunggah (foto pelanggan aman).
 */
export async function cleanupStaleSessions({
  abandonedAfterHours = 6,
  limit = 50,
  now = new Date(),
}: CleanupOptions = {}): Promise<CleanupResult> {
  const cutoff = new Date(
    now.getTime() - abandonedAfterHours * 3_600_000,
  ).toISOString();
  const result: CleanupResult = {
    abandonedClosed: [],
    cleared: [],
    keptForUpload: [],
    failed: [],
  };

  const abandoned = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.status, "berjalan"), lt(sessions.startedAt, cutoff)))
    .limit(limit);

  const uncleared = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(ne(sessions.status, "berjalan"), isNull(sessions.clearedAt)))
    .limit(limit);

  const run = async (id: string, abandonedSession: boolean) => {
    try {
      const r = await closeSession(id);
      if (abandonedSession) result.abandonedClosed.push(id);
      if (r.pendingUpload) result.keptForUpload.push(id);
      else result.cleared.push(id);
    } catch (err) {
      result.failed.push({
        sessionId: id,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  for (const { id } of abandoned) await run(id, true);
  for (const { id } of uncleared) await run(id, false);
  return result;
}
