# Panduan Deploy Potretin

Kode sudah ada di GitHub: **kholidfathh-commits/Photobooth**.
Sisanya cukup klik-klik di **Vercel** (±10 menit), tanpa menyalin kata sandi atau token.

- **Foto pelanggan** disimpan di **Vercel Blob** (gratis ±1 GB ≈ 1.000+ photostrip).
- **Data sesi & QR** disimpan di database **Turso** (gratis).
- Google Drive bersifat **opsional**, bisa ditambahkan nanti (lihat bagian akhir).

---

## 1. Buat project di Vercel

1. Buka https://vercel.com/new (masuk dengan akun GitHub `kholidfathh-commits`).
2. Pada **Import Git Repository**, pilih **Photobooth** → **Import**.
   - Bila repo tidak muncul: klik **Adjust GitHub App Permissions** → izinkan repo *Photobooth*.
3. Jangan ubah pengaturan apa pun → klik **Deploy**.
   *Deploy pertama ini **akan gagal** dengan pesan "Database belum disambungkan" — itu wajar.*
   Klik **Continue to Dashboard** / buka project-nya.

## 2. Sambungkan penyimpanan foto (Vercel Blob)

1. Di project → tab **Storage** → **Create Database** → pilih **Blob** → **Continue**.
2. Beri nama `photobooth-foto` → **Create** → pada pilihan environment biarkan semua tercentang → **Connect**.

## 3. Sambungkan database (Turso)

1. Masih di tab **Storage** → **Create Database** → pilih **Turso** (bagian *Marketplace*).
2. Ikuti langkahnya: pilih paket **Free**, region **Singapore** bila ditanya, beri nama
   `photobooth-db` → **Create** → **Connect** ke project *Photobooth*.

## 4. Deploy ulang

1. Tab **Deployments** → klik **⋯** pada deployment teratas → **Redeploy** → **Redeploy**.
2. Tunggu ±2 menit sampai statusnya **Ready**. Tabel database & frame dibuat otomatis.
3. Buka alamat aplikasi (mis. `https://photobooth-xxxx.vercel.app`) — layar
   "Yuk, foto bareng!" harus tampil.

> Kirim alamat aplikasinya ke Claude — Claude akan mengecek semuanya dari sisi server.

## 5. Siapkan iPad (±10 menit)

1. Buka alamat aplikasi di **Safari**.
2. Tombol **Bagikan → Tambahkan ke Layar Utama**, lalu buka aplikasi dari ikon
   "Potretin" (tampil layar penuh).
3. Saat pertama ke halaman foto, **izinkan kamera**. Bila terlanjur menolak:
   Pengaturan → Safari → Kamera → **Izinkan**.
4. Kunci iPad ke aplikasi dengan **Akses Terpandu**: Pengaturan → Aksesibilitas →
   Akses Terpandu → aktifkan & buat kode. Di aplikasi, tekan tombol samping 3×.
5. Pengaturan → Layar & Kecerahan → **Kunci Otomatis: Jangan Pernah**. Pasang ke charger.

## 6. Uji coba sebelum acara (wajib)

- [ ] Satu sesi penuh: pilih frame → foto 3× → Lanjut → Simpan & Bagikan → QR muncul.
- [ ] Pindai QR dengan 2–3 HP (iPhone & Android) → foto bisa disimpan ke galeri.
- [ ] Coba di jaringan lemot (hotspot HP): unggahan mencoba ulang otomatis.
- [ ] Tekan **Selesai** → layar kembali ke awal dan sesi sebelumnya bersih.

## Saat acara

- Siapkan internet cadangan (hotspot HP). Jangan tekan "Selesai" sebelum QR muncul.
- Halaman operator: ikon roda gigi kecil di pojok kanan bawah layar awal.
- Fitur cetak sedang **nonaktif**; nyalakan di halaman operator bila nanti ada printer AirPrint.
- Semua foto bisa dilihat/diunduh operator di Vercel → project → **Storage → photobooth-foto**.

## Bila ada masalah

| Gejala | Penyebab & solusi |
|---|---|
| Deploy gagal "Database belum disambungkan" | Langkah 3 belum selesai → sambungkan Turso, lalu Redeploy |
| "Kamera belum diizinkan" | Pengaturan → Safari → Kamera → Izinkan, lalu Coba Lagi |
| Unggahan selalu gagal | Pastikan Blob sudah tersambung (langkah 2), lalu Redeploy |
| Frame tidak muncul | Database belum tersambung → cek langkah 3, Redeploy |

---

## Opsional: simpan foto ke Google Drive (Gmail)

Bila kelak ingin foto masuk ke Google Drive akun Gmail (bukan Vercel Blob):

1. https://console.cloud.google.com → buat project → **APIs & Services → Library** →
   aktifkan **Google Drive API**.
2. **OAuth consent screen**: External → isi nama & email → **Publish app**
   (wajib; bila "Testing", izin kedaluwarsa 7 hari).
3. **Credentials → Create credentials → OAuth client ID** → jenis **Desktop app**.
4. Buat `.env.local` di folder proyek berisi `GOOGLE_OAUTH_CLIENT_ID=…` dan
   `GOOGLE_OAUTH_CLIENT_SECRET=…`, lalu jalankan `npm run drive:token` dan masuk
   dengan akun Gmail penyimpan foto.
5. Di Vercel → **Settings → Environment Variables** isi ketiga nilai
   `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`
   → Redeploy. Bila nilai Google terisi, aplikasi otomatis memakai Drive.
