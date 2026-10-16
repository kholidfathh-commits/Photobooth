import type { PhotoSession } from "./types";

/** Sesi foto baru yang kosong untuk frame terpilih. */
export function newSession(frameId: string): PhotoSession {
  return {
    id: `sesi-${crypto.randomUUID()}`,
    frameId,
    status: "siap",
    shots: [],
    startedAt: new Date().toISOString(),
  };
}
