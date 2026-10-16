import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/components/sesi/session-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Street Photobooth",
    template: "%s · Street Photobooth",
  },
  description:
    "Photobooth web untuk iPad di CFD, acara kampus, dan event — foto, pilih frame, unduh lewat QR Code.",
  appleWebApp: {
    capable: true,
    title: "Photobooth",
    statusBarStyle: "black-translucent",
  },
};

// Dioptimalkan untuk iPad: tanpa zoom cubit, warna gelap menyatu dengan status bar.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col select-none touch-manipulation">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
