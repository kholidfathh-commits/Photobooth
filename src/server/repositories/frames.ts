import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { frames, type FrameRow } from "@/db/schema";
import type { Frame, SlotCount } from "@/lib/types";

interface FrameLayout {
  background?: string;
  accent?: string;
  caption?: string;
}

const DEFAULT_LAYOUT: Required<FrameLayout> = {
  background: "#ffffff",
  accent: "#171717",
  caption: "Street Photobooth",
};

/** Ubah baris tabel `frames` menjadi bentuk Frame yang dipakai tata letak. */
export function frameFromRow(row: FrameRow): Frame {
  let layout: FrameLayout = {};
  try {
    layout = JSON.parse(row.layoutJson) as FrameLayout;
  } catch {
    /* layout rusak → pakai bawaan */
  }
  return {
    id: row.id,
    name: row.name,
    slotCount: (row.slotCount === 2 ? 2 : 3) as SlotCount,
    background: layout.background ?? DEFAULT_LAYOUT.background,
    accent: layout.accent ?? DEFAULT_LAYOUT.accent,
    caption: layout.caption ?? DEFAULT_LAYOUT.caption,
    isActive: row.isActive,
  };
}

export async function findFrameById(id: string): Promise<Frame | null> {
  const [row] = await db
    .select()
    .from(frames)
    .where(eq(frames.id, id))
    .limit(1);
  return row ? frameFromRow(row) : null;
}
