"use client";

import { useSyncExternalStore } from "react";

import {
  DEFAULT_PRINT_SETTINGS,
  PAPER_SIZES,
  type PrintSettings,
} from "./print-layout";

// Pengaturan cetak disimpan per perangkat (iPad kiosk) di localStorage,
// karena printer & kertas melekat pada lokasi/perangkat, bukan pelanggan.

const KEY = "photobooth:pengaturan-cetak";
const listeners = new Set<() => void>();
let cached: PrintSettings | null = null;

function sanitize(value: unknown): PrintSettings {
  const v = (value ?? {}) as Partial<PrintSettings>;
  return {
    printerEnabled:
      typeof v.printerEnabled === "boolean"
        ? v.printerEnabled
        : DEFAULT_PRINT_SETTINGS.printerEnabled,
    paperSize:
      v.paperSize && v.paperSize in PAPER_SIZES
        ? v.paperSize
        : DEFAULT_PRINT_SETTINGS.paperSize,
    orientation:
      v.orientation === "lanskap" || v.orientation === "potret"
        ? v.orientation
        : DEFAULT_PRINT_SETTINGS.orientation,
    stripsPerSheet:
      v.stripsPerSheet === 1 || v.stripsPerSheet === 2 || v.stripsPerSheet === 4
        ? v.stripsPerSheet
        : DEFAULT_PRINT_SETTINGS.stripsPerSheet,
  };
}

function read(): PrintSettings {
  if (cached) return cached;
  try {
    cached = sanitize(JSON.parse(localStorage.getItem(KEY) ?? "null"));
  } catch {
    cached = DEFAULT_PRINT_SETTINGS;
  }
  return cached;
}

export function savePrintSettings(patch: Partial<PrintSettings>) {
  cached = sanitize({ ...read(), ...patch });
  try {
    localStorage.setItem(KEY, JSON.stringify(cached));
  } catch {
    /* penyimpanan diblokir — tetap berlaku selama halaman terbuka */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cached = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Pengaturan cetak perangkat ini (bawaan saat render di server). */
export function usePrintSettings(): PrintSettings {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_PRINT_SETTINGS);
}
