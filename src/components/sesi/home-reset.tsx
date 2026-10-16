"use client";

import { useEffect } from "react";

import { usePhotoSession } from "./session-provider";

/**
 * Dipasang di halaman awal: memastikan tidak ada sisa sesi pelanggan
 * sebelumnya (foto, hasil gabungan, status unggah) — mis. bila halaman awal
 * dibuka lewat tombol kembali. Bila hasil masih diunggah, pembersihan
 * ditunda sampai unggahan selesai agar foto pelanggan tidak hilang.
 */
export function HomeReset() {
  const { session, uploadState, resetSession } = usePhotoSession();
  const hasLeftovers = session.shots.length > 0 || Boolean(session.result);
  const uploading =
    uploadState?.status === "mengunggah" ||
    uploadState?.status === "mencoba-ulang" ||
    uploadState?.status === "menunggu-internet";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (hasLeftovers && !uploading) resetSession();
  }, [hasLeftovers, uploading, resetSession]);

  return null;
}
