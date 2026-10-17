"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Frame } from "@/lib/types";

import { FrameCard } from "./frame-card";

interface FrameCarouselProps {
  frames: Frame[];
  selectedId: string;
  onSelect: (frameId: string) => void;
}

/** Jeda setelah geseran berhenti sebelum kartu di tengah dianggap terpilih (ms). */
const SETTLE_MS = 120;

/**
 * Galeri frame yang bisa digeser (scroll-snap, nyaman untuk sentuhan iPad).
 * Cara memilih frame:
 * - geser (swipe) — kartu yang berhenti di tengah otomatis terpilih,
 * - ketuk kartu — kartu terpilih lalu digeser ke tengah,
 * - tombol panah / tombol ← → keyboard — pindah satu frame.
 */
export function FrameCarousel({
  frames,
  selectedId,
  onSelect,
}: FrameCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const latest = useRef({ frames, onSelect });
  /** true selama geseran dipicu kode (ketuk/panah), bukan swipe pengguna. */
  const programmatic = useRef(false);
  useEffect(() => {
    latest.current = { frames, onSelect };
  });

  const selectedIndex = Math.max(
    0,
    frames.findIndex((f) => f.id === selectedId),
  );

  const cards = () =>
    Array.from(
      trackRef.current?.querySelectorAll<HTMLElement>("[data-frame-card]") ??
        [],
    );

  const selectIndex = (index: number, behavior: ScrollBehavior = "smooth") => {
    const frame = frames[index];
    if (!frame) return;
    onSelect(frame.id);
    programmatic.current = behavior === "smooth";
    // Cadangan bila kartu sudah di tengah (tidak ada event scroll sama sekali).
    setTimeout(() => (programmatic.current = false), 800);
    cards()[index]?.scrollIntoView({
      behavior,
      inline: "center",
      block: "nearest",
    });
  };

  // Tampilkan frame terpilih di tengah saat halaman dibuka.
  useEffect(() => {
    cards()[selectedIndex]?.scrollIntoView({
      behavior: "instant",
      inline: "center",
      block: "nearest",
    });
    // Hanya saat mount; pergeseran berikutnya ditangani interaksi pengguna.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setelah geseran berhenti, pilih kartu yang paling dekat ke tengah.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let timer: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // Geseran hasil ketuk/panah: pilihan sudah ditetapkan, jangan ditimpa.
        if (programmatic.current) {
          programmatic.current = false;
          return;
        }
        const box = track.getBoundingClientRect();
        const mid = box.left + box.width / 2;
        let best = -1;
        let bestDistance = Infinity;
        cards().forEach((card, i) => {
          const r = card.getBoundingClientRect();
          const distance = Math.abs(r.left + r.width / 2 - mid);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = i;
          }
        });
        const frame = latest.current.frames[best];
        if (frame) latest.current.onSelect(frame.id);
      }, SETTLE_MS);
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      selectIndex(Math.min(selectedIndex + 1, frames.length - 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      selectIndex(Math.max(selectedIndex - 1, 0));
    }
  };

  const atStart = selectedIndex === 0;
  const atEnd = selectedIndex === frames.length - 1;

  return (
    <div className="relative flex min-h-0 w-full items-center">
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label="Frame sebelumnya"
        onClick={() => selectIndex(selectedIndex - 1)}
        disabled={atStart}
        className="absolute left-0 z-10 disabled:opacity-0 size-14 rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70 hover:text-white"
      >
        <ChevronLeft className="size-8" />
      </Button>

      <div
        ref={trackRef}
        role="radiogroup"
        aria-label="Pilihan frame"
        onKeyDown={onKeyDown}
        className="flex min-h-0 w-full snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-[calc(50%-6.5rem)] py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {frames.map((frame, i) => (
          <FrameCard
            key={frame.id}
            frame={frame}
            selected={i === selectedIndex}
            onSelect={() => selectIndex(i)}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon-lg"
        aria-label="Frame berikutnya"
        onClick={() => selectIndex(selectedIndex + 1)}
        disabled={atEnd}
        className="absolute right-0 z-10 disabled:opacity-0 size-14 rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70 hover:text-white"
      >
        <ChevronRight className="size-8" />
      </Button>
    </div>
  );
}
