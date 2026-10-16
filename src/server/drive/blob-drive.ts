import "server-only";

import { createHash } from "node:crypto";

import {
  BlobAccessError,
  BlobNotFoundError,
  BlobServiceNotAvailable,
  BlobServiceRateLimited,
  get,
  head,
  put,
} from "@vercel/blob";

import { DriveError, type DriveFile, type DriveService } from "./types";

type Access = "public" | "private";

/** Bagian jalur yang aman: huruf, angka, tanda hubung, titik, garis bawah. */
const safe = (s: string) =>
  s.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "x";

function toDriveError(err: unknown): DriveError {
  if (err instanceof DriveError) return err;
  const retryable =
    err instanceof BlobServiceNotAvailable ||
    err instanceof BlobServiceRateLimited ||
    (err instanceof TypeError && /fetch/i.test(err.message));
  return new DriveError(
    `Penyimpanan Vercel Blob gagal: ${err instanceof Error ? err.message : String(err)}`,
    null,
    retryable,
  );
}

/**
 * Penyimpanan hasil foto di Vercel Blob — pengganti Google Drive yang bisa
 * disambungkan sekali klik dari dasbor Vercel (token terisi otomatis lewat
 * BLOB_READ_WRITE_TOKEN). Mengikuti kontrak DriveService yang sama, jadi alur
 * unggah, QR, dan unduhan tidak berubah.
 *
 * Berkas disimpan di "<folder>/<md5>-<nama berkas>" (+ akhiran acak untuk
 * store publik, sehingga alamatnya tidak bisa ditebak). Store privat juga
 * didukung: dideteksi otomatis saat unggahan pertama.
 */
export function createBlobDrive(): DriveService {
  let access: Access =
    process.env.BLOB_ACCESS === "private" ? "private" : "public";

  const idFor = (r: { url: string; pathname: string }) =>
    access === "private" ? `private:${r.pathname}` : r.url;

  /** md5 tertanam di nama berkas (agar unggah ulang bisa dikenali). */
  const md5FromPathname = (pathname: string) =>
    /(?:^|\/)([0-9a-f]{32})-[^/]+$/.exec(pathname)?.[1];

  async function upload(pathname: string, data: Buffer, contentType: string) {
    return put(pathname, data, {
      access,
      contentType,
      addRandomSuffix: access === "public",
      allowOverwrite: true,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    });
  }

  return {
    mode: "blob",

    async ensureFolderPath(path) {
      return ["photobooth", ...path].map(safe).join("/");
    },

    async uploadFile({ name, mimeType, data, folderId }) {
      const md5 = createHash("md5").update(data).digest("hex");
      const pathname = `${folderId}/${md5}-${safe(name)}`;
      try {
        let res;
        try {
          res = await upload(pathname, data, mimeType);
        } catch (err) {
          // Store dibuat sebagai "private" → ulangi dengan akses privat.
          if (access === "public" && err instanceof BlobAccessError) {
            access = "private";
            res = await upload(pathname, data, mimeType);
          } else {
            throw err;
          }
        }
        return {
          id: idFor(res),
          name,
          md5Checksum: md5,
          size: data.length,
          mimeType,
          webViewLink: res.url,
        };
      } catch (err) {
        throw toDriveError(err);
      }
    },

    async makePublic() {
      /* tautan unduh selalu lewat server aplikasi (/api/unduh/…) */
    },

    async getFile(fileId): Promise<DriveFile | null> {
      const target = fileId.startsWith("private:") ? fileId.slice(8) : fileId;
      try {
        const info = await head(target);
        return {
          id: fileId,
          name: info.pathname.split("/").pop() ?? info.pathname,
          md5Checksum: md5FromPathname(info.pathname),
          size: info.size,
          mimeType: info.contentType,
          webViewLink: info.url,
        };
      } catch (err) {
        if (err instanceof BlobNotFoundError) return null;
        throw toDriveError(err);
      }
    },

    async findByAppProperty() {
      // Blob tidak punya pencarian metadata; unggah ulang berkas yang sama
      // tetap aman (dikenali lewat getFile + md5 di nama berkas).
      return null;
    },

    async downloadFile(fileId) {
      try {
        if (fileId.startsWith("private:")) {
          const res = await get(fileId.slice(8), { access: "private" });
          if (!res || res.statusCode !== 200 || !res.stream) return null;
          return Buffer.from(await new Response(res.stream).arrayBuffer());
        }
        const res = await fetch(fileId, {
          signal: AbortSignal.timeout(30_000),
        });
        if (res.status === 404) return null;
        if (!res.ok)
          throw new DriveError(
            `Gagal mengambil berkas (${res.status})`,
            res.status,
            res.status >= 500,
          );
        return Buffer.from(await res.arrayBuffer());
      } catch (err) {
        if (err instanceof BlobNotFoundError) return null;
        throw toDriveError(err);
      }
    },
  };
}
