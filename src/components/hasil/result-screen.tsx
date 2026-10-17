"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CloudUpload, RotateCcw } from "lucide-react";

import { usePhotoSession } from "@/components/sesi/session-provider";
import { Button } from "@/components/ui/button";
import { useFrame } from "@/components/frame/frames-provider";
import { photostripSourceKey } from "@/lib/photostrip";
import { newSession } from "@/lib/session";
import { cn } from "@/lib/utils";

import { ComposedPhotostrip, type ComposeStatus } from "./composed-photostrip";

/**
 * Skala resolusi hasil akhir: lebar 600 × 3 = 1800 px, cukup tajam untuk
 * dicetak (≈ 300 dpi pada lebar 6 inci).
 */
const RESULT_SCALE = 3;

/**
 * Halaman Hasil Foto (/hasil): pratinjau akhir photostrip — semua jepretan
 * sesi digabung ke dalam frame pilihan menjadi satu gambar (canvas) —
 * sebelum disimpan dan dibagikan.
 */
export function ResultScreen() {
  const router = useRouter();
  const { session, setSession, uploadState } = usePhotoSession();
  const frame = useFrame(session.frameId);
  const complete = session.shots.length >= frame.slotCount;
  const resultReady = Boolean(
    session.result?.sourceKey.startsWith(
      photostripSourceKey(frame, session.shots),
    ),
  );

  const [composeStatus, setComposeStatus] = useState<ComposeStatus>("proses");

  // "Ulangi Sesi" butuh dua ketukan agar tidak terhapus tanpa sengaja.
  const [confirmRestart, setConfirmRestart] = useState(false);
  useEffect(() => {
    if (!confirmRestart) return;
    const t = setTimeout(() => setConfirmRestart(false), 3000);
    return () => clearTimeout(t);
  }, [confirmRestart]);

  const restartSession = () => {
    if (!confirmRestart) {
      setConfirmRestart(true);
      return;
    }
    setSession(newSession(frame.id));
    router.push("/sesi");
  };

  // Belum lengkap (mis. halaman dibuka langsung) → kembali ke sesi foto.
  useEffect(() => {
    if (!complete) router.replace("/sesi");
  }, [complete, router]);

  if (!complete) return null;

  return (
    <div className="flex h-dvh flex-col gap-4 bg-neutral-950 p-4 text-white md:p-6">
      <header className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="lg"
          className="h-12 px-4 text-base text-white hover:bg-white/10 hover:text-white"
          render={<Link href="/sesi" />}
          nativeButton={false}
        >
          <ArrowLeft className="size-5" />
          Kembali ke Foto
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Pratinjau Akhir</h1>
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center gap-12">
        <section
          aria-label="Pratinjau photostrip"
          className={cn(
            "max-h-full shrink-0 overflow-y-auto",
            frame.slotCount === 3 ? "w-64 lg:w-72" : "w-80 lg:w-96",
          )}
        >
          <ComposedPhotostrip
            frame={frame}
            shots={session.shots}
            scale={RESULT_SCALE}
            zoomable
            onStatusChange={setComposeStatus}
            className="w-full rounded-lg shadow-2xl"
          />
        </section>

        <section className="flex max-w-sm flex-col gap-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold tracking-[0.2em] text-neutral-400 uppercase">
              Hasil fotomu
            </p>
            <h2 className="text-4xl font-bold tracking-tight">Keren banget!</h2>
            <p className="text-lg text-neutral-400">
              {session.shots.length} foto dengan frame{" "}
              <span className="font-semibold text-white">{frame.name}</span>.
              Cek dulu sebelum disimpan dan dibagikan.
            </p>
          </div>

          {resultReady && uploadState && (
            <p
              className="flex items-center gap-2 text-sm text-neutral-400"
              aria-live="polite"
            >
              <CloudUpload className="size-4" />
              {uploadState.status === "mengunggah" &&
                `Menyimpan foto otomatis… ${Math.round(uploadState.progress * 100)}%`}
              {uploadState.status === "berhasil" &&
                "Foto sudah tersimpan otomatis"}
              {(uploadState.status === "mencoba-ulang" ||
                uploadState.status === "menunggu-internet") &&
                "Penyimpanan tersendat — sedang dicoba lagi otomatis"}
              {uploadState.status === "gagal" &&
                "Penyimpanan otomatis gagal — lanjutkan untuk mencoba lagi"}
            </p>
          )}

          {composeStatus === "gagal" && (
            <p className="rounded-2xl bg-red-500/15 px-4 py-3 text-base text-red-200">
              Foto belum berhasil digabung. Tekan{" "}
              <span className="font-semibold">Coba lagi</span> pada gambar, atau
              ulangi sesi bila tetap gagal.
            </p>
          )}

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              disabled={!resultReady}
              onClick={() => router.push("/bagikan")}
              className="h-16 rounded-2xl bg-white text-xl font-semibold text-neutral-950 hover:bg-white/90"
            >
              {resultReady
                ? "Simpan & Bagikan"
                : composeStatus === "gagal"
                  ? "Hasil belum siap"
                  : "Menyiapkan hasil…"}
              <ArrowRight className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={restartSession}
              className={cn(
                "h-12 rounded-2xl text-base hover:bg-white/10 hover:text-white",
                confirmRestart
                  ? "bg-red-500/15 text-red-300"
                  : "text-neutral-300",
              )}
            >
              <RotateCcw className="size-5" />
              {confirmRestart
                ? "Ketuk lagi untuk foto ulang dari awal"
                : "Ulangi Sesi"}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
