import type { ReactNode, Ref } from "react";
import { Camera, CameraOff, Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SessionStatus } from "@/lib/types";

import type { CameraStatus } from "./use-camera";

const STATUS_HINT: Record<SessionStatus, string> = {
  siap: "Lihat ke kamera, lalu tekan Mulai Foto",
  "hitung-mundur": "Bersiap…",
  memotret: "Senyum!",
  tinjau: "Semua foto sudah diambil",
};

const CAMERA_PROBLEM: Partial<
  Record<CameraStatus, { title: string; hint: string }>
> = {
  ditolak: {
    title: "Kamera belum diizinkan",
    hint: "Buka Pengaturan iPad → Safari → Kamera → pilih “Izinkan”, lalu tekan Coba Lagi.",
  },
  "tidak-ada": {
    title: "Kamera tidak ditemukan",
    hint: "Pastikan aplikasi dibuka di iPad lewat Safari (alamat https).",
  },
  galat: {
    title: "Kamera tidak bisa dipakai",
    hint: "Tutup aplikasi lain yang memakai kamera (FaceTime, Kamera), lalu tekan Coba Lagi.",
  },
};

interface ViewfinderProps {
  status: SessionStatus;
  cameraStatus: CameraStatus;
  videoRef: Ref<HTMLVideoElement>;
  onRetryCamera: () => void;
  /** Lapisan di atas kamera, mis. hitung mundur. */
  overlay?: ReactNode;
}

/**
 * Pratinjau kamera depan iPad (dicerminkan seperti cermin), dengan
 * hitung mundur, kilatan saat jepret, dan pesan bila kamera bermasalah.
 */
export function Viewfinder({
  status,
  cameraStatus,
  videoRef,
  onRetryCamera,
  overlay,
}: ViewfinderProps) {
  const showHint =
    (status === "siap" || status === "tinjau") &&
    (cameraStatus === "siap" || cameraStatus === "tiruan");
  const problem = CAMERA_PROBLEM[cameraStatus];

  return (
    <div className="relative flex aspect-[4/3] max-h-full w-full items-center justify-center overflow-hidden rounded-3xl bg-neutral-900 ring-1 ring-white/10">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        aria-label="Pratinjau kamera"
        className="absolute inset-0 size-full -scale-x-100 object-cover"
        hidden={cameraStatus !== "siap"}
      />

      {cameraStatus === "memulai" && (
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          <Loader2 className="size-12 animate-spin" />
          <p className="text-lg">Menyalakan kamera…</p>
        </div>
      )}

      {cameraStatus === "tiruan" && (
        <div className="flex flex-col items-center gap-3 text-neutral-500">
          <Camera className="size-16" strokeWidth={1.5} />
          <p className="text-lg">Kamera tiruan (mode demo)</p>
        </div>
      )}

      {problem && (
        <div
          role="alert"
          className="flex max-w-md flex-col items-center gap-4 p-6 text-center text-white"
        >
          <CameraOff className="size-14 text-amber-300" />
          <div className="space-y-2">
            <p className="text-2xl font-bold">{problem.title}</p>
            <p className="text-neutral-300">{problem.hint}</p>
          </div>
          <Button
            size="lg"
            onClick={onRetryCamera}
            className="h-12 rounded-full bg-white px-6 text-base font-semibold text-neutral-950 hover:bg-white/90"
          >
            <RotateCcw className="size-5" />
            Coba Lagi
          </Button>
        </div>
      )}

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
