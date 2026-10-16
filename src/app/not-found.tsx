import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Halaman 404 umum aplikasi. */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-neutral-950 px-6 text-center text-white">
      <p className="text-6xl font-black text-neutral-700">404</p>
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <p className="max-w-xs text-neutral-400">
        Alamat yang kamu buka tidak ada.
      </p>
      <Button
        size="lg"
        className="h-12 rounded-full bg-white px-6 text-base font-semibold text-neutral-950 hover:bg-white/90"
        render={<Link href="/" />}
        nativeButton={false}
      >
        Ke halaman awal
      </Button>
    </main>
  );
}
