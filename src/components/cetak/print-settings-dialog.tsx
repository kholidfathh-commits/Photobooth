"use client";

import { useEffect } from "react";
import { RectangleHorizontal, RectangleVertical, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PAPER_SIZES,
  type Orientation,
  type PaperSize,
  type StripsPerSheet,
} from "@/lib/print-layout";
import {
  savePrintSettings,
  usePrintSettings,
} from "@/lib/print-settings-store";
import { cn } from "@/lib/utils";

import { PrintLayoutPreview } from "./print-layout-preview";

interface PrintSettingsDialogProps {
  imageUrl: string;
  stripWidth: number;
  stripHeight: number;
  onClose: () => void;
}

const LAYOUT_OPTIONS: { value: StripsPerSheet; label: string; hint: string }[] =
  [
    { value: 1, label: "1 strip", hint: "paling besar" },
    { value: 2, label: "2 strip", hint: "potong jadi 2" },
    { value: 4, label: "4 strip", hint: "hemat kertas" },
  ];

function Option({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex min-h-14 items-center justify-center gap-2 rounded-xl px-3 py-2 text-base font-semibold transition-colors",
        active
          ? "bg-white text-neutral-950"
          : "bg-white/5 text-neutral-300 ring-1 ring-white/10 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Pengaturan cetak untuk operator: ukuran kertas, orientasi, dan susunan
 * (jumlah photostrip per lembar), dengan
 * pratinjau lembar cetak yang langsung berubah. Tersimpan di perangkat ini.
 */
export function PrintSettingsDialog({
  imageUrl,
  stripWidth,
  stripHeight,
  onClose,
}: PrintSettingsDialogProps) {
  const settings = usePrintSettings();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pengaturan cetak"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-3xl gap-8 rounded-3xl bg-neutral-900 p-6 text-white ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Pengaturan Cetak</h2>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Tutup"
              onClick={onClose}
              className="size-11 rounded-full text-white hover:bg-white/10 hover:text-white"
            >
              <X className="size-6" />
            </Button>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide text-neutral-400 uppercase">
              Ukuran kertas
            </h3>
            <div
              role="radiogroup"
              aria-label="Ukuran kertas"
              className="grid grid-cols-2 gap-2"
            >
              {(Object.keys(PAPER_SIZES) as PaperSize[]).map((size) => (
                <Option
                  key={size}
                  active={settings.paperSize === size}
                  onClick={() => savePrintSettings({ paperSize: size })}
                >
                  {PAPER_SIZES[size].label}
                </Option>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide text-neutral-400 uppercase">
              Orientasi
            </h3>
            <div
              role="radiogroup"
              aria-label="Orientasi"
              className="grid grid-cols-2 gap-2"
            >
              {(
                [
                  ["potret", "Potret", RectangleVertical],
                  ["lanskap", "Lanskap", RectangleHorizontal],
                ] as [Orientation, string, typeof RectangleVertical][]
              ).map(([value, label, Icon]) => (
                <Option
                  key={value}
                  active={settings.orientation === value}
                  onClick={() => savePrintSettings({ orientation: value })}
                >
                  <Icon className="size-5" />
                  {label}
                </Option>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide text-neutral-400 uppercase">
              Susunan per lembar
            </h3>
            <div
              role="radiogroup"
              aria-label="Susunan per lembar"
              className="grid grid-cols-3 gap-2"
            >
              {LAYOUT_OPTIONS.map(({ value, label, hint }) => (
                <Option
                  key={value}
                  active={settings.stripsPerSheet === value}
                  onClick={() => savePrintSettings({ stripsPerSheet: value })}
                >
                  <span className="flex flex-col items-center leading-tight">
                    <span className="flex gap-0.5" aria-hidden>
                      {Array.from({ length: value }, (_, i) => (
                        <span
                          key={i}
                          className="h-4 w-1.5 rounded-[2px] bg-current opacity-80"
                        />
                      ))}
                    </span>
                    <span className="mt-1">{label}</span>
                    <span className="text-xs font-normal opacity-70">
                      {hint}
                    </span>
                  </span>
                </Option>
              ))}
            </div>
          </section>

          <p className="text-sm text-neutral-500">
            Samakan dengan kertas di printer. Pengaturan tersimpan di iPad ini.
          </p>
        </div>

        <div className="flex w-56 shrink-0 items-center">
          <PrintLayoutPreview
            settings={settings}
            imageUrl={imageUrl}
            stripWidth={stripWidth}
            stripHeight={stripHeight}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
