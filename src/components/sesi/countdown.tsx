"use client";

import { useEffect, useRef, useState } from "react";

interface CountdownProps {
  /** Lama hitungan dalam detik (default 3 → 3, 2, 1). */
  seconds?: number;
  /** Judul instruksi sebelum angka muncul. */
  prepareLabel?: string;
  /** Petunjuk kecil di bawah judul instruksi. */
  prepareHint?: string;
  /** Lama instruksi "Bersiap" tampil sebelum angka pertama (ms). 0 = lewati. */
  prepareDuration?: number;
  /** Tulisan penutup setelah angka habis, tepat sebelum foto diambil. */
  finishLabel?: string;
  /** Lama tulisan penutup tampil sebelum onComplete dipanggil (ms). */
  finishDuration?: number;
  /** Dipanggil sekali ketika hitungan + animasi penutup selesai. */
  onComplete: () => void;
}

/**
 * Overlay hitung mundur di atas kamera: instruksi "Bersiap…", lalu angka
 * besar berdenyut tiap detik, ditutup "Senyum!" sebagai tanda foto diambil.
 * Pasang dengan `key` baru setiap kali ingin memulai ulang hitungan.
 */
export function Countdown({
  seconds = 3,
  prepareLabel = "Bersiap…",
  prepareHint = "Lihat ke kamera & atur gaya terbaikmu",
  prepareDuration = 1500,
  finishLabel = "Senyum!",
  finishDuration = 500,
  onComplete,
}: CountdownProps) {
  const [preparing, setPreparing] = useState(prepareDuration > 0);
  const [remaining, setRemaining] = useState(seconds);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (preparing) {
      const t = setTimeout(() => setPreparing(false), prepareDuration);
      return () => clearTimeout(t);
    }
    if (remaining > 0) {
      const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => onCompleteRef.current(), finishDuration);
    return () => clearTimeout(t);
  }, [preparing, remaining, prepareDuration, finishDuration]);

  const finished = !preparing && remaining === 0;
  const ariaLabel = preparing
    ? prepareLabel
    : finished
      ? finishLabel
      : `Foto dalam ${remaining} detik`;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/30"
      role="timer"
      aria-live="assertive"
      aria-label={ariaLabel}
    >
      {preparing ? (
        <div
          key="prepare"
          className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center gap-4 text-center text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] duration-500"
        >
          <span className="text-7xl font-black tracking-tight">
            {prepareLabel}
          </span>
          <span className="rounded-full bg-black/50 px-6 py-2 text-2xl font-medium backdrop-blur">
            {prepareHint}
          </span>
        </div>
      ) : finished ? (
        <span
          key="finish"
          className="animate-in fade-in zoom-in-150 text-8xl font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] duration-300"
        >
          {finishLabel}
        </span>
      ) : (
        <div
          key={remaining}
          className="relative flex items-center justify-center"
        >
          {/* Cincin yang mengembang & memudar tiap detik */}
          <span className="absolute size-64 animate-ping rounded-full border-8 border-white/40 [animation-iteration-count:1] [animation-duration:1s]" />
          <span className="animate-in fade-in zoom-in-50 text-[12rem] leading-none font-black text-white tabular-nums drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] duration-300">
            {remaining}
          </span>
        </div>
      )}
    </div>
  );
}
