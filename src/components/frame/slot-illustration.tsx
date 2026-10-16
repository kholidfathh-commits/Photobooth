import { UserRound } from "lucide-react";

import type { Frame } from "@/lib/types";

interface SlotIllustrationProps {
  frame: Frame;
}

/**
 * Ilustrasi jumlah jepretan untuk frame terpilih: satu kotak bergambar orang
 * per slot, memakai warna frame, plus keterangan berapa kali foto diambil.
 */
export function SlotIllustration({ frame }: SlotIllustrationProps) {
  return (
    <div
      className="flex items-center gap-4"
      aria-label={`${frame.name}: ${frame.slotCount} kali jepret`}
    >
      <div
        className="flex gap-1.5 rounded-xl p-1.5"
        style={{ backgroundColor: frame.background }}
        aria-hidden
      >
        {Array.from({ length: frame.slotCount }, (_, i) => (
          <div
            key={i}
            className="relative flex aspect-[4/3] w-14 items-end justify-center overflow-hidden rounded-md"
            style={{ backgroundColor: `${frame.accent}26` }}
          >
            <UserRound
              className="size-9 translate-y-1.5"
              style={{ color: frame.accent }}
              strokeWidth={1.75}
            />
            <span
              className="absolute top-0.5 left-1 text-[10px] font-bold"
              style={{ color: frame.accent }}
            >
              {i + 1}
            </span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-lg font-semibold text-white">
          {frame.name} · {frame.slotCount} foto
        </p>
        <p className="text-sm text-neutral-400">
          Kamera jepret {frame.slotCount} kali, tiap foto diawali hitung mundur
          3 detik
        </p>
      </div>
    </div>
  );
}
