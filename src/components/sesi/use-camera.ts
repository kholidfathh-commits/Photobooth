"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createMockCamera, type CameraSource } from "@/lib/camera";

/**
 * Status kamera:
 * - memulai: meminta izin / menyalakan kamera
 * - siap: pratinjau tampil, bisa memotret
 * - ditolak: izin kamera ditolak (perlu diizinkan di Pengaturan)
 * - tidak-ada: perangkat tidak punya kamera / browser tidak mendukung
 * - galat: kamera dipakai aplikasi lain atau mati mendadak
 * - tiruan: mode demo tanpa kamera (?kamera=tiruan)
 */
export type CameraStatus =
  "memulai" | "siap" | "ditolak" | "tidak-ada" | "galat" | "tiruan";

/** Lebar maksimum jepretan (px); rasio selalu 4:3. */
const MAX_SHOT_WIDTH = 1600;

function wantsMockCamera() {
  if (process.env.NEXT_PUBLIC_CAMERA_MODE === "tiruan") return true;
  try {
    return (
      new URLSearchParams(window.location.search).get("kamera") === "tiruan"
    );
  } catch {
    return false;
  }
}

/**
 * Kamera depan iPad (selfie) untuk sesi foto. Pratinjau & hasil jepretan
 * sama-sama dicerminkan, jadi foto terlihat persis seperti di layar.
 * Kamera dimatikan saat halaman ditinggalkan dan dinyalakan ulang bila
 * Safari mematikannya (mis. aplikasi sempat ke latar belakang).
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Elemen video bisa dilepas-pasang (mis. galat tinjau ↔ ulangi foto):
  // pasang ulang aliran kamera setiap kali elemen baru muncul.
  const setVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      void el.play().catch(() => {});
    }
  }, []);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("memulai");
  const [attempt, setAttempt] = useState(0);
  const [mock] = useState(() => createMockCamera());

  useEffect(() => {
    let cancelled = false;

    const stop = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };

    const start = async () => {
      if (wantsMockCamera()) {
        setStatus("tiruan");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("tidak-ada");
        return;
      }
      setStatus("memulai");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 1920 },
            height: { ideal: 1440 },
            aspectRatio: { ideal: 4 / 3 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const [track] = stream.getVideoTracks();
        track?.addEventListener("ended", () => {
          if (!cancelled) setStatus("galat");
        });
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        setStatus("siap");
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        setStatus(
          name === "NotAllowedError" || name === "SecurityError"
            ? "ditolak"
            : name === "NotFoundError" || name === "OverconstrainedError"
              ? "tidak-ada"
              : "galat",
        );
      }
    };

    void start();

    // Safari mematikan kamera saat aplikasi ke latar belakang → nyalakan lagi.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const live = streamRef.current
        ?.getVideoTracks()
        .some((t) => t.readyState === "live");
      if (!live) setAttempt((a) => a + 1);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      stop();
    };
  }, [attempt]);

  /** Coba nyalakan kamera lagi (setelah izin diberikan / kamera dilepas). */
  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  const capture = useCallback<CameraSource["capture"]>(
    async (label) => {
      const video = videoRef.current;
      if (status === "tiruan" || !video || !video.videoWidth) {
        if (status === "tiruan") return mock.capture(label);
        throw new Error("Kamera belum siap");
      }
      // Potong tengah ke rasio 4:3 lalu cerminkan (sama seperti pratinjau).
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const srcW = Math.min(vw, (vh * 4) / 3);
      const srcH = (srcW * 3) / 4;
      const outW = Math.min(MAX_SHOT_WIDTH, Math.round(srcW));
      const outH = Math.round((outW * 3) / 4);

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas tidak didukung");
      ctx.translate(outW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(
        video,
        (vw - srcW) / 2,
        (vh - srcH) / 2,
        srcW,
        srcH,
        0,
        0,
        outW,
        outH,
      );
      return canvas.toDataURL("image/jpeg", 0.92);
    },
    [status, mock],
  );

  const camera = useMemo<CameraSource>(() => ({ capture }), [capture]);
  return {
    videoRef: setVideo,
    status,
    ready: status === "siap" || status === "tiruan",
    retry,
    camera,
  };
}
