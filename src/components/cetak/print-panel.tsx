"use client";

import { useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  Printer,
  RotateCcw,
  Settings2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PAPER_SIZES, type PrintSettings } from "@/lib/print-layout";
import { usePrintSettings } from "@/lib/print-settings-store";
import { cn } from "@/lib/utils";

import { PrintLayoutPreview } from "./print-layout-preview";
import { PrintSettingsDialog } from "./print-settings-dialog";

function printSummary(s: PrintSettings) {
  return `Susunan cetak: ${s.stripsPerSheet} strip per lembar ${PAPER_SIZES[s.paperSize].label}, ${s.orientation}`;
}

/**
 * Status cetak:
 * - siap: tombol "Cetak Sekarang"
 * - membuka: dialog cetak AirPrint sedang dibuka
 * - konfirmasi: dialog ditutup — browser tidak tahu hasilnya, jadi tanya
 *   apakah foto sudah keluar dari printer
 * - berhasil / gagal: hasil akhir (gagal → petunjuk + coba lagi)
 */
export type PrintStatus =
  "siap" | "membuka" | "konfirmasi" | "berhasil" | "gagal";

const FAIL_TIPS = [
  "Pastikan printer menyala dan berada di Wi-Fi yang sama dengan iPad.",
  "Cek kertas & tinta, lalu coba cetak lagi.",
  "Fotomu tetap bisa diunduh lewat QR Code.",
];

interface PrintPanelProps {
  className?: string;
  /** Data pratinjau susunan cetak (opsional). */
  preview?: {
    imageUrl: string;
    stripWidth: number;
    stripHeight: number;
  };
  /** Dikabari setiap status berubah (mis. untuk mencatat print job). */
  onStatusChange?: (status: PrintStatus) => void;
}

/** Tombol cetak + alur status berhasil/gagal setelah dialog cetak ditutup. */
export function PrintPanel({
  className,
  preview,
  onStatusChange,
}: PrintPanelProps) {
  const [status, setStatusState] = useState<PrintStatus>("siap");
  const [failReason, setFailReason] = useState<string | null>(null);
  const [copies, setCopies] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settings = usePrintSettings();

  const setStatus = (next: PrintStatus) => {
    setStatusState(next);
    onStatusChange?.(next);
  };

  const print = () => {
    if (typeof window.print !== "function") {
      setFailReason("Perangkat ini tidak mendukung pencetakan dari browser.");
      setStatus("gagal");
      return;
    }
    setFailReason(null);
    setStatus("membuka");
    // Jeda singkat agar status tampil; window.print() menahan halaman sampai
    // dialog ditutup, setelah itu tanyakan hasilnya.
    setTimeout(() => {
      try {
        window.print();
        setStatus("konfirmasi");
      } catch {
        setFailReason("Dialog cetak tidak bisa dibuka.");
        setStatus("gagal");
      }
    }, 50);
  };

  return (
    <div
      className={cn("flex w-full flex-col gap-3", className)}
      aria-live="polite"
    >
      {preview && (status === "siap" || status === "membuka") && (
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Atur ukuran kertas dan orientasi cetak"
          className="flex items-center gap-3 rounded-2xl bg-white/5 p-2 pr-3 text-left transition-colors hover:bg-white/10"
        >
          <PrintLayoutPreview
            settings={settings}
            imageUrl={preview.imageUrl}
            stripWidth={preview.stripWidth}
            stripHeight={preview.stripHeight}
            showCaption={false}
            className="w-14 shrink-0"
          />
          <p className="min-w-0 flex-1 text-xs leading-snug text-neutral-400">
            {printSummary(settings)}
          </p>
          <Settings2 className="size-5 shrink-0 text-neutral-400" />
        </button>
      )}

      {settingsOpen && preview && (
        <PrintSettingsDialog
          imageUrl={preview.imageUrl}
          stripWidth={preview.stripWidth}
          stripHeight={preview.stripHeight}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {(status === "siap" || status === "membuka") && (
        <Button
          size="lg"
          onClick={print}
          disabled={status === "membuka"}
          className="h-14 rounded-2xl bg-sky-500 text-lg font-semibold text-white hover:bg-sky-500/90"
        >
          <Printer className="size-5" />
          {status === "membuka" ? "Membuka printer…" : "Cetak Sekarang"}
        </Button>
      )}

      {status === "konfirmasi" && (
        <div className="space-y-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="text-center font-semibold">
            Foto sudah keluar dari printer?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="lg"
              onClick={() => {
                setCopies((c) => c + 1);
                setStatus("berhasil");
              }}
              className="h-12 rounded-xl bg-emerald-500 text-base font-semibold text-white hover:bg-emerald-500/90"
            >
              <ThumbsUp className="size-5" />
              Sudah
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                setFailReason("Foto belum tercetak.");
                setStatus("gagal");
              }}
              className="h-12 rounded-xl bg-white/10 text-base font-semibold text-white hover:bg-white/15 hover:text-white"
            >
              <ThumbsDown className="size-5" />
              Belum
            </Button>
          </div>
        </div>
      )}

      {status === "berhasil" && (
        <div
          role="status"
          className="space-y-3 rounded-2xl bg-emerald-500/15 p-4 ring-1 ring-emerald-400/30"
        >
          <p className="flex items-center gap-2 font-semibold text-emerald-200">
            <CircleCheck className="size-5" />
            Tercetak! Ambil fotomu di printer.
          </p>
          <Button
            variant="ghost"
            size="lg"
            onClick={print}
            className="h-11 w-full rounded-xl text-sm text-emerald-100 hover:bg-white/10 hover:text-white"
          >
            <Printer className="size-4" />
            Cetak lagi ({copies} sudah dicetak)
          </Button>
        </div>
      )}

      {status === "gagal" && (
        <div
          role="alert"
          className="space-y-3 rounded-2xl bg-red-500/15 p-4 ring-1 ring-red-400/30"
        >
          <p className="flex items-center gap-2 font-semibold text-red-200">
            <CircleAlert className="size-5" />
            Gagal mencetak
          </p>
          {failReason && (
            <p className="text-sm text-red-100/90">{failReason}</p>
          )}
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-100/80">
            {FAIL_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <Button
            size="lg"
            onClick={print}
            className="h-12 w-full rounded-xl bg-white text-base font-semibold text-neutral-950 hover:bg-white/90"
          >
            <RotateCcw className="size-5" />
            Coba Cetak Lagi
          </Button>
        </div>
      )}
    </div>
  );
}
