/* eslint-disable @next/next/no-img-element -- gambar pratinjau frame statis berukuran kecil */
import { Check, Images } from "lucide-react";

import { PhotostripSlots } from "@/components/sesi/photostrip-slots";
import { findTheme, frameAssetUrl } from "@/lib/frames/themes";
import type { Frame } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FrameCardProps {
  frame: Frame;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Kartu satu desain frame: pratinjau photostrip, nama frame, jumlah foto,
 * dan status pilih (ditandai cincin + lencana "Dipilih").
 */
export function FrameCard({ frame, selected, onSelect }: FrameCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${frame.name}, ${frame.slotCount} foto`}
      data-frame-card
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      className={cn(
        "flex w-52 shrink-0 snap-center flex-col items-center gap-3 rounded-3xl p-3 transition-all duration-200 [-webkit-tap-highlight-color:transparent] active:scale-95",
        selected
          ? "scale-105 bg-white/10 ring-4 ring-white"
          : "opacity-70 hover:opacity-100",
      )}
    >
      <div className="pointer-events-none w-full">
        {findTheme(frame.id) ? (
          // Gambar pratinjau kecil (ringan untuk jaringan acara).
          <img
            src={frameAssetUrl(frame.id, "pratinjau")}
            alt=""
            loading="lazy"
            className="aspect-[9/16] w-full rounded-xl shadow-xl"
            draggable={false}
          />
        ) : (
          <PhotostripSlots frame={frame} shots={[]} activeIndex={-1} />
        )}
      </div>

      <div className="flex w-full flex-col gap-2 px-1 text-left">
        <p className="truncate text-lg font-semibold text-white">
          {frame.name}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-sm text-neutral-400">
            <Images className="size-4" />
            {frame.slotCount} foto
          </span>
          {selected ? (
            <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-semibold text-neutral-950">
              <Check className="size-4" />
              Dipilih
            </span>
          ) : (
            <span className="rounded-full border border-white/20 px-3 py-1 text-sm text-neutral-400">
              Ketuk pilih
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
