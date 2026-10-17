"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { usePhotoSession } from "@/components/sesi/session-provider";
import { Button } from "@/components/ui/button";
import { findTheme, KATEGORI_URUT } from "@/lib/frames/themes";
import { newSession } from "@/lib/session";
import type { Frame, SlotCount } from "@/lib/types";

import { CategoryChips, type KategoriPilihan } from "./category-chips";

import { FrameCarousel } from "./frame-carousel";
import { useFrames } from "./frames-provider";
import { FramePreview } from "./frame-preview";
import { SlotIllustration } from "./slot-illustration";
import { SlotCountToggle } from "./slot-count-toggle";

const kategoriOf = (frame: Frame) => findTheme(frame.id)?.kategori;

/**
 * Halaman Pilih Frame: pilih jumlah foto (2/3) dan kategori, geser galeri,
 * ketuk frame, lihat pratinjau besar berisi foto contoh, lalu mulai sesi.
 */
export function FrameScreen() {
  const router = useRouter();
  const { session, setSession } = usePhotoSession();
  const { frames: allFrames, getFrame } = useFrames();
  const activeFrames = allFrames.filter((f) => f.isActive);
  const [selectedId, setSelectedId] = useState(
    activeFrames.some((f) => f.id === session.frameId)
      ? session.frameId
      : activeFrames[0]?.id,
  );
  const selected = getFrame(selectedId);
  const [slotCount, setSlotCount] = useState<SlotCount>(selected.slotCount);
  const [kategori, setKategori] = useState<KategoriPilihan>("Semua");

  const bySlot = (count: SlotCount) =>
    activeFrames.filter((f) => f.slotCount === count);
  const byKategori = (list: Frame[], k: KategoriPilihan) =>
    k === "Semua" ? list : list.filter((f) => kategoriOf(f) === k);

  const sameSlot = bySlot(slotCount);
  const frames = byKategori(sameSlot, kategori);
  const kategoriOptions = [
    { kategori: "Semua" as const, count: sameSlot.length },
    ...KATEGORI_URUT.map((k) => ({
      kategori: k,
      count: byKategori(sameSlot, k).length,
    })).filter((o) => o.count > 0),
  ];

  // Frame terpilih tidak ada di daftar baru → pilih frame pertamanya.
  const keepSelection = (list: Frame[]) => {
    if (!list.some((f) => f.id === selected.id) && list[0])
      setSelectedId(list[0].id);
  };

  const changeSlotCount = (count: SlotCount) => {
    setSlotCount(count);
    let k = kategori;
    if (byKategori(bySlot(count), k).length === 0) {
      k = "Semua";
      setKategori(k);
    }
    keepSelection(byKategori(bySlot(count), k));
  };

  const changeKategori = (k: KategoriPilihan) => {
    setKategori(k);
    keepSelection(byKategori(sameSlot, k));
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

      <CategoryChips
        options={kategoriOptions}
        value={kategori}
        onChange={changeKategori}
      />

      <main className="flex min-h-0 flex-1 items-center">
        {frames.length > 0 ? (
          <FrameCarousel
            key={`${slotCount}-${kategori}`}
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
