/* eslint-disable @next/next/no-img-element -- gambar hasil canvas (blob URL), bukan aset statis */
"use client";

import { useEffect, useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PhotostripImage } from "@/lib/types";
import { cn } from "@/lib/utils";

/** "pas" = muat seluruh gambar di layar; angka = persentase ukuran asli. */
type Zoom = "pas" | 50 | 100;
const LEVELS: { value: Zoom; label: string }[] = [
  { value: "pas", label: "Pas layar" },
  { value: 50, label: "50%" },
  { value: 100, label: "100%" },
];

interface ZoomViewerProps {
  image: PhotostripImage;
  alt: string;
  onClose: () => void;
}

/**
 * Penampil layar penuh untuk memeriksa ketajaman photostrip resolusi tinggi:
 * pilih Pas layar / 50% / 100% lalu geser gambar dengan jari.
 */
export function ZoomViewer({ image, alt, onClose }: ZoomViewerProps) {
  const [zoom, setZoom] = useState<Zoom>("pas");
  const index = LEVELS.findIndex((l) => l.value === zoom);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Perbesar hasil foto"
      className="animate-in fade-in fixed inset-0 z-50 flex flex-col bg-black/95 text-white duration-200"
    >
      <div className="flex shrink-0 items-center justify-between gap-4 p-4">
        <span className="rounded-full bg-white/10 px-4 py-2 text-sm tabular-nums">
          {image.width} × {image.height} px
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Perkecil"
            disabled={index <= 0}
            onClick={() => setZoom(LEVELS[index - 1].value)}
            className="size-12 rounded-full text-white hover:bg-white/10 hover:text-white"
          >
            <ZoomOut className="size-6" />
          </Button>
          {LEVELS.map((l) => (
            <button
              key={l.label}
              type="button"
              aria-pressed={zoom === l.value}
              onClick={() => setZoom(l.value)}
              className={cn(
                "h-12 rounded-full px-5 text-base font-semibold transition-colors",
                zoom === l.value
                  ? "bg-white text-neutral-950"
                  : "text-neutral-300 hover:bg-white/10",
              )}
            >
              {l.label}
            </button>
          ))}
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Perbesar"
            disabled={index >= LEVELS.length - 1}
            onClick={() => setZoom(LEVELS[index + 1].value)}
            className="size-12 rounded-full text-white hover:bg-white/10 hover:text-white"
          >
            <ZoomIn className="size-6" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Tutup"
          onClick={onClose}
          className="size-12 rounded-full text-white hover:bg-white/10 hover:text-white"
        >
          <X className="size-7" />
        </Button>
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-auto overscroll-contain px-4 pb-4",
          zoom === "pas" && "flex items-center justify-center",
        )}
      >
        <img
          src={image.url}
          alt={alt}
          draggable={false}
          className={cn(
            "mx-auto rounded-lg",
            zoom === "pas" && "max-h-full max-w-full object-contain",
          )}
          style={
            zoom === "pas"
              ? undefined
              : {
                  width: (image.width * zoom) / 100,
                  maxWidth: "none",
                }
          }
        />
      </div>
    </div>
  );
}
