import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { frames, type FrameRow } from "@/db/schema";
import { THEMES } from "@/lib/frames/themes";
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

/** Semua frame aktif, urut nama. */
export async function listActiveFrames(): Promise<Frame[]> {
  const rows = await db
    .select()
    .from(frames)
    .where(eq(frames.isActive, true))
    .orderBy(asc(frames.createdAt), asc(frames.name));
  // Urutan mengikuti katalog desain; frame lain (dari database) di belakang.
  const order = (id: string) => {
    const i = THEMES.findIndex((t) => t.id === id);
    return i === -1 ? THEMES.length : i;
  };
  return rows.map(frameFromRow).sort((a, b) => order(a.id) - order(b.id));
}
