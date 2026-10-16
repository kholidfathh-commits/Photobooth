"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, CircleCheck, Download, Loader2, Share } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DownloadInfo } from "@/lib/download";

type Platform = "ios" | "android" | "lainnya";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const iPadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/Android/.test(ua)) return "android";
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) return "ios";
  return "lainnya";
}

let shareFilesSupport: boolean | undefined;
function detectCanShareFiles(): boolean {
  if (shareFilesSupport === undefined) {
    try {
      const probe = new File([""], "x.jpg", { type: "image/jpeg" });
      shareFilesSupport = Boolean(navigator.canShare?.({ files: [probe] }));
    } catch {
      shareFilesSupport = false;
    }
  }
  return shareFilesSupport;
}

// Nilai khusus browser dibaca lewat useSyncExternalStore: di server memakai
// nilai aman ("lainnya"/false), di browser langsung nilai sebenarnya.
const noSubscribe = () => () => {};

const GUIDE: Record<Platform, string[]> = {
  ios: [
    "Tekan Simpan ke Galeri.",
    "Pilih “Simpan Gambar” di menu yang muncul.",
    "Fotomu ada di aplikasi Foto.",
  ],
  android: [
    "Tekan Simpan ke Galeri.",
    "Bila muncul menu, pilih “Simpan” atau “Galeri”.",
    "Fotomu ada di Galeri / folder Download.",
  ],
  lainnya: [
    "Tekan Unduh Foto.",
    "File tersimpan di folder Download perangkatmu.",
  ],
};

/**
 * Tombol simpan foto + petunjuk sesuai HP. Di iPhone/Android memakai menu
 * bagikan bawaan (Web Share) agar foto bisa langsung masuk galeri; bila tidak
 * didukung, jatuh ke unduhan file biasa.
 */
export function SaveToGallery({ info }: { info: DownloadInfo }) {
  const platform = useSyncExternalStore<Platform>(
    noSubscribe,
    detectPlatform,
    () => "lainnya",
  );
  const canShareFiles = useSyncExternalStore(
    noSubscribe,
    detectCanShareFiles,
    () => false,
  );
  const [busy, setBusy] = useState(false);
  /** Cara foto terakhir disimpan; null = belum disimpan. */
  const [savedVia, setSavedVia] = useState<"bagikan" | "unduh" | null>(null);
  const saved = savedVia !== null;

  // Berkas dari API: tambahkan ?unduh=1 agar dikirim sebagai lampiran & dihitung.
  const fileUrl = info.imageUrl.startsWith("/api/")
    ? `${info.imageUrl}?unduh=1`
    : info.imageUrl;

  const downloadFile = () => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = info.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setSavedVia("unduh");
  };

  const save = async () => {
    if (!canShareFiles) {
      downloadFile();
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      const file = new File([blob], info.fileName, { type: blob.type });
      await navigator.share({ files: [file], title: "Foto Street Photobooth" });
      setSavedVia("bagikan");
    } catch (err) {
      // Dibatalkan pelanggan → diam saja; error lain → unduh file biasa.
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        downloadFile();
      }
    } finally {
      setBusy(false);
    }
  };

  const steps = GUIDE[canShareFiles ? platform : "lainnya"];

  return (
    <div className="flex w-full flex-col gap-4">
      <Button
        size="lg"
        onClick={save}
        disabled={busy}
        className="h-14 w-full rounded-2xl bg-white text-lg font-semibold text-neutral-950 hover:bg-white/90"
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin" />
        ) : saved ? (
          <Check className="size-5" />
        ) : canShareFiles ? (
          <Share className="size-5" />
        ) : (
          <Download className="size-5" />
        )}
        {saved
          ? "Tersimpan — simpan lagi?"
          : canShareFiles
            ? "Simpan ke Galeri"
            : "Unduh Foto"}
      </Button>

      {saved && (
        <div
          role="status"
          className="animate-in fade-in slide-in-from-bottom-2 flex items-start gap-3 rounded-2xl bg-emerald-500/15 p-4 ring-1 ring-emerald-400/30 duration-300"
        >
          <CircleCheck className="size-7 shrink-0 text-emerald-400" />
          <div>
            <p className="font-semibold text-emerald-200">
              Foto berhasil disimpan!
            </p>
            <p className="text-sm text-emerald-100/80">
              {savedVia === "bagikan"
                ? "Cek aplikasi Foto / Galeri di HP-mu."
                : platform === "ios"
                  ? "Cek di aplikasi File → Unduhan, atau tekan lama foto untuk menyimpannya ke Foto."
                  : "Cek di Galeri atau folder Download HP-mu."}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white/5 p-4">
        <p className="mb-2 text-sm font-semibold text-neutral-300">
          Cara menyimpan
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-neutral-400">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        {platform === "ios" && (
          <p className="mt-3 text-xs text-neutral-500">
            Tips: bisa juga tekan lama foto di atas, lalu pilih “Tambahkan ke
            Foto”.
          </p>
        )}
      </div>
    </div>
  );
}
