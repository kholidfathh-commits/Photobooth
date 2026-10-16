/* eslint-disable @next/next/no-img-element -- gambar hasil canvas (blob URL), bukan aset statis */
"use client";

import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";

import { computePrintLayout } from "@/lib/print-layout";
import { usePrintSettings } from "@/lib/print-settings-store";

const noSubscribe = () => () => {};

interface PrintSheetProps {
  src: string;
  alt: string;
  stripWidth: number;
  stripHeight: number;
}

/**
 * Lembar cetak: hanya tampil saat mencetak (@media print). Photostrip
 * disusun dalam milimeter sesuai pengaturan cetak (ukuran kertas, orientasi,
 * jumlah strip per lembar), dan ukuran halaman cetak (@page) ikut diatur.
 */
export function PrintSheet({
  src,
  alt,
  stripWidth,
  stripHeight,
}: PrintSheetProps) {
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const settings = usePrintSettings();
  if (!mounted) return null;

  const { paper, placements } = computePrintLayout(
    settings,
    stripWidth,
    stripHeight,
  );
  return createPortal(
    <div className="print-area" aria-hidden>
      <style>{`@media print { @page { size: ${paper.width}mm ${paper.height}mm; margin: 0; } }`}</style>
      <div
        className="print-paper"
        style={{ width: `${paper.width}mm`, height: `${paper.height}mm` }}
      >
        {placements.map((p, i) => (
          <div
            key={i}
            className="print-slot"
            style={{
              left: `${p.x}mm`,
              top: `${p.y}mm`,
              width: `${p.width}mm`,
              height: `${p.height}mm`,
            }}
          >
            <img
              src={src}
              alt={alt}
              style={
                p.rotated
                  ? {
                      width: `${p.height}mm`,
                      height: `${p.width}mm`,
                      transform: "translate(-50%, -50%) rotate(90deg)",
                    }
                  : {
                      width: `${p.width}mm`,
                      height: `${p.height}mm`,
                      transform: "translate(-50%, -50%)",
                    }
              }
            />
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}
