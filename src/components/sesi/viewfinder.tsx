import type { ReactNode } from "react";
import { Camera } from "lucide-react";

import type { SessionStatus } from "@/lib/types";

const STATUS_HINT: Record<SessionStatus, string> = {
  siap: "Lihat ke kamera, lalu tekan Mulai Foto",
  "hitung-mundur": "Bersiap…",
  memotret: "Senyum!",
  tinjau: "Semua foto sudah diambil",
};

interface ViewfinderProps {
  status: SessionStatus;
  /** Lapisan di atas kamera, mis. hitung mundur. */
  overlay?: ReactNode;
}

/**
 * Area pratinjau kamera. Untuk sekarang masih tampilan tiruan;
 * aliran video kamera iPad akan dipasang di sini.
 */
export function Viewfinder({ status, overlay }: ViewfinderProps) {
  const showHint = status === "siap" || status === "tinjau";

  return (
    <div className="relative flex aspect-[4/3] max-h-full w-full items-center justify-center overflow-hidden rounded-3xl bg-neutral-900 ring-1 ring-white/10">
      <div className="flex flex-col items-center gap-3 text-neutral-500">
        <Camera className="size-16" strokeWidth={1.5} />
        <p className="text-lg">Pratinjau kamera</p>
      </div>

      {overlay}

      {/* Kilatan putih saat foto diambil */}
      {status === "memotret" && (
        <div className="animate-out fade-out pointer-events-none absolute inset-0 z-20 bg-white fill-mode-forwards duration-500" />
      )}

      {showHint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-6">
          <p className="rounded-full bg-black/60 px-6 py-3 text-xl font-medium text-white backdrop-blur">
            {STATUS_HINT[status]}
          </p>
        </div>
      )}
    </div>
  );
}
