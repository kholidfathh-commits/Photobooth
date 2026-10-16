"use client";

import { useEffect } from "react";

/**
 * Jaga layar iPad tetap menyala selama aplikasi terbuka (Screen Wake Lock,
 * Safari 16.4+). Kunci dilepas otomatis oleh browser saat aplikasi ke latar
 * belakang, jadi diminta ulang setiap kali aplikasi tampil lagi.
 */
export function KeepAwake() {
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let disposed = false;

    const request = async () => {
      if (disposed || document.visibilityState !== "visible") return;
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        /* ditolak (mis. mode hemat daya) — abaikan */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && (!lock || lock.released)) {
        void request();
      }
    };

    void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => {});
    };
  }, []);
  return null;
}
