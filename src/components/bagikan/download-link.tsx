"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { displayUrl, downloadUrl } from "@/lib/links";
import type { UploadResult } from "@/lib/upload";

/**
 * Tautan unduhan photostrip yang sudah tersimpan: alamat pendek yang bisa
 * diketik pelanggan, tombol salin, dan tombol buka (untuk operator).
 */
export function DownloadLink({ upload }: { upload: UploadResult }) {
  const url = downloadUrl(upload.qrToken);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard tidak diizinkan — tautan tetap terlihat */
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-neutral-400">Tautan unduhan</p>
      <div className="flex items-center gap-2 rounded-xl bg-white/5 py-1.5 pr-1.5 pl-4">
        <span className="min-w-0 flex-1 truncate font-mono text-base text-white select-all">
          {displayUrl(url)}
        </span>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={copied ? "Tautan tersalin" : "Salin tautan"}
          onClick={copy}
          className="size-11 shrink-0 rounded-lg text-white hover:bg-white/10 hover:text-white"
        >
          {copied ? (
            <Check className="size-5 text-emerald-400" />
          ) : (
            <Copy className="size-5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Buka halaman unduhan"
          className="size-11 shrink-0 rounded-lg text-white hover:bg-white/10 hover:text-white"
          render={<a href={url} target="_blank" rel="noopener noreferrer" />}
          nativeButton={false}
        >
          <ExternalLink className="size-5" />
        </Button>
      </div>
      <p className="truncate text-xs text-neutral-500">
        File: {upload.fileName}
      </p>
    </div>
  );
}
