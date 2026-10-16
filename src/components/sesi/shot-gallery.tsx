/* eslint-disable @next/next/no-img-element -- gambar berupa data URL dari kamera, bukan aset statis */
"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Shot } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ShotGalleryProps {
  shots: Shot[];
  /** Urutan foto (orderIndex) yang sedang ditampilkan besar. */
  selectedIndex: number;
  onSelect: (orderIndex: number) => void;
  /** Dipanggil saat pelanggan menekan "Ulangi" pada foto yang tampil besar. */
  onRetake?: (orderIndex: number) => void;
}

/**
 * Galeri hasil jepretan sesi, urut sesuai urutan foto: satu foto besar
 * di atas, deretan thumbnail bernomor di bawah. Ketuk thumbnail untuk
 * menampilkannya besar, tekan "Ulangi" untuk memotret ulang foto itu.
 */
export function ShotGallery({
  shots,
  selectedIndex,
  onSelect,
  onRetake,
}: ShotGalleryProps) {
  const ordered = [...shots].sort((a, b) => a.orderIndex - b.orderIndex);
  const active =
    ordered.find((s) => s.orderIndex === selectedIndex) ?? ordered[0];

  if (!active) return null;

  return (
    <div className="flex size-full min-h-0 flex-col gap-4">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl bg-neutral-900 ring-1 ring-white/10">
        <img
          key={active.id}
          src={active.src}
          alt={`Foto ${active.orderIndex + 1}`}
          className="animate-in fade-in size-full object-contain duration-300"
        />
        <span className="absolute top-4 left-4 rounded-full bg-black/60 px-4 py-2 text-lg font-semibold backdrop-blur">
          Foto {active.orderIndex + 1} dari {ordered.length}
        </span>
        {onRetake && (
          <Button
            size="lg"
            onClick={() => onRetake(active.orderIndex)}
            className="absolute right-4 bottom-4 h-14 rounded-full bg-white px-6 text-lg font-semibold text-neutral-950 shadow-lg hover:bg-white/90"
          >
            <RotateCcw className="size-5" />
            Ulangi Foto {active.orderIndex + 1}
          </Button>
        )}
      </div>

      <div
        className="flex shrink-0 justify-center gap-3"
        role="tablist"
        aria-label="Hasil foto"
      >
        {ordered.map((shot) => {
          const isActive = shot.id === active.id;
          return (
            <button
              key={shot.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Lihat foto ${shot.orderIndex + 1}`}
              onClick={() => onSelect(shot.orderIndex)}
              className={cn(
                "relative aspect-[4/3] h-24 overflow-hidden rounded-xl ring-offset-4 ring-offset-neutral-950 transition-all",
                isActive ? "ring-4 ring-white" : "opacity-60 hover:opacity-100",
              )}
            >
              <img src={shot.src} alt="" className="size-full object-cover" />
              <span className="absolute bottom-1 left-1 flex size-7 items-center justify-center rounded-full bg-black/70 text-sm font-bold">
                {shot.orderIndex + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
