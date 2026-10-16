"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ScanLine } from "lucide-react";

import { cn } from "@/lib/utils";

interface QrCodeDisplayProps {
  /** Alamat yang dikodekan (halaman unduh). */
  value: string;
  className?: string;
}

/**
 * QR Code besar berlatar putih untuk dipindai kamera HP pelanggan dari layar
 * iPad. Dibuat sebagai SVG (tajam di layar Retina, ringan).
 */
export function QrCodeDisplay({ value, className }: QrCodeDisplayProps) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 2,
      color: { dark: "#0a0a0a", light: "#ffffff" },
    })
      .then((s) => {
        if (!cancelled) setSvg(s);
      })
      .catch(() => {
        if (!cancelled) setSvg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <figure className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative w-full p-3">
        {/* Bingkai sudut ala pemindai, menarik perhatian ke QR */}
        {[
          "top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl",
          "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl",
          "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
          "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
        ].map((corner) => (
          <span
            key={corner}
            aria-hidden
            className={cn("absolute size-10 border-emerald-400", corner)}
          />
        ))}
        <div
          className="aspect-square w-full overflow-hidden rounded-xl bg-white p-2 shadow-xl [&>svg]:size-full"
          role="img"
          aria-label="QR Code untuk mengunduh foto"
          // SVG dihasilkan library qrcode dari alamat kita sendiri (bukan input pengguna).
          dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
        />
      </div>
      <figcaption className="flex items-center gap-2 text-base font-semibold text-white">
        <ScanLine className="size-5" />
        Pindai untuk unduh fotomu
      </figcaption>
    </figure>
  );
}
