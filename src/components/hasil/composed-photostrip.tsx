/* eslint-disable @next/next/no-img-element -- gambar hasil canvas (blob URL), bukan aset statis */
"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff, Loader2, Maximize2, RotateCcw } from "lucide-react";

import { usePhotoSession } from "@/components/sesi/session-provider";
import { Button } from "@/components/ui/button";
import {
  composePhotostrip,
  photostripSize,
  photostripSourceKey,
} from "@/lib/photostrip";
import type { Frame, Shot } from "@/lib/types";

import { ZoomViewer } from "./zoom-viewer";

interface ComposedPhotostripProps {
  frame: Frame;
  shots: Shot[];
  /** Pengali resolusi hasil gabungan (lihat composePhotostrip). */
  scale?: number;
  className?: string;
  /** Tampilkan tombol perbesar (layar penuh) di atas gambar. */
  zoomable?: boolean;
  /** Dikabari saat status penggabungan berubah. */
  onStatusChange?: (status: ComposeStatus) => void;
}

export type ComposeStatus = "proses" | "siap" | "gagal";

/**
 * Merender jepretan sesi + frame menjadi SATU gambar photostrip (canvas),
 * menyimpannya ke sesi (session.result) untuk diunggah/dicetak, lalu
 * menampilkannya. Hasil dipakai ulang selama frame & foto tidak berubah.
 */
export function ComposedPhotostrip({
  frame,
  shots,
  scale = 1,
  className,
  zoomable = false,
  onStatusChange,
}: ComposedPhotostripProps) {
  const { session, saveResult } = usePhotoSession();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const size = photostripSize();
  const sourceKey = `${photostripSourceKey(frame, shots)}@${scale}`;
  const result =
    session.result?.sourceKey === sourceKey ? session.result : undefined;

  useEffect(() => {
    if (result) return;
    let cancelled = false;
    composePhotostrip(frame, shots, { scale })
      .then((composed) => {
        if (!cancelled) saveResult(composed, sourceKey);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Gagal menggabungkan foto",
        );
      });
    return () => {
      cancelled = true;
    };
    // `result` hanya penanda sudah ada; sourceKey sudah mewakili frame & foto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey, attempt, saveResult]);

  const status: ComposeStatus = result ? "siap" : error ? "gagal" : "proses";
  const onStatusRef = useRef(onStatusChange);
  useEffect(() => {
    onStatusRef.current = onStatusChange;
  });
  useEffect(() => {
    onStatusRef.current?.(status);
  }, [status]);

  const aspectRatio = `${size.width} / ${size.height}`;

  if (result) {
    const alt = `Photostrip ${frame.name}`;
    const img = (
      <img
        src={result.url}
        alt={alt}
        className={className}
        style={{ aspectRatio }}
        data-width={result.width}
        data-height={result.height}
      />
    );
    if (!zoomable) return img;
    return (
      <>
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label="Perbesar hasil foto"
          className="group relative block w-full"
        >
          {img}
          <span className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-2 text-sm font-semibold text-white backdrop-blur">
            <Maximize2 className="size-4" />
            Perbesar
          </span>
        </button>
        {zoomOpen && (
          <ZoomViewer
            image={result}
            alt={alt}
            onClose={() => setZoomOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center ${className ?? ""}`}
      style={{
        aspectRatio,
        backgroundColor: frame.background,
        color: frame.accent,
      }}
      role={error ? "alert" : "status"}
    >
      {error ? (
        <>
          <ImageOff className="size-10" />
          <div className="space-y-1">
            <p className="text-lg font-semibold">Foto gagal digabung</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
          <Button
            size="lg"
            onClick={() => {
              setError(null);
              setAttempt((a) => a + 1);
            }}
            className="h-12 rounded-full px-6 text-base"
            style={{ backgroundColor: frame.accent, color: frame.background }}
          >
            <RotateCcw className="size-4" />
            Coba lagi
          </Button>
        </>
      ) : (
        <>
          <Loader2 className="size-10 animate-spin" />
          <div className="space-y-1">
            <p className="text-lg font-semibold">Menggabungkan foto…</p>
            <p className="text-sm opacity-80">
              Menyusun {shots.length} foto ke frame {frame.name}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
