import { LinkIcon, ScanLine, Wifi } from "lucide-react";

const TIPS = [
  {
    icon: ScanLine,
    text: "Pindai ulang QR Code di layar photobooth — pastikan seluruh kotak QR terlihat jelas di kamera.",
  },
  {
    icon: LinkIcon,
    text: "Bila mengetik tautan, cek lagi hurufnya. Tautan hanya berisi huruf kecil dan angka.",
  },
  {
    icon: Wifi,
    text: "Pastikan internet HP-mu menyala, lalu muat ulang halaman ini.",
  },
];

/**
 * Pesan ramah saat tautan/QR unduhan tidak valid atau fotonya tidak ditemukan,
 * lengkap dengan langkah yang bisa dicoba pelanggan.
 */
export function InvalidLink() {
  return (
    <main className="flex min-h-dvh items-center bg-neutral-950 px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
          <LinkIcon className="size-8" />
        </span>
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.3em] text-neutral-400 uppercase">
            Street Photobooth
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Tautan tidak valid
          </h1>
          <p className="text-neutral-400">
            Kami tidak menemukan foto untuk tautan ini. Kalau kamu baru saja
            berfoto, fotomu tetap tersimpan — coba langkah berikut:
          </p>
        </div>

        <ul className="w-full space-y-3 text-left">
          {TIPS.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-start gap-3 rounded-2xl bg-white/5 p-4"
            >
              <Icon className="mt-0.5 size-5 shrink-0 text-neutral-400" />
              <span className="text-sm text-neutral-200">{text}</span>
            </li>
          ))}
        </ul>

        <p className="text-sm text-neutral-500">
          Masih belum bisa? Tunjukkan halaman ini ke operator photobooth.
        </p>
      </div>
    </main>
  );
}
