import Link from "next/link";
import { Camera, Settings } from "lucide-react";

import { HomeReset } from "@/components/sesi/home-reset";
import { Button } from "@/components/ui/button";

/** Halaman awal (layar idle) — pelanggan menekan tombol besar untuk mulai. */
export default function Home() {
  return (
    <main className="relative flex h-dvh flex-col items-center justify-center gap-10 bg-neutral-950 p-6 text-center text-white">
      <div className="space-y-3">
        <p className="text-sm font-semibold tracking-[0.3em] text-neutral-400 uppercase">
          Street Photobooth
        </p>
        <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
          Yuk, foto bareng!
        </h1>
        <p className="text-xl text-neutral-400">
          Gratis, tanpa login — ambil hasilnya lewat QR Code.
        </p>
      </div>
      <Button
        size="lg"
        className="h-20 rounded-full bg-white px-12 text-2xl font-semibold text-neutral-950 hover:bg-white/90"
        render={<Link href="/frame" />}
        nativeButton={false}
      >
        <Camera className="size-7" />
        Mulai Foto
      </Button>

      <HomeReset />

      {/* Pintu masuk operator (kecil & samar agar tidak ditekan pelanggan). */}
      <Link
        href="/operator"
        aria-label="Pengaturan operator"
        className="absolute right-4 bottom-4 flex size-11 items-center justify-center rounded-full text-neutral-700 transition-colors hover:text-neutral-400"
      >
        <Settings className="size-5" />
      </Link>
    </main>
  );
}
