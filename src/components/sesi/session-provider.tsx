"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { MOCK_SESSION } from "@/lib/mock-data";
import { newSession } from "@/lib/session";
import type { ComposedPhotostrip } from "@/lib/photostrip";
import type { PhotoSession } from "@/lib/types";
import type { UploadState } from "@/lib/upload";

import { useAutoUpload } from "./use-auto-upload";

interface SessionContextValue {
  session: PhotoSession;
  setSession: Dispatch<SetStateAction<PhotoSession>>;
  /** Simpan gambar photostrip hasil gabungan ke sesi berjalan. */
  saveResult: (result: ComposedPhotostrip, sourceKey: string) => void;
  /** Status unggah otomatis untuk hasil gabungan saat ini (null = belum ada hasil). */
  uploadState: UploadState | null;
  /** Ulangi unggahan setelah gagal total. */
  retryUpload: () => void;
  /**
   * Bersihkan sesi: foto, hasil gabungan, dan status unggah dibuang, diganti
   * sesi kosong baru — agar data pelanggan tidak tertukar dengan berikutnya.
   */
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Menyimpan sesi foto yang sedang berjalan di memori, supaya hasil jepretan
 * dan gambar gabungannya ikut terbawa saat pindah halaman
 * (Sesi Foto → Hasil → QR/Cetak). Sengaja tidak disimpan ke storage: data
 * hilang saat halaman dimuat ulang, jadi foto pelanggan tidak tertinggal di iPad.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PhotoSession>(MOCK_SESSION);

  const saveResult = useCallback(
    (result: ComposedPhotostrip, sourceKey: string) => {
      const url = URL.createObjectURL(result.blob);
      setSession((s) => ({ ...s, result: { ...result, url, sourceKey } }));
    },
    [],
  );

  // Cabut object URL hasil lama setiap kali hasil diganti/dihapus.
  const resultUrl = session.result?.url;
  const previousUrl = useRef<string | undefined>(undefined);
  useEffect(() => {
    const old = previousUrl.current;
    previousUrl.current = resultUrl;
    if (old && old !== resultUrl) URL.revokeObjectURL(old);
  }, [resultUrl]);

  const { state: uploadState, retry: retryUpload } = useAutoUpload(
    session,
    setSession,
  );

  const resetSession = useCallback(
    () => setSession((s) => newSession(s.frameId)),
    [],
  );

  return (
    <SessionContext.Provider
      value={{
        session,
        setSession,
        saveResult,
        uploadState,
        retryUpload,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function usePhotoSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("usePhotoSession harus dipakai di dalam <SessionProvider>");
  }
  return ctx;
}
