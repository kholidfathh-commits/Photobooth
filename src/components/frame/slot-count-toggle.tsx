import type { SlotCount } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: SlotCount[] = [2, 3];

interface SlotCountToggleProps {
  value: SlotCount;
  onChange: (value: SlotCount) => void;
}

/** Sakelar jumlah foto per photostrip: 2 atau 3 foto. */
export function SlotCountToggle({ value, onChange }: SlotCountToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Jumlah foto"
      className="flex rounded-full bg-white/10 p-1.5"
    >
      {OPTIONS.map((count) => {
        const active = count === value;
        return (
          <button
            key={count}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(count)}
            className={cn(
              "flex h-12 items-center gap-2.5 rounded-full px-6 text-lg font-semibold transition-colors [-webkit-tap-highlight-color:transparent]",
              active
                ? "bg-white text-neutral-950"
                : "text-neutral-300 hover:text-white",
            )}
          >
            {/* Ikon mini photostrip sesuai jumlah slot */}
            <span className="flex flex-col gap-0.5" aria-hidden>
              {Array.from({ length: count }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-3 rounded-[2px]",
                    active ? "bg-neutral-950" : "bg-neutral-400",
                  )}
                />
              ))}
            </span>
            {count} Foto
          </button>
        );
      })}
    </div>
  );
}
