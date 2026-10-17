/* eslint-disable @next/next/no-img-element -- gambar frame & jepretan kamera (data URL), bukan aset yang dioptimasi */
import { resolveTheme } from "@/lib/frames/resolve";
import { CANVAS, frameAssetUrl, LAYOUTS } from "@/lib/frames/themes";
import { arrangeShots } from "@/lib/photostrip";
import type { Frame, Shot } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PhotostripSlotsProps {
  frame: Frame;
  shots: Shot[];
  /** Slot yang sedang diisi/diulang (diberi cincin). -1 = tidak ada. */
  activeIndex?: number;
  className?: string;
}

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/**
 * Pratinjau photostrip 9:16 persis seperti hasil akhir: gambar latar frame,
 * jepretan di tiap slot (slot kosong bernomor), lalu hiasan depan.
 */
export function PhotostripSlots({
  frame,
  shots,
  activeIndex = shots.length,
  className,
}: PhotostripSlotsProps) {
  const theme = resolveTheme(frame);
  const rects = LAYOUTS[theme.layout];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl shadow-xl",
        className,
      )}
      style={{
        aspectRatio: `${CANVAS.width} / ${CANVAS.height}`,
        backgroundColor: theme.background,
      }}
    >
      {theme.hasArt && (
        <img
          src={frameAssetUrl(theme.id, "latar")}
          alt=""
          className="absolute inset-0 size-full"
          draggable={false}
        />
      )}

      {arrangeShots(frame.slotCount, shots).map((shot, i) => {
        const r = rects[i];
        const isActive = i === activeIndex;
        return (
          <div
            key={i}
            className={cn(
              "absolute flex items-center justify-center overflow-hidden",
              isActive &&
                "ring-4 ring-sky-400 ring-offset-2 ring-offset-transparent",
            )}
            style={{
              left: pct(r.x, CANVAS.width),
              top: pct(r.y, CANVAS.height),
              width: pct(r.width, CANVAS.width),
              height: pct(r.height, CANVAS.height),
              borderRadius: `${(theme.radius / r.width) * 100}% / ${(theme.radius / r.height) * 100}%`,
              backgroundColor: shot ? undefined : theme.placeholder,
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
                className="text-2xl font-semibold opacity-60"
                style={{ color: theme.accent }}
              >
                {i + 1}
              </span>
            )}
          </div>
        );
      })}

      {theme.hasArt && theme.hasFront && (
        <img
          src={frameAssetUrl(theme.id, "depan")}
          alt=""
          className="pointer-events-none absolute inset-0 size-full"
          draggable={false}
        />
      )}

      {!theme.hasArt && (
        <p
          className="absolute inset-x-0 bottom-[6%] text-center font-serif text-xl font-bold"
          style={{ color: theme.accent }}
        >
          Potretin
        </p>
      )}
    </div>
  );
}
