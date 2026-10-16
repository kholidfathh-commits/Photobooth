"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { MOCK_FRAMES } from "@/lib/mock-data";
import type { Frame } from "@/lib/types";

const CACHE_KEY = "photobooth:frame";

interface FramesContextValue {
  /** Frame aktif (dari server; cadangan: tersimpan di iPad / bawaan). */
  frames: Frame[];
  /** Frame berdasarkan id (selalu mengembalikan frame, cadangan frame pertama). */
  getFrame: (id: string) => Frame;
  /** "server" = data terbaru, "cadangan" = offline / belum termuat. */
  source: "server" | "cadangan";
}

const FramesContext = createContext<FramesContextValue | null>(null);

function isFrame(v: unknown): v is Frame {
  const f = v as Frame;
  return (
    typeof f?.id === "string" &&
    typeof f.name === "string" &&
    (f.slotCount === 2 || f.slotCount === 3) &&
    typeof f.background === "string" &&
    typeof f.accent === "string" &&
    typeof f.caption === "string"
  );
}

/**
 * Daftar frame untuk seluruh aplikasi. Diambil dari GET /api/frames dan
 * disimpan di iPad, sehingga tetap bisa dipakai saat internet acara putus.
 */
export function FramesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    frames: Frame[];
    source: "server" | "cadangan";
  }>({ frames: MOCK_FRAMES, source: "cadangan" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1) Salinan terakhir di iPad (langsung, tanpa jaringan).
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null");
        if (
          !cancelled &&
          Array.isArray(cached) &&
          cached.length > 0 &&
          cached.every(isFrame)
        ) {
          setState({ frames: cached, source: "cadangan" });
        }
      } catch {
        /* abaikan salinan rusak */
      }
      // 2) Data terbaru dari server.
      try {
        const res = await fetch("/api/frames", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { frames?: unknown };
        const frames = Array.isArray(json.frames)
          ? json.frames.filter(isFrame)
          : [];
        if (cancelled || frames.length === 0) return;
        setState({ frames, source: "server" });
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(frames));
        } catch {
          /* penyimpanan penuh/diblokir */
        }
      } catch {
        /* offline — tetap pakai cadangan */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getFrame = useCallback(
    (id: string) =>
      state.frames.find((f) => f.id === id) ??
      MOCK_FRAMES.find((f) => f.id === id) ??
      state.frames[0],
    [state.frames],
  );

  const value = useMemo(
    () => ({ frames: state.frames, getFrame, source: state.source }),
    [state, getFrame],
  );
  return (
    <FramesContext.Provider value={value}>{children}</FramesContext.Provider>
  );
}

export function useFrames(): FramesContextValue {
  const ctx = useContext(FramesContext);
  if (!ctx)
    throw new Error("useFrames harus dipakai di dalam <FramesProvider>");
  return ctx;
}

/** Frame untuk id tertentu (mis. frame sesi berjalan). */
export function useFrame(id: string): Frame {
  return useFrames().getFrame(id);
}
