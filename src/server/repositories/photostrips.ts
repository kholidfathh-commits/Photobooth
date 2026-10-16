import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  photostrips,
  sessions,
  uploads,
  type PhotostripRow,
} from "@/db/schema";

/** Photostrip hasil sesi tertentu (null bila sesi belum punya hasil). */
export async function findPhotostripBySession(
  sessionId: string,
): Promise<PhotostripRow | null> {
  const rows = await db
    .select()
    .from(photostrips)
    .where(eq(photostrips.sessionId, sessionId))
    .limit(1);
  return rows[0] ?? null;
}

/** Photostrip berdasarkan token QR (untuk halaman unduh publik). */
export async function findPhotostripByToken(
  qrToken: string,
): Promise<PhotostripRow | null> {
  const rows = await db
    .select()
    .from(photostrips)
    .where(eq(photostrips.qrToken, qrToken))
    .limit(1);
  return rows[0] ?? null;
}

/** Apakah sesi dengan id ini ada. */
export async function sessionExists(sessionId: string): Promise<boolean> {
  const rows = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  return rows.length > 0;
}

/** Photostrip sesi beserta catatan unggahannya (bila ada). */
export async function findPhotostripWithUpload(sessionId: string) {
  const [row] = await db
    .select({ photostrip: photostrips, upload: uploads })
    .from(photostrips)
    .leftJoin(uploads, eq(uploads.photostripId, photostrips.id))
    .where(eq(photostrips.sessionId, sessionId))
    .limit(1);
  return row ?? null;
}

export async function findPhotostripById(
  id: string,
): Promise<PhotostripRow | null> {
  const rows = await db
    .select()
    .from(photostrips)
    .where(eq(photostrips.id, id))
    .limit(1);
  return rows[0] ?? null;
}
