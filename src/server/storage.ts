import "server-only";

import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Penyimpanan berkas sementara di server (sebelum/selain Google Drive).
 * Implementasi lokal menulis ke STORAGE_DIR (default ./data/files).
 * Catatan: di Vercel disk bersifat sementara — Google Drive tetap jadi
 * penyimpanan utama hasil foto.
 */
export interface FileStorage {
  put(key: string, data: Buffer): Promise<{ key: string; size: number }>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  /** Hapus semua berkas di bawah awalan folder (mis. "mentah/sesi-1"). */
  deletePrefix(prefix: string): Promise<void>;
}

/** Kunci aman: segmen huruf/angka/._- dipisah "/", tanpa "..". */
export function isSafeKey(key: string): boolean {
  return (
    /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/.test(key) &&
    !key.split("/").some((part) => part === "." || part === "..")
  );
}

/**
 * Folder bawaan: STORAGE_DIR bila diisi; di Vercel (disk proyek hanya-baca)
 * memakai folder sementara sistem; selain itu ./data/files.
 */
function defaultStorageRoot() {
  if (process.env.STORAGE_DIR) return process.env.STORAGE_DIR;
  if (process.env.VERCEL) return path.join(tmpdir(), "photobooth-files");
  return path.join(process.cwd(), "data", "files");
}

export function createLocalStorage(root = defaultStorageRoot()): FileStorage {
  const resolve = (key: string) => {
    if (!isSafeKey(key)) throw new Error(`Kunci berkas tidak valid: ${key}`);
    // Folder data ditentukan saat runtime; jangan di-trace saat build.
    return path.join(/*turbopackIgnore: true*/ root, key);
  };

  return {
    async put(key, data) {
      const file = resolve(key);
      await mkdir(path.dirname(file), { recursive: true });
      // Tulis ke berkas sementara lalu ganti nama agar tidak ada berkas setengah jadi.
      const tmp = `${file}.${process.pid}.tmp`;
      await writeFile(tmp, data);
      await rename(tmp, file);
      return { key, size: data.length };
    },
    async get(key) {
      try {
        return await readFile(/*turbopackIgnore: true*/ resolve(key));
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw err;
      }
    },
    async delete(key) {
      await rm(resolve(key), { force: true });
    },
    async deletePrefix(prefix) {
      await rm(resolve(prefix), { recursive: true, force: true });
    },
  };
}

let shared: FileStorage | undefined;
/** Instans penyimpanan bersama untuk seluruh server. */
export function storage(): FileStorage {
  shared ??= createLocalStorage();
  return shared;
}
