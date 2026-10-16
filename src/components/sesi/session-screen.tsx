"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createMockCamera } from "@/lib/camera";
import { useFrame } from "@/components/frame/frames-provider";

import { Countdown } from "./countdown";
import { PhotostripSlots } from "./photostrip-slots";
import { usePhotoSession } from "./session-provider";
import { ShotGallery } from "./shot-gallery";
import { ShotIndicator } from "./shot-indicator";
import { Viewfinder } from "./viewfinder";

/** Lama kilatan putih setelah jepret sebelum lanjut ke foto berikutnya (ms). */
const FLASH_MS = 500;

/**
 * Layar utama sesi foto (lanskap iPad): kamera di kiri, photostrip di kanan.
 * Sekali tekan "Mulai Foto", semua slot diisi otomatis berurutan:
 * hitung mundur → jepret → kilatan → hitung mundur berikutnya … → tinjau.
 * Di tahap tinjau, pelanggan bisa mengulang satu foto (foto pengganti
 * menimpa slot yang sama) atau mengulang semuanya dari awal.
 */
export function SessionScreen() {
  const router = useRouter();
  const { session, setSession } = usePhotoSession();
  const [camera] = useState(createMockCamera);
  /** Slot yang sedang diulang; null = pengambilan berurutan biasa. */
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);
  /** Foto yang sedang dilihat besar di galeri tinjau. */
  const [reviewIndex, setReviewIndex] = useState(0);
  const frame = useFrame(session.frameId);
  const taken = session.shots.length;
  const busy =
    session.status === "hitung-mundur" || session.status === "memotret";

  const startCountdown = () =>
    setSession((s) => ({ ...s, status: "hitung-mundur" }));

  const retakeShot = (orderIndex: number) => {
    setRetakeIndex(orderIndex);
    setReviewIndex(orderIndex);
    setSession((s) => ({ ...s, status: "hitung-mundur" }));
  };

  const retakeAll = () => {
    setRetakeIndex(null);
    setReviewIndex(0);
    setSession((s) => ({ ...s, shots: [], status: "hitung-mundur" }));
  };

  const handleCountdownDone = useCallback(
    () => setSession((s) => ({ ...s, status: "memotret" })),
    [setSession],
  );

  // Saat "memotret": ambil gambar dari kamera, tunggu kilatan selesai, lalu
  // simpan jepretan. Foto baru → lanjut otomatis ke slot berikutnya atau
  // tinjau; foto pengganti → timpa slotnya lalu kembali ke tinjau.
  useEffect(() => {
    if (session.status !== "memotret") return;
    let cancelled = false;
    const orderIndex = retakeIndex ?? taken;
    const capturing = camera.capture(`Foto ${orderIndex + 1}`);

    const t = setTimeout(async () => {
      const src = await capturing;
      if (cancelled) return;
      const takenAt = new Date().toISOString();
      const shot = {
        id: `${session.id}-foto-${orderIndex + 1}-${Date.now()}`,
        orderIndex,
        src,
        takenAt,
      };

      if (retakeIndex !== null) {
        setRetakeIndex(null);
        setSession((s) => ({
          ...s,
          shots: s.shots.map((x) => (x.orderIndex === orderIndex ? shot : x)),
          status: "tinjau",
        }));
        return;
      }

      setSession((s) => {
        const shots = [...s.shots, shot];
        return {
          ...s,
          shots,
          status: shots.length >= frame.slotCount ? "tinjau" : "hitung-mundur",
        };
      });
    }, FLASH_MS);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    session.status,
    session.id,
    taken,
    retakeIndex,
    camera,
    frame.slotCount,
    setSession,
  ]);

  const isFirstShot = taken === 0;
  const isRetake = retakeIndex !== null;
  const countdownKey = isRetake ? `ulang-${retakeIndex}` : `foto-${taken + 1}`;
  const countdownProps = isRetake
    ? {
        prepareLabel: `Ulangi Foto ${retakeIndex + 1}`,
        prepareHint: "Siap-siap lagi, ya!",
        prepareDuration: 1500,
      }
    : isFirstShot
      ? { prepareLabel: "Bersiap…", prepareDuration: 1500 }
      : {
          prepareLabel: `Foto ${taken + 1} dari ${frame.slotCount}`,
          prepareHint: "Ganti gaya, yuk!",
          prepareDuration: 1200,
        };

  return (
    <div className="flex h-dvh flex-col gap-4 bg-neutral-950 p-4 text-white md:p-6">
      <header className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="lg"
          className="h-12 px-4 text-base text-white hover:bg-white/10 hover:text-white"
          render={<Link href="/frame" />}
          nativeButton={false}
          disabled={busy}
        >
          <ArrowLeft className="size-5" />
          Ganti Frame
        </Button>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-neutral-300">
            Frame:{" "}
            <span className="font-semibold text-white">{frame.name}</span>
          </span>
          <ShotIndicator taken={taken} total={frame.slotCount} />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row md:gap-6">
        <section className="flex min-h-0 flex-1 items-center justify-center">
          {session.status === "tinjau" ? (
            <ShotGallery
              shots={session.shots}
              selectedIndex={reviewIndex}
              onSelect={setReviewIndex}
              onRetake={retakeShot}
            />
          ) : (
            <Viewfinder
              status={session.status}
              overlay={
                session.status === "hitung-mundur" && (
                  <Countdown
                    {...countdownProps}
                    key={countdownKey}
                    onComplete={handleCountdownDone}
                  />
                )
              }
            />
          )}
        </section>

        <aside className="flex w-full shrink-0 flex-col gap-4 md:w-56">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PhotostripSlots
              frame={frame}
              shots={session.shots}
              activeIndex={
                isRetake
                  ? retakeIndex
                  : session.status === "tinjau"
                    ? -1
                    : taken
              }
            />
          </div>
          {session.status === "tinjau" ? (
            <>
              <Button
                size="lg"
                variant="ghost"
                onClick={retakeAll}
                className="h-12 w-full rounded-2xl text-base text-neutral-300 hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="size-5" />
                Ulangi Semua
              </Button>
              <Button
                size="lg"
                onClick={() => router.push("/hasil")}
                className="h-16 w-full rounded-2xl bg-emerald-500 text-xl font-semibold text-white hover:bg-emerald-500/90"
              >
                Lanjut
                <ArrowRight className="size-6" />
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              onClick={startCountdown}
              disabled={busy}
              className="h-16 w-full rounded-2xl bg-white text-xl font-semibold text-neutral-950 hover:bg-white/90"
            >
              <Camera className="size-6" />
              {busy ? "Memotret…" : "Mulai Foto"}
            </Button>
          )}
        </aside>
      </main>
    </div>
  );
}
