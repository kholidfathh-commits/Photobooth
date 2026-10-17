import type { MetadataRoute } from "next";

/**
 * Manifest PWA: aplikasi bisa dipasang ke layar utama iPad ("Tambahkan ke
 * Layar Utama") dan berjalan layar penuh tanpa bilah Safari.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Potretin",
    short_name: "Potretin",
    description:
      "Photobooth untuk iPad di CFD, acara kampus, dan event — foto, pilih frame, unduh lewat QR Code.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "id",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
