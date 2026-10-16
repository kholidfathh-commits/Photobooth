"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Printer, Settings2 } from "lucide-react";

import { PrintSettingsDialog } from "@/components/cetak/print-settings-dialog";
import { Button } from "@/components/ui/button";
import { PAPER_SIZES } from "@/lib/print-layout";
import {
  savePrintSettings,
  usePrintSettings,
} from "@/lib/print-settings-store";
import { cn } from "@/lib/utils";

/** Photostrip contoh untuk pratinjau pengaturan cetak. */
const SAMPLE = { url: "/mock/photostrip-contoh.svg", width: 600, height: 1376 };

/**
 * Halaman operator acara (/operator): nyalakan/matikan fitur cetak dan atur
 * kertas & susunan cetak. Pengaturan tersimpan di iPad ini.
 */
export function OperatorScreen() {
  const settings = usePrintSettings();
  const [dialogOpen, setDialogOpen] = useState(false);
  const enabled = settings.printerEnabled;

  return (
    <div className="flex min-h-dvh flex-col gap-6 bg-neutral-950 p-4 text-white md:p-6">
      <header className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="lg"
          className="h-12 px-4 text-base text-white hover:bg-white/10 hover:text-white"
          render={<Link href="/" />}
          nativeButton={false}
        >
          <ArrowLeft className="size-5" />
          Halaman Awal
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Pengaturan Operator
        </h1>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <section className="flex items-center gap-4 rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl",
              enabled
                ? "bg-sky-500/20 text-sky-300"
                : "bg-white/10 text-neutral-500",
            )}
          >
            <Printer className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold" id="label-cetak">
              Fitur cetak
            </h2>
            <p className="text-sm text-neutral-400">
              {enabled
                ? "Tombol “Cetak Sekarang” tampil di layar hasil."
                : "Tombol cetak disembunyikan — pelanggan hanya mengunduh lewat QR."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-labelledby="label-cetak"
            onClick={() => savePrintSettings({ printerEnabled: !enabled })}
            className={cn(
              "relative h-9 w-16 shrink-0 rounded-full transition-colors",
              enabled ? "bg-emerald-500" : "bg-white/20",
            )}
          >
            <span
              className={cn(
                "absolute top-1 left-1 size-7 rounded-full bg-white shadow transition-transform",
                enabled && "translate-x-7",
              )}
            />
            <span className="sr-only">{enabled ? "Aktif" : "Nonaktif"}</span>
          </button>
        </section>

        <section
          className={cn(
            "flex items-center gap-4 rounded-3xl bg-white/5 p-6 ring-1 ring-white/10",
            !enabled && "opacity-50",
          )}
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <Settings2 className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">Kertas & susunan</h2>
            <p className="text-sm text-neutral-400">
              {PAPER_SIZES[settings.paperSize].label} · {settings.orientation} ·{" "}
              {settings.stripsPerSheet} strip per lembar
            </p>
          </div>
          <Button
            size="lg"
            disabled={!enabled}
            onClick={() => setDialogOpen(true)}
            className="h-12 rounded-xl bg-white px-5 text-base font-semibold text-neutral-950 hover:bg-white/90"
          >
            Atur
          </Button>
        </section>
      </main>

      {dialogOpen && (
        <PrintSettingsDialog
          imageUrl={SAMPLE.url}
          stripWidth={SAMPLE.width}
          stripHeight={SAMPLE.height}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}
