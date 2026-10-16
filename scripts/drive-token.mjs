// Ambil GOOGLE_OAUTH_REFRESH_TOKEN untuk akun Gmail yang akan menyimpan foto.
//
// Pakai:
//   GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... npm run drive:token
// (atau isi kedua nilai itu di .env.local lalu jalankan `npm run drive:token`).
//
// Langkah: browser terbuka → masuk ke akun Gmail tujuan → izinkan →
// refresh token dicetak di terminal. Salin ke GOOGLE_OAUTH_REFRESH_TOKEN.
// Jenis OAuth client di Google Cloud harus "Desktop app".

import { exec } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

import { OAuth2Client } from "google-auth-library";

const PORT = 53682;
const REDIRECT = `http://127.0.0.1:${PORT}`;
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

function fromEnvFile(name) {
  try {
    const line = readFileSync(".env.local", "utf8")
      .split("\n")
      .find((l) => l.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || fromEnvFile("GOOGLE_OAUTH_CLIENT_ID");
const clientSecret =
  process.env.GOOGLE_OAUTH_CLIENT_SECRET || fromEnvFile("GOOGLE_OAUTH_CLIENT_SECRET");

if (!clientId || !clientSecret) {
  console.error(
    "✗ GOOGLE_OAUTH_CLIENT_ID dan GOOGLE_OAUTH_CLIENT_SECRET belum diisi (env atau .env.local).",
  );
  process.exit(1);
}

const client = new OAuth2Client({ clientId, clientSecret, redirectUri: REDIRECT });
const url = client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent", // selalu minta refresh token baru
  scope: SCOPES,
});

const server = createServer(async (req, res) => {
  const params = new URL(req.url ?? "/", REDIRECT).searchParams;
  const code = params.get("code");
  if (!code) {
    res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Izin ditolak atau gagal: ${params.get("error") ?? "tanpa kode"}`);
    return;
  }
  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    const about = await client.request({
      url: "https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)",
    });
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end("Berhasil! Kembali ke terminal untuk menyalin refresh token. Tab ini boleh ditutup.");
    console.log(`\n✓ Terhubung ke Drive akun: ${about.data.user?.emailAddress}`);
    if (!tokens.refresh_token) {
      console.log(
        "✗ Google tidak mengirim refresh token. Cabut akses aplikasi di https://myaccount.google.com/permissions lalu jalankan lagi.",
      );
    } else {
      console.log("\nGOOGLE_OAUTH_REFRESH_TOKEN=" + tokens.refresh_token + "\n");
      console.log("Simpan nilai di atas sebagai rahasia (Vercel → Environment Variables).");
    }
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("Gagal menukar kode. Lihat terminal.");
    console.error("✗ Gagal menukar kode:", err.message);
  } finally {
    server.close();
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("Buka tautan ini dan masuk dengan akun Gmail penyimpan foto:\n");
  console.log(url + "\n");
  if (process.platform === "darwin") exec(`open "${url}"`);
});
