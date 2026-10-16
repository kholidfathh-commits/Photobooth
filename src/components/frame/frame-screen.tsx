"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { usePhotoSession } from "@/components/sesi/session-provider";
import { Button } from "@/components/ui/button";
import { findFrame, MOCK_FRAMES } from "@/lib/mock-data";
import { newSession } from "@/lib/session";
import type { SlotCount } from "@/lib/types";

import { FrameCarousel } from "./frame-carousel";
import { FramePreview } from "./frame-preview";
import { SlotIllustration } from "./slot-illustration";
import { SlotCountToggle } from "./slot-count-toggle";

/**
 * Halaman Pilih Frame: pilih jumlah foto (2/3), geser galeri, ketuk frame,
 * lihat pratinjau besar berisi foto contoh, lalu mulai sesi foto.
 */
export function FrameScreen() {
  const router = useRouter();
  const { session, setSession } = usePhotoSession();
  const activeFrames = MOCK_FRAMES.filter((f) => f.isActive);
  const [selectedId, setSelectedId] = useState(
    activeFrames.some((f) => f.id === session.frameId)
      ? session.frameId
      : activeFrames[0]?.id,
  );
  const selected = findFrame(selectedId);
  const [slotCount, setSlotCount] = useState<SlotCount>(selected.slotCount);
  const frames = activeFrames.filter((f) => f.slotCount === slotCount);

  // Ganti jumlah foto → frame terpilih pindah ke frame pertama yang cocok.
  const changeSlotCount = (count: SlotCount) => {
    setSlotCount(count);
    if (selected.slotCount !== count) {
      const first = activeFrames.find((f) => f.slotCount === count);
      if (first) setSelectedId(first.id);
    }
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const closePreview = useCallback(() => setPreviewOpen(false), []);

  const chooseFrame = () => {
    setSession(newSession(selected.id));
    router.push("/sesi");
  };

  return (
    <div className="flex h-dvh flex-col gap-4 bg-neutral-950 p-4 text-white md:p-6">
      <header className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="lg"
          className="h-12 px-4 text-base text-white hover:bg-white/10 hover:text-white"
          render={<Link href="/" />}
          nativeButton={false}
        >
          <ArrowLeft className="size-5" />
          Kembali
        </Button>
        <SlotCountToggle value={slotCount} onChange={changeSlotCount} />
        <div className="text-right">
          <h1 className="text-2xl font-bold tracking-tight">Pilih Frame</h1>
          <p className="text-sm text-neutral-400">
            Geser untuk melihat semua desain
          </p>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 items-center">
        {frames.length > 0 ? (
          <FrameCarousel
            key={slotCount}
            frames={frames}
            selectedId={selected.id}
            onSelect={setSelectedId}
          />
        ) : (
          <p className="w-full text-center text-xl text-neutral-400">
            Belum ada frame untuk {slotCount} foto.
          </p>
        )}
      </main>

      <footer className="flex items-center justify-between gap-4">
        <SlotIllustration frame={selected} />
        <Button
          size="lg"
          onClick={() => setPreviewOpen(true)}
          disabled={selected.slotCount !== slotCount}
          className="h-16 rounded-2xl bg-white px-8 text-xl font-semibold text-neutral-950 hover:bg-white/90"
        >
          Pakai Frame Ini
          <ArrowRight className="size-6" />
        </Button>
      </footer>

      {previewOpen && (
        <FramePreview
          frame={selected}
          onClose={closePreview}
          onStart={chooseFrame}
        />
      )}
    </div>
  );
}
