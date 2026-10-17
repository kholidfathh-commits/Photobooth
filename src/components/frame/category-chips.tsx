import type { Kategori } from "@/lib/frames/themes";
import { cn } from "@/lib/utils";

export type KategoriPilihan = Kategori | "Semua";

interface CategoryChipsProps {
  /** Kategori yang punya frame (urut), beserta jumlahnya. */
  options: { kategori: KategoriPilihan; count: number }[];
  value: KategoriPilihan;
  onChange: (value: KategoriPilihan) => void;
}

/** Deretan chip kategori frame (bisa digeser bila tidak muat). */
export function CategoryChips({
  options,
  value,
  onChange,
}: CategoryChipsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Kategori frame"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:-mx-6 md:px-6 [&::-webkit-scrollbar]:hidden"
    >
      {options.map(({ kategori, count }) => {
        const active = kategori === value;
        return (
          <button
            key={kategori}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(kategori)}
            className={cn(
              "flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-base font-semibold transition-colors [-webkit-tap-highlight-color:transparent]",
              active
                ? "border-white bg-white text-neutral-950"
                : "border-white/15 bg-white/5 text-neutral-300 hover:text-white",
            )}
          >
            {kategori}
            <span className="text-sm font-medium text-neutral-500">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
