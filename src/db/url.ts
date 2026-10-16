// Alamat database dari environment. Mendukung nama variabel manual
// (DATABASE_URL/DATABASE_AUTH_TOKEN) dan yang diisi otomatis oleh integrasi
// Turso di Vercel Marketplace (TURSO_DATABASE_URL/TURSO_AUTH_TOKEN).
// Dipakai aplikasi dan drizzle.config.ts (tanpa "server-only").

const LOCAL_DB = "file:./data/photobooth.db";

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
  if (url) return url;
  if (process.env.VERCEL) {
    throw new Error(
      "Database belum disambungkan. Di Vercel: Storage → tambahkan Turso, lalu Redeploy.",
    );
  }
  return LOCAL_DB;
}

export function databaseAuthToken(): string | undefined {
  return (
    process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || undefined
  );
}
