import { Camera } from "lucide-react";

import type { DownloadInfo } from "@/lib/download";

import { PhotoPreview } from "./photo-preview";
import { SaveToGallery } from "./save-to-gallery";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Tampilan halaman unduh di HP pelanggan (potret, mobile-first):
 * photostrip, tombol unduh, dan keterangan sesi. Tanpa login.
 */
export function DownloadScreen({ info }: { info: DownloadInfo }) {
  return (
    <main className="min-h-dvh bg-neutral-950 px-4 py-8 text-white select-text">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6">
        <header className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-white text-neutral-950">
            <Camera className="size-6" />
          </span>
          <p className="text-xs font-semibold tracking-[0.3em] text-neutral-400 uppercase">
            Street Photobooth
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Fotomu sudah siap!
          </h1>
          <p className="text-neutral-400">
            Simpan ke galeri HP-mu, gratis dan tanpa login.
          </p>
        </header>

        <PhotoPreview info={info} />

        <SaveToGallery info={info} />

        <p className="text-center text-sm text-neutral-500">
          Frame {info.frameName} · {formatDate(info.createdAt)}
        </p>
      </div>
    </main>
  );
}
