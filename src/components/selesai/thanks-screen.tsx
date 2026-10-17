/* eslint-disable @next/next/no-img-element -- gambar hasil canvas (blob URL), bukan aset statis */
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Camera, Heart, Share2 } from "lucide-react";

import { QrCodeDisplay } from "@/components/bagikan/qr-code-display";
import { usePhotoSession } from "@/components/sesi/session-provider";
import { Button } from "@/components/ui/button";
import { downloadUrl } from "@/lib/links";
import { useFrame } from "@/components/frame/frames-provider";

/** Ajakan berbagi acara (sementara data tiruan; nanti dari pengaturan acara). */
const EVENT_SHARE = {
  hashtag: "#Potretin",
};

/** Lama layar terima kasih sebelum kembali otomatis ke halaman awal. */
const AUTO_RETURN_SECONDS = 20;

/** Pesan terima kasih bergiliran agar terasa personal. */
const THANKS_MESSAGES = [
  "Semoga harimu menyenangkan!",
  "Senyummu bikin hari ini lebih cerah!",
  "Sampai jumpa di acara berikutnya!",
];

/**
 * Layar penutup sesi (/selesai): ucapan terima kasih, ajakan membagikan
 * hasil foto, dan tombol untuk memulai sesi baru.
 */
export function ThanksScreen() {
  const router = useRouter();
  const { session, resetSession } = usePhotoSession();
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RETURN_SECONDS);

  // Bersihkan sesi lalu ke halaman awal. replace (bukan push) agar tombol
  // "kembali" tidak membuka halaman sesi lama lagi.
  const goHome = useCallback(() => {
    resetSession();
    router.replace("/");
  }, [resetSession, router]);

  // Kembali otomatis ke halaman awal supaya iPad siap untuk pelanggan berikutnya.
  useEffect(() => {
    if (secondsLeft <= 0) {
      goHome();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, goHome]);
  const frame = useFrame(session.frameId);
  const result = session.result;
  const uploaded =
    result && session.upload?.sourceKey === result.sourceKey
      ? session.upload
      : undefined;
  // Pilih pesan dari waktu mulai sesi (sama di server & browser, tetap
  // selama sesi ini).
  const message =
    THANKS_MESSAGES[
      new Date(session.startedAt).getSeconds() % THANKS_MESSAGES.length
    ];

  return (
    <main className="flex h-dvh items-center justify-center gap-16 bg-neutral-950 p-6 text-white">
      {result && (
        <img
          src={result.url}
          alt={`Photostrip ${frame.name}`}
          className="max-h-[80dvh] w-auto max-w-[16rem] -rotate-3 rounded-lg shadow-2xl ring-8 ring-white/5"
        />
      )}

      <div className="flex max-w-md flex-col gap-8">
        <div className="space-y-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
            <Heart className="size-7 fill-current" />
          </span>
          <h1 className="text-5xl font-bold tracking-tight">Terima kasih!</h1>
          <p className="text-xl text-neutral-400">
            {message} Fotomu tersimpan dan bisa diunduh kapan saja lewat QR
            Code.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <Share2 className="mt-0.5 size-6 shrink-0 text-pink-400" />
          <p className="text-neutral-300">
            Bagikan fotomu di media sosial, pakai{" "}
            <span className="font-semibold text-white">
              {EVENT_SHARE.hashtag}
            </span>{" "}
            — ajak temanmu foto juga, gratis!
          </p>
        </div>

        {uploaded && (
          <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <QrCodeDisplay
              value={downloadUrl(uploaded.qrToken)}
              className="w-28 shrink-0 [&_figcaption]:hidden"
            />
            <p className="text-sm text-neutral-300">
              Belum sempat memindai? Pindai QR ini sekarang untuk menyimpan
              fotomu.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Button
            size="lg"
            onClick={goHome}
            className="h-16 w-full rounded-2xl bg-white text-xl font-semibold text-neutral-950 hover:bg-white/90"
          >
            <Camera className="size-6" />
            Sesi Baru
          </Button>
          <p
            className="text-center text-sm text-neutral-500"
            aria-live="polite"
          >
            Kembali ke halaman awal otomatis dalam {secondsLeft} detik
          </p>
        </div>
      </div>
    </main>
  );
}
