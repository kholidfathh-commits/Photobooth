import { photostripFileName } from "./file-naming";
import { randomToken } from "./token";

// Pengunggah photostrip. Layar hanya bergantung pada interface
// PhotostripUploader; versi tiruan ini nanti diganti pemanggil API backend
// (yang meneruskan ke Google Drive) tanpa mengubah tampilan.

export interface UploadResult {
  /** Nama file unik per sesi di Google Drive. */
  fileName: string;
  driveFileId: string;
  /** Token unik untuk halaman unduh & QR Code. */
  qrToken: string;
  uploadedAt: string;
}

export interface UploadOptions {
  sessionId: string;
  /** Waktu mulai sesi (ISO) & nama frame — untuk nama berkas unik. */
  startedAt?: string;
  frameName?: string;
  /** Progres 0–1. */
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

/** Status unggahan yang ditampilkan ke pelanggan. */
export type UploadState =
  | { status: "mengunggah"; progress: number; attempt: number }
  | {
      status: "mencoba-ulang";
      attempt: number;
      maxAttempts: number;
      /** Waktu (epoch ms) percobaan berikutnya dimulai. */
      retryAt: number;
      message: string;
    }
  | { status: "menunggu-internet"; message: string }
  | { status: "berhasil"; upload: UploadResult }
  | { status: "gagal"; message: string };

/** Jumlah percobaan otomatis sebelum menyerah dan meminta "Coba Lagi". */
export const MAX_UPLOAD_ATTEMPTS = 4;

/** Jeda sebelum percobaan ke-n+1 (ms): 2 dtk, 4 dtk, 8 dtk, … maks 15 dtk. */
export function retryDelay(attempt: number): number {
  return Math.min(2000 * 2 ** (attempt - 1), 15_000);
}

export interface PhotostripUploader {
  upload(blob: Blob, options: UploadOptions): Promise<UploadResult>;
}

declare global {
  /** Hook uji: jumlah unggahan tiruan berikutnya yang dibuat gagal. */
  var __mockUploadFailures: number | undefined;
}

/**
 * Unggahan tiruan: progres naik bertahap ±3 detik lalu sukses.
 * Untuk menguji kegagalan, set `globalThis.__mockUploadFailures = n` di
 * konsol — n unggahan berikutnya akan gagal di tengah jalan.
 */
export function createMockUploader({
  durationMs = 3000,
}: { durationMs?: number } = {}): PhotostripUploader {
  return {
    upload(blob, { startedAt, frameName, onProgress, signal }) {
      return new Promise((resolve, reject) => {
        const steps = 20;
        let step = 0;
        const shouldFail = (globalThis.__mockUploadFailures ?? 0) > 0;
        if (shouldFail) globalThis.__mockUploadFailures! -= 1;
        const timer = setInterval(() => {
          step += 1;
          onProgress?.(Math.min(step / steps, 1));
          if (shouldFail && step >= steps / 2) {
            clearInterval(timer);
            reject(new Error("Koneksi ke Google Drive terputus"));
            return;
          }
          if (step >= steps) {
            clearInterval(timer);
            const qrToken = randomToken();
            resolve({
              fileName: photostripFileName({
                startedAt: startedAt ?? new Date().toISOString(),
                frameName: frameName ?? "frame",
                qrToken,
              }),
              driveFileId: `mock-${randomToken(16)}`,
              qrToken,
              uploadedAt: new Date().toISOString(),
            });
          }
        }, durationMs / steps);
        signal?.addEventListener("abort", () => {
          clearInterval(timer);
          reject(new DOMException("Unggahan dibatalkan", "AbortError"));
        });
      });
    },
  };
}
