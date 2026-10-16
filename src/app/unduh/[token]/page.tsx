import type { Metadata, Viewport } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { DownloadScreen } from "@/components/unduh/download-screen";
import { DownloadSkeleton } from "@/components/unduh/download-skeleton";
import { isValidToken, normalizeToken } from "@/lib/download";
import { getPublicDownload } from "@/server/services/public-download";

export const metadata: Metadata = {
  title: "Unduh Foto",
  // Halaman pribadi per pelanggan: jangan diindeks mesin pencari.
  robots: { index: false, follow: false },
};

// Di HP pelanggan zoom cubit tetap diizinkan (berbeda dengan layar kiosk iPad).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0a0a0a",
};

/**
 * Halaman unduh publik (dibuka dari QR di HP pelanggan) — tanpa login.
 * Kerangka halaman tampil seketika; data foto (bergantung token) dialirkan
 * di dalam Suspense.
 */
export default function UnduhPage(props: PageProps<"/unduh/[token]">) {
  return (
    <Suspense fallback={<DownloadSkeleton />}>
      <DownloadContent params={props.params} />
    </Suspense>
  );
}

async function DownloadContent({
  params,
}: {
  params: PageProps<"/unduh/[token]">["params"];
}) {
  const { token: raw } = await params;

  // Validasi token: bentuk kanonis huruf kecil tanpa spasi. Pemindai/ketikan
  // yang menghasilkan huruf besar atau spasi diarahkan ke alamat kanonis.
  const token = normalizeToken(raw);
  if (!isValidToken(token)) notFound();
  if (token !== raw) redirect(`/unduh/${token}`);

  // Di pengembangan, token dari unggahan tiruan memakai foto contoh.
  const info = await getPublicDownload(token, { demoFallback: true });
  if (!info) notFound();
  return <DownloadScreen info={info} />;
}
