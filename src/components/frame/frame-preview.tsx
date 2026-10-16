"use client";

import { useEffect } from "react";
import { Camera, X } from "lucide-react";

import { PhotostripSlots } from "@/components/sesi/photostrip-slots";
import { Button } from "@/components/ui/button";
import { MOCK_SHOTS } from "@/lib/mock-data";
import type { Frame } from "@/lib/types";
import { cn } from "@/lib/utils";

import { SlotIllustration } from "./slot-illustration";

interface FramePreviewProps {
  frame: Frame;
  onClose: () => void;
  onStart: () => void;
}

/**
 * Pratinjau besar frame terpilih, diisi foto contoh, supaya pelanggan
 * melihat gambaran hasil akhir sebelum mulai berfoto.
 */
export function FramePreview({ frame, onClose, onStart }: FramePreviewProps) {
  const sampleShots = MOCK_SHOTS.slice(0, frame.slotCount);

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
      aria-label={`Contoh hasil frame ${frame.name}`}
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md duration-200"
      onClick={onClose}
    >
      <div
        className="animate-in zoom-in-95 flex max-h-full items-center gap-12 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "max-h-[calc(100dvh-3rem)] shrink-0 overflow-y-auto",
            frame.slotCount === 3 ? "w-64" : "w-80",
          )}
        >
          <PhotostripSlots frame={frame} shots={sampleShots} activeIndex={-1} />
        </div>

        <div className="flex max-w-sm flex-col gap-6 text-white">
          <div className="space-y-2">
            <p className="text-sm font-semibold tracking-[0.2em] text-neutral-400 uppercase">
              Contoh hasil
            </p>
            <h2 className="text-4xl font-bold tracking-tight">{frame.name}</h2>
            <p className="text-lg text-neutral-400">
              Begini kira-kira photostrip-mu nanti. Fotomu sendiri akan
              menggantikan foto contoh.
            </p>
          </div>

          <SlotIllustration frame={frame} />

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={onStart}
              autoFocus
              className="h-16 rounded-2xl bg-white text-xl font-semibold text-neutral-950 hover:bg-white/90"
            >
              <Camera className="size-6" />
              Mulai Foto
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={onClose}
              className="h-12 rounded-2xl text-base text-neutral-300 hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
              Pilih Frame Lain
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
