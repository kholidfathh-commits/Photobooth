import type { UploadResult } from "./upload";

// Tipe data inti photobooth. Bentuknya mengikuti skema database di PRD
// (tabel frames, sessions, photos) supaya nanti tinggal disambung ke API.

export type SlotCount = 2 | 3;

export interface Frame {
  id: string;
  name: string;
  /** Jumlah foto dalam satu photostrip (2 atau 3). */
  slotCount: SlotCount;
  /** Warna latar photostrip (sementara, sebelum ada gambar frame asli). */
  background: string;
  /** Warna teks/aksen pada photostrip. */
  accent: string;
  /** Tulisan kecil di bagian bawah photostrip. */
  caption: string;
  isActive: boolean;
}

/**
 * Tahapan satu sesi foto:
 * - siap: kamera tampil, menunggu pelanggan menekan mulai
 * - hitung-mundur: hitungan 3, 2, 1 sebelum jepret
 * - memotret: kilatan saat foto diambil
 * - tinjau: semua slot terisi, pelanggan meninjau hasil
 */
export type SessionStatus = "siap" | "hitung-mundur" | "memotret" | "tinjau";

export interface Shot {
  id: string;
  orderIndex: number;
  /** URL gambar (data URL dari kamera, atau gambar tiruan). */
  src: string;
  takenAt: string;
}

/** Gambar photostrip hasil gabungan (satu file utuh, siap diunggah/dicetak). */
export interface PhotostripImage {
  blob: Blob;
  /** Object URL untuk ditampilkan; dicabut otomatis saat diganti. */
  url: string;
  width: number;
  height: number;
  /** Sidik frame + jepretan sumber, untuk tahu kapan perlu digabung ulang. */
  sourceKey: string;
}

export interface PhotoSession {
  id: string;
  frameId: string;
  status: SessionStatus;
  shots: Shot[];
  startedAt: string;
  /** Hasil gabungan terakhir; kosong bila belum/harus digabung ulang. */
  result?: PhotostripImage;
  /** Hasil unggahan ke Google Drive untuk `result` saat ini. */
  upload?: UploadResult & { sourceKey: string };
}
