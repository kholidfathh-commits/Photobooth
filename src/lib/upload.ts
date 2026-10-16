import { photostripFileName } from "./file-naming";
import { randomToken } from "./token";

// Pengunggah photostrip. Layar hanya bergantung pada interface
// PhotostripUploader: versi API (bawaan) mengirim ke server yang meneruskan
// ke Google Drive; versi tiruan untuk demo tanpa server
// (NEXT_PUBLIC_UPLOAD_MODE=tiruan).

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
  /** Waktu mulai sesi (ISO) & frame — untuk mendaftarkan sesi & nama berkas. */
  startedAt?: string;
  frameId?: string;
  frameName?: string;
  deviceId?: string;
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

/** Error unggah; `retryable` = layak dicoba ulang otomatis. */
export class UploadError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "UploadError";
  }
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

async function readError(res: Response | { status: number; body: string }) {
  const text = res instanceof Response ? await res.text() : res.body;
  try {
    const json = JSON.parse(text) as { error?: { message?: string } };
    if (json.error?.message) return json.error.message;
  } catch {
    /* bukan JSON */
  }
  return `Server menolak (${res.status})`;
}

/** 408, 429, dan 5xx layak dicoba ulang; 4xx lain tidak akan berubah. */
const isRetryableStatus = (status: number) =>
  status === 0 || status === 408 || status === 429 || status >= 500;

/** Kirim berkas dengan XHR agar progres unggah bisa ditampilkan. */
function postWithProgress(
  url: string,
  blob: Blob,
  onProgress: ((p: number) => void) | undefined,
  signal: AbortSignal | undefined,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("content-type", blob.type || "image/jpeg");
    xhr.timeout = 90_000;
    xhr.upload.onprogress = (e) => {
      // 90% untuk kirim berkas; 10% sisanya menunggu server menyimpan ke Drive.
      if (e.lengthComputable) onProgress?.((e.loaded / e.total) * 0.9);
    };
    xhr.onload = () => resolve({ status: xhr.status, body: xhr.responseText });
    xhr.onerror = () =>
      reject(new UploadError("Koneksi terputus saat mengirim foto", true));
    xhr.ontimeout = () =>
      reject(new UploadError("Pengiriman foto terlalu lama", true));
    xhr.onabort = () =>
      reject(new DOMException("Unggahan dibatalkan", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort());
    xhr.send(blob);
  });
}

/**
 * Pengunggah sungguhan: (1) daftarkan sesi di server (idempoten), lalu
 * (2) kirim photostrip final ke /api/sessions/:id/photostrip?unggah=1 —
 * server menyimpan, mengunggah ke Google Drive, dan menerbitkan token QR.
 */
export function createApiUploader(): PhotostripUploader {
  return {
    async upload(
      blob,
      { sessionId, startedAt, frameId, deviceId, onProgress, signal },
    ) {
      onProgress?.(0);
      let res: Response;
      try {
        res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: sessionId, frameId, deviceId, startedAt }),
          signal,
        });
      } catch (err) {
        if (signal?.aborted) throw err;
        throw new UploadError("Tidak bisa menghubungi server", true);
      }
      if (!res.ok) {
        throw new UploadError(
          await readError(res),
          isRetryableStatus(res.status),
        );
      }

      const sent = await postWithProgress(
        `/api/sessions/${encodeURIComponent(sessionId)}/photostrip?unggah=1`,
        blob,
        onProgress,
        signal,
      );
      if (sent.status < 200 || sent.status >= 300) {
        throw new UploadError(
          await readError(sent),
          isRetryableStatus(sent.status),
        );
      }
      const json = JSON.parse(sent.body) as {
        upload: { fileName: string; driveFileId: string; uploadedAt: string };
        qr: { token: string };
      };
      onProgress?.(1);
      return {
        fileName: json.upload.fileName,
        driveFileId: json.upload.driveFileId,
        qrToken: json.qr.token,
        uploadedAt: json.upload.uploadedAt,
      };
    },
  };
}

/** Pengunggah sesuai mode: API (bawaan) atau tiruan untuk demo. */
export function createUploader(): PhotostripUploader {
  return process.env.NEXT_PUBLIC_UPLOAD_MODE === "tiruan"
    ? createMockUploader()
    : createApiUploader();
}
