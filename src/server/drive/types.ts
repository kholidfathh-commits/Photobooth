/** Kontrak layanan Google Drive yang dipakai alur unggah & unduh. */

export interface DriveFile {
  id: string;
  name: string;
  md5Checksum?: string;
  size?: number;
  mimeType?: string;
  /** Tautan lihat di web Drive. */
  webViewLink?: string;
  /** Tautan unduh langsung (bila berkas publik). */
  webContentLink?: string;
}

export interface UploadFileInput {
  name: string;
  mimeType: string;
  data: Buffer;
  folderId: string;
  description?: string;
  /** Properti kustom tak terlihat (mis. sessionId) untuk pencarian ulang. */
  appProperties?: Record<string, string>;
}

export interface DriveService {
  /**
   * "google" = Google Drive, "blob" = Vercel Blob, "tiruan" = disimpan
   * lokal untuk pengembangan.
   */
  readonly mode: "google" | "blob" | "tiruan";
  /** Pastikan rangkaian folder ada di bawah folder akar; kembalikan id terdalam. */
  ensureFolderPath(path: string[]): Promise<string>;
  uploadFile(input: UploadFileInput): Promise<DriveFile>;
  /** Bagikan "siapa pun yang punya tautan" sebagai pembaca. */
  makePublic(fileId: string): Promise<void>;
  getFile(fileId: string): Promise<DriveFile | null>;
  /** Cari berkas berdasarkan appProperties (mis. untuk cegah unggah ganda). */
  findByAppProperty(key: string, value: string): Promise<DriveFile | null>;
  downloadFile(fileId: string): Promise<Buffer | null>;
}

/** Error Drive; `retryable` = layak dicoba ulang (jaringan, 429, 5xx). */
export class DriveError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "DriveError";
  }
}
