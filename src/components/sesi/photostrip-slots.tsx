/* eslint-disable @next/next/no-img-element -- gambar berupa data URL dari kamera, bukan aset statis */
import { arrangeShots } from "@/lib/photostrip";
import type { Frame, Shot } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PhotostripSlotsProps {
  frame: Frame;
  shots: Shot[];
  /** Slot yang sedang diisi/diulang (diberi cincin). -1 = tidak ada. */
  activeIndex?: number;
}

/** Photostrip mini: slot terisi menampilkan jepretan, slot kosong bernomor. */
export function PhotostripSlots({
  frame,
  shots,
  activeIndex = shots.length,
}: PhotostripSlotsProps) {
  return (
    <div
      className="flex w-full flex-col gap-2 rounded-2xl p-3 shadow-xl"
      style={{ backgroundColor: frame.background }}
    >
      {arrangeShots(frame.slotCount, shots).map((shot, i) => {
        const isActive = i === activeIndex;
        return (
          <div
            key={i}
            className={cn(
              "relative aspect-[4/3] overflow-hidden rounded-lg",
              !shot &&
                "flex items-center justify-center border-2 border-dashed",
              isActive && "ring-4 ring-offset-2",
            )}
            style={{
              borderColor: shot ? undefined : frame.accent,
              ...(isActive && {
                ["--tw-ring-color" as string]: frame.accent,
                ["--tw-ring-offset-color" as string]: frame.background,
              }),
            }}
          >
            {shot ? (
              <img
                key={shot.id}
                src={shot.src}
                alt={`Foto ${i + 1}`}
                className="animate-in fade-in zoom-in-110 size-full object-cover duration-500"
              />
            ) : (
              <span
                className="text-3xl font-semibold opacity-60"
                style={{ color: frame.accent }}
              >
                {i + 1}
              </span>
            )}
          </div>
        );
      })}
      <p
        className="pt-1 text-center text-xs font-semibold tracking-[0.2em] uppercase"
        style={{ color: frame.accent }}
      >
        {frame.caption}
      </p>
    </div>
  );
}
