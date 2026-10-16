/* eslint-disable @next/next/no-img-element -- gambar photostrip pelanggan dari penyimpanan, ukurannya bervariasi */
"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff, Maximize2, X } from "lucide-react";

import type { DownloadInfo } from "@/lib/download";
import { cn } from "@/lib/utils";

/**
 * Pratinjau photostrip di HP pelanggan: kerangka berdenyut selama gambar
 * dimuat (jaringan event sering lambat), pesan bila gagal, dan ketuk untuk
 * melihat ukuran penuh.
 */
export function PhotoPreview({ info }: { info: DownloadInfo }) {
  const [status, setStatus] = useState<"memuat" | "siap" | "gagal">("memuat");
  const [fullOpen, setFullOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Gambar bisa selesai dimuat (dari cache) sebelum React terpasang sehingga
  // onLoad terlewat — cek status awalnya sekali saat mount.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) setStatus(img.naturalWidth > 0 ? "siap" : "gagal");
  }, []);
  const alt = `Photostrip ${info.frameName}`;
  const aspectRatio = `${info.width} / ${info.height}`;

  return (
    <>
      <button
        type="button"
        onClick={() => status === "siap" && setFullOpen(true)}
        aria-label="Lihat foto ukuran penuh"
        className="relative w-full max-w-xs overflow-hidden rounded-lg shadow-2xl"
        style={{ aspectRatio }}
      >
        {status === "memuat" && (
          <span className="absolute inset-0 animate-pulse bg-white/10" />
        )}
        {status === "gagal" ? (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/5 p-6 text-neutral-400">
            <ImageOff className="size-8" />
            <span className="text-sm">
              Pratinjau gagal dimuat. Tombol unduh tetap bisa dicoba.
            </span>
          </span>
        ) : (
          <img
            ref={imgRef}
            src={info.imageUrl}
            alt={alt}
            width={info.width}
            height={info.height}
            onLoad={() => setStatus("siap")}
            onError={() => setStatus("gagal")}
            className={cn(
              "size-full object-contain transition-opacity duration-300",
              status === "siap" ? "opacity-100" : "opacity-0",
            )}
          />
        )}
        {status === "siap" && (
          <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">
            <Maximize2 className="size-3.5" />
            Perbesar
          </span>
        )}
      </button>

      {fullOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-50 overflow-auto bg-black/95 p-4"
          onClick={() => setFullOpen(false)}
        >
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => setFullOpen(false)}
            className="fixed top-3 right-3 z-10 flex size-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur"
          >
            <X className="size-6" />
          </button>
          <img
            src={info.imageUrl}
            alt={alt}
            className="mx-auto w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
