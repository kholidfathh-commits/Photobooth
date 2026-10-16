import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  frames,
  sessions,
  type SessionRow,
  type SessionRowStatus,
} from "@/db/schema";
import type { Frame } from "@/lib/types";

import { frameFromRow } from "./frames";

/** Bentuk data sesi yang dikirim ke klien (tanpa detail internal). */
export interface SessionModel {
  id: string;
  frameId: string;
  status: SessionRowStatus;
  deviceId: string | null;
  startedAt: string;
  finishedAt: string | null;
  clearedAt: string | null;
}

export function toSessionModel(row: SessionRow): SessionModel {
  return {
    id: row.id,
    frameId: row.frameId,
    status: row.status,
    deviceId: row.deviceId,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    clearedAt: row.clearedAt,
  };
}

/** Sesi beserta frame-nya (null bila sesi tidak ada). */
export async function findSessionWithFrame(
  sessionId: string,
): Promise<{ session: SessionRow; frame: Frame } | null> {
  const [row] = await db
    .select({ session: sessions, frame: frames })
    .from(sessions)
    .innerJoin(frames, eq(frames.id, sessions.frameId))
    .where(eq(sessions.id, sessionId))
    .limit(1);
  return row ? { session: row.session, frame: frameFromRow(row.frame) } : null;
}

export async function findSessionById(id: string): Promise<SessionRow | null> {
  const [row] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);
  return row ?? null;
}

/** Buat sesi foto baru (status "berjalan") untuk frame tertentu. */
export async function insertSession(input: {
  frameId: string;
  deviceId?: string | null;
}): Promise<SessionRow> {
  const [row] = await db
    .insert(sessions)
    .values({
      id: `sesi-${crypto.randomUUID()}`,
      frameId: input.frameId,
      deviceId: input.deviceId ?? null,
    })
    .returning();
  return row;
}

/** Ubah status sesi; "selesai"/"dibatalkan" mengisi finished_at. */
export async function updateSessionStatus(
  id: string,
  status: SessionRowStatus,
): Promise<SessionRow | null> {
  const [row] = await db
    .update(sessions)
    .set({
      status,
      finishedAt: status === "berjalan" ? null : new Date().toISOString(),
    })
    .where(eq(sessions.id, id))
    .returning();
  return row ?? null;
}

/** Tandai data sementara sesi sudah dibersihkan. */
export async function markSessionCleared(id: string): Promise<void> {
  await db
    .update(sessions)
    .set({ clearedAt: new Date().toISOString() })
    .where(eq(sessions.id, id));
}
