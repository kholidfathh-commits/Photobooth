import "server-only";

/**
 * Konfigurasi Google Drive dari environment (hanya di server — kredensial
 * tidak pernah dikirim ke browser).
 *
 * Pilih SALAH SATU cara masuk:
 * 1. Service Account: GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 *    (folder akar harus di Shared Drive, atau dibagikan ke email service
 *    account sebagai Editor — service account tidak punya kuota sendiri).
 * 2. OAuth akun Gmail biasa: GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET
 *    + GOOGLE_OAUTH_REFRESH_TOKEN (memakai kuota Drive akun tersebut; izin
 *    `drive.file` — aplikasi hanya bisa melihat berkas yang dibuatnya sendiri).
 *    Ambil refresh token dengan `npm run drive:token`.
 * GOOGLE_DRIVE_ROOT_FOLDER_ID: folder tujuan. Wajib untuk Service Account;
 * untuk OAuth opsional — bila kosong, folder "Street Photobooth" dibuat di
 * akar My Drive.
 * GOOGLE_DRIVE_MODE=tiruan memaksa mode lokal (pengembangan/uji).
 */

export type DriveAuthConfig =
  | { kind: "service-account"; email: string; privateKey: string }
  | {
      kind: "oauth";
      clientId: string;
      clientSecret: string;
      refreshToken: string;
    };

export type DriveConfig =
  | { mode: "google"; rootFolderId: string; auth: DriveAuthConfig }
  | { mode: "blob" }
  | { mode: "tiruan"; reason: string };

export class DriveConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DriveConfigError";
  }
}

const env = (name: string) => process.env[name]?.trim() || undefined;

export function readDriveConfig(): DriveConfig {
  if (env("GOOGLE_DRIVE_MODE") === "tiruan") {
    return { mode: "tiruan", reason: "GOOGLE_DRIVE_MODE=tiruan" };
  }

  const email = env("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const rawKey = env("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
  const clientId = env("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = env("GOOGLE_OAUTH_CLIENT_SECRET");
  const refreshToken = env("GOOGLE_OAUTH_REFRESH_TOKEN");
  const rootFolderId = env("GOOGLE_DRIVE_ROOT_FOLDER_ID");

  let auth: DriveAuthConfig | null = null;
  if (email && rawKey) {
    // Kunci dari .env biasanya berisi "\n" literal.
    const privateKey = rawKey.replace(/\\n/g, "\n");
    if (!privateKey.includes("BEGIN PRIVATE KEY")) {
      throw new DriveConfigError(
        "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY bukan private key PEM yang valid",
      );
    }
    auth = { kind: "service-account", email, privateKey };
  } else if (clientId && clientSecret && refreshToken) {
    auth = { kind: "oauth", clientId, clientSecret, refreshToken };
  }

  if (!auth) {
    // Tanpa Google: pakai Vercel Blob bila store sudah disambungkan di Vercel.
    if (env("BLOB_READ_WRITE_TOKEN")) return { mode: "blob" };
    if (process.env.NODE_ENV === "production") {
      throw new DriveConfigError(
        "Penyimpanan foto belum diatur: sambungkan Vercel Blob atau isi kredensial Google Drive",
      );
    }
    return {
      mode: "tiruan",
      reason: "kredensial Google Drive belum diisi (mode pengembangan)",
    };
  }
  if (!rootFolderId && auth.kind === "service-account") {
    throw new DriveConfigError("GOOGLE_DRIVE_ROOT_FOLDER_ID belum diisi");
  }
  // "root" = akar My Drive akun OAuth.
  return { mode: "google", rootFolderId: rootFolderId ?? "root", auth };
}
