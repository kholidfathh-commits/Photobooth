/* eslint-disable @next/next/no-img-element -- gambar hasil canvas (blob URL), bukan aset statis */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Check } from "lucide-react";

import { usePhotoSession } from "@/components/sesi/session-provider";
import { Button } from "@/components/ui/button";
import { PrintPanel } from "@/components/cetak/print-panel";
import { PrintSheet } from "@/components/cetak/print-sheet";
import { findFrame } from "@/lib/mock-data";
import { usePrintSettings } from "@/lib/print-settings-store";

import { UploadStatus } from "./upload-status";

/**
 * Halaman Simpan & Bagikan (/bagikan): menampilkan status unggahan
 * photostrip ke Google Drive. Unggahan sendiri sudah berjalan otomatis
 * di latar belakang sejak foto final selesai digabung (useAutoUpload).
 */
export function ShareScreen() {
  const router = useRouter();
  const { session, uploadState, retryUpload } = usePhotoSession();
  const frame = findFrame(session.frameId);
  const result = session.result;
  const { printerEnabled } = usePrintSettings();

  // Belum ada hasil gabungan (mis. dibuka langsung) → kembali ke Hasil Foto.
  useEffect(() => {
    if (!result) router.replace("/hasil");
  }, [result, router]);

  if (!result || !uploadState) return null;

  return (
    <div className="flex h-dvh flex-col gap-4 bg-neutral-950 p-4 text-white md:p-6">
      <header className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="lg"
          className="h-12 px-4 text-base text-white hover:bg-white/10 hover:text-white"
          render={<Link href="/hasil" />}
          nativeButton={false}
        >
          <ArrowLeft className="size-5" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Simpan & Bagikan</h1>
        {uploadState.status === "berhasil" || uploadState.status === "gagal" ? (
          <Button
            size="lg"
            className="h-12 rounded-full bg-emerald-500 px-6 text-base font-semibold text-white hover:bg-emerald-500/90"
            render={<Link href="/selesai" replace />}
            nativeButton={false}
          >
            Selesai
            <Check className="size-5" />
          </Button>
        ) : (
          // Selama masih mengunggah, sesi belum boleh ditutup agar foto tidak hilang.
          <Button
            size="lg"
            disabled
            className="h-12 rounded-full bg-white/10 px-6 text-base text-neutral-400"
          >
            Menyimpan foto…
          </Button>
        )}
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center gap-12">
        <div className="flex h-full min-h-0 max-w-xs flex-col items-center gap-4">
          <img
            src={result.url}
            alt={`Photostrip ${frame.name}`}
            className="min-h-0 w-auto flex-1 rounded-lg object-contain shadow-2xl"
          />
          {printerEnabled && (
            <PrintPanel
              className="shrink-0"
              preview={{
                imageUrl: result.url,
                stripWidth: result.width,
                stripHeight: result.height,
              }}
            />
          )}
        </div>
        <UploadStatus state={uploadState} onRetry={retryUpload} />
      </main>

      {printerEnabled && (
        <PrintSheet
          src={result.url}
          alt={`Photostrip ${frame.name}`}
          stripWidth={result.width}
          stripHeight={result.height}
        />
      )}
    </div>
  );
}
