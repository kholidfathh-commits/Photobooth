import { Camera, Download, ScanLine } from "lucide-react";

const STEPS = [
  { icon: Camera, text: "Buka aplikasi Kamera di HP-mu" },
  { icon: ScanLine, text: "Arahkan kamera ke QR Code di layar ini" },
  { icon: Download, text: "Ketuk tautan yang muncul, lalu unduh fotonya" },
];

/** Petunjuk tiga langkah memindai QR Code dengan kamera HP. */
export function ScanGuide() {
  return (
    <ol className="space-y-3" aria-label="Cara mengunduh foto">
      {STEPS.map(({ icon: Icon, text }, i) => (
        <li key={text} className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
            {i + 1}
          </span>
          <Icon className="size-5 shrink-0 text-neutral-400" aria-hidden />
          <span className="text-base text-neutral-200">{text}</span>
        </li>
      ))}
    </ol>
  );
}
