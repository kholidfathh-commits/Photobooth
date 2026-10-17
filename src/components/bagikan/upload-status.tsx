"use client";

import { useEffect, useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  CloudUpload,
  RotateCcw,
  WifiOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadUrl } from "@/lib/links";
import type { UploadState } from "@/lib/upload";
import { cn } from "@/lib/utils";

import { DownloadLink } from "./download-link";
import { QrCodeDisplay } from "./qr-code-display";
import { ScanGuide } from "./scan-guide";

import { UploadSteps } from "./upload-steps";

/** Sisa detik menuju `at` (epoch ms), diperbarui tiap detik. */
function useSecondsUntil(at: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [at]);
  return Math.max(0, Math.ceil((at - now) / 1000));
}

function RetryCountdown({ at }: { at: number }) {
  const seconds = useSecondsUntil(at);
  return <>{seconds > 0 ? `dalam ${seconds} detik` : "sekarang"}</>;
}

interface UploadStatusProps {
  state: UploadState;
  /** Tombol "Coba Lagi" saat unggahan gagal total. */
  onRetry?: () => void;
}

/** Kartu status unggahan photostrip ke Google Drive (tahapan + detail). */
export function UploadStatus({ state, onRetry }: UploadStatusProps) {
  return (
    <section
      className={cn(
        "flex w-full flex-col gap-5 rounded-3xl",
        state.status === "berhasil" ? "max-w-2xl" : "max-w-md",
        "bg-white/5 p-6 ring-1 ring-white/10",
      )}
      role={state.status === "gagal" ? "alert" : "status"}
      aria-live="polite"
    >
      <UploadSteps state={state} />
      {state.status === "mengunggah" && (
        <>
          <CloudUpload className="size-10 animate-pulse text-sky-300" />
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Menyimpan fotomu…</h2>
            <p className="text-neutral-400">
              Tunggu sebentar, fotomu sedang diunggah.
            </p>
          </div>
          <div className="space-y-2">
            <div
              className="h-3 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(state.progress * 100)}
              aria-label="Progres unggahan"
            >
              <div
                className="h-full rounded-full bg-sky-400 transition-[width] duration-200"
                style={{ width: `${state.progress * 100}%` }}
              />
            </div>
            <p className="text-right text-sm text-neutral-400 tabular-nums">
              {Math.round(state.progress * 100)}%
            </p>
          </div>
        </>
      )}

      {state.status === "berhasil" && (
        <>
          <div className="flex items-center gap-3">
            <CircleCheck className="size-9 shrink-0 text-emerald-400" />
            <div>
              <h2 className="text-2xl font-bold">Tersimpan!</h2>
              <p className="text-neutral-400">
                Fotomu sudah tersimpan dengan aman.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-[15rem_1fr] items-center gap-6">
            <QrCodeDisplay value={downloadUrl(state.upload.qrToken)} />
            <div className="flex min-w-0 flex-col gap-5">
              <ScanGuide />
              <DownloadLink upload={state.upload} />
            </div>
          </div>
        </>
      )}

      {state.status === "mencoba-ulang" && (
        <>
          <RotateCcw className="size-10 animate-spin text-amber-300 [animation-direction:reverse] [animation-duration:2s]" />
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Unggahan tersendat</h2>
            <p className="text-neutral-400">
              {state.message}. Mencoba lagi otomatis{" "}
              <RetryCountdown at={state.retryAt} /> (percobaan{" "}
              {state.attempt + 1} dari {state.maxAttempts}).
            </p>
          </div>
        </>
      )}

      {state.status === "menunggu-internet" && (
        <>
          <WifiOff className="size-10 text-amber-300" />
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Menunggu internet…</h2>
            <p className="text-neutral-400">{state.message}</p>
          </div>
        </>
      )}

      {state.status === "gagal" && (
        <>
          <CircleAlert className="size-10 text-red-400" />
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Gagal menyimpan</h2>
            <p className="text-neutral-400">
              {state.message}. Fotomu masih aman di iPad ini — coba kirim ulang,
              atau minta bantuan operator.
            </p>
          </div>
          {onRetry && (
            <Button
              size="lg"
              onClick={onRetry}
              className="h-14 rounded-2xl bg-white text-lg font-semibold text-neutral-950 hover:bg-white/90"
            >
              <RotateCcw className="size-5" />
              Coba Lagi
            </Button>
          )}
        </>
      )}
    </section>
  );
}
