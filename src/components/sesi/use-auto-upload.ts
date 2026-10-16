"use client";

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { findFrame } from "@/lib/mock-data";
import type { PhotoSession } from "@/lib/types";
import {
  createMockUploader,
  MAX_UPLOAD_ATTEMPTS,
  retryDelay,
  type UploadState,
} from "@/lib/upload";

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Dibatalkan", "AbortError"));
    });
  });
}

/** Tunggu sampai perangkat kembali online (langsung selesai bila sudah). */
function waitOnline(signal: AbortSignal) {
  if (typeof navigator === "undefined" || navigator.onLine) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const onOnline = () => {
      window.removeEventListener("online", onOnline);
      resolve();
    };
    window.addEventListener("online", onOnline);
    signal.addEventListener("abort", () => {
      window.removeEventListener("online", onOnline);
      reject(new DOMException("Dibatalkan", "AbortError"));
    });
  });
}

/**
 * Unggah otomatis: begitu photostrip final selesai digabung (session.result),
 * langsung diunggah di latar belakang tanpa langkah tambahan dari pelanggan.
 * Gagal → dicoba ulang otomatis dengan jeda bertahap (maks MAX_UPLOAD_ATTEMPTS);
 * offline → menunggu internet kembali. Setelah menyerah, `retry()` memulai
 * ulang dari percobaan pertama. Bila foto diulang (hasil berganti), unggahan
 * lama dibatalkan.
 */
export function useAutoUpload(
  session: PhotoSession,
  setSession: Dispatch<SetStateAction<PhotoSession>>,
): { state: UploadState | null; retry: () => void } {
  const [uploader] = useState(() => createMockUploader());
  const [live, setLive] = useState<{ key: string; state: UploadState } | null>(
    null,
  );
  const [round, setRound] = useState(0);

  const result = session.result;
  const key = result?.sourceKey;
  const done = Boolean(key && session.upload?.sourceKey === key);

  useEffect(() => {
    if (!result || done) return;
    const sourceKey = result.sourceKey;
    const controller = new AbortController();
    const { signal } = controller;
    const report = (state: UploadState) => setLive({ key: sourceKey, state });

    (async () => {
      let message = "Unggahan gagal";
      for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt++) {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          report({
            status: "menunggu-internet",
            message:
              "Internet terputus. Unggahan lanjut otomatis saat tersambung.",
          });
          await waitOnline(signal);
        }
        report({ status: "mengunggah", progress: 0, attempt });
        try {
          const upload = await uploader.upload(result.blob, {
            sessionId: session.id,
            startedAt: session.startedAt,
            frameName: findFrame(session.frameId).name,
            signal,
            onProgress: (progress) =>
              report({ status: "mengunggah", progress, attempt }),
          });
          setSession((s) => ({ ...s, upload: { ...upload, sourceKey } }));
          return;
        } catch (err) {
          if (signal.aborted) return;
          message = err instanceof Error ? err.message : "Unggahan gagal";
          if (attempt < MAX_UPLOAD_ATTEMPTS) {
            const delay = retryDelay(attempt);
            report({
              status: "mencoba-ulang",
              attempt,
              maxAttempts: MAX_UPLOAD_ATTEMPTS,
              retryAt: Date.now() + delay,
              message,
            });
            await wait(delay, signal);
          }
        }
      }
      report({ status: "gagal", message });
    })().catch(() => {
      /* dibatalkan */
    });

    return () => controller.abort();
    // Mulai ulang saat hasil gabungan berganti atau pelanggan menekan Coba Lagi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, done, uploader, round]);

  const retry = useCallback(() => setRound((r) => r + 1), []);

  let state: UploadState | null;
  if (!result) state = null;
  else if (done && session.upload)
    state = { status: "berhasil", upload: session.upload };
  else if (live && live.key === key) state = live.state;
  else state = { status: "mengunggah", progress: 0, attempt: 1 };

  return { state, retry };
}
