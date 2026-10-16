import "server-only";

import { and, asc, eq, isNotNull, lte } from "drizzle-orm";

import { db } from "@/db";
import { photostrips, uploads } from "@/db/schema";
import { ServiceError } from "@/server/errors";

import { findSessionById } from "@/server/repositories/sessions";

import { closeSession } from "./close-session";
import { uploadPhotostripToDrive } from "./drive-upload";

export interface RetryRunResult {
  processed: number;
  succeeded: string[];
  failed: { sessionId: string; code: string }[];
}

/**
 * Coba ulang unggahan yang gagal dan sudah jatuh tempo (next_retry_at ≤
 * sekarang), paling banyak `limit` sekaligus, berurutan dari yang paling
 * lama menunggu. Dipanggil berkala (cron) lewat /api/uploads/retry.
 */
export async function retryDueUploads(limit = 5): Promise<RetryRunResult> {
  const due = await db
    .select({ sessionId: photostrips.sessionId })
    .from(uploads)
    .innerJoin(photostrips, eq(photostrips.id, uploads.photostripId))
    .where(
      and(
        eq(uploads.status, "gagal"),
        isNotNull(uploads.nextRetryAt),
        lte(uploads.nextRetryAt, new Date().toISOString()),
      ),
    )
    .orderBy(asc(uploads.nextRetryAt))
    .limit(limit);

  const result: RetryRunResult = { processed: 0, succeeded: [], failed: [] };
  for (const { sessionId } of due) {
    result.processed++;
    try {
      await uploadPhotostripToDrive(sessionId);
      result.succeeded.push(sessionId);
      // Sesi yang sudah ditutup pelanggan: bersihkan berkas lokal sekarang.
      const session = await findSessionById(sessionId);
      if (session && session.status !== "berjalan" && !session.clearedAt) {
        await closeSession(sessionId);
      }
    } catch (err) {
      result.failed.push({
        sessionId,
        code: err instanceof ServiceError ? err.code : "galat_tak_terduga",
      });
    }
  }
  return result;
}
