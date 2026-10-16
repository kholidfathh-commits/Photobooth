import { cn } from "@/lib/utils";

interface ShotIndicatorProps {
  /** Jumlah foto yang sudah diambil. */
  taken: number;
  /** Jumlah slot pada frame (2 atau 3). */
  total: number;
}

/**
 * Indikator "Foto X dari Y" + titik progres per slot.
 * Titik terisi = sudah dijepret, titik melebar = foto yang sedang diambil.
 */
export function ShotIndicator({ taken, total }: ShotIndicatorProps) {
  const done = taken >= total;
  const current = Math.min(taken + 1, total);
  const label = done
    ? `${total} foto selesai`
    : `Foto ${current} dari ${total}`;

  return (
    <div
      className="flex items-center gap-3 rounded-full bg-white px-4 py-2 text-neutral-950"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="text-sm font-semibold tabular-nums">
        {done ? (
          label
        ) : (
          <>
            Foto <span className="text-base">{current}</span> dari {total}
          </>
        )}
      </span>
      <span className="flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-2.5 rounded-full transition-all duration-300",
              i < taken && "w-2.5 bg-neutral-950",
              i === taken && !done && "w-6 bg-orange-500",
              i > taken && "w-2.5 bg-neutral-300",
            )}
          />
        ))}
      </span>
    </div>
  );
}
