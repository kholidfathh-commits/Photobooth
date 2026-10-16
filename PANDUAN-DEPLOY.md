# Panduan Deploy Street Photobooth

Panduan ini membawa aplikasi dari laptop sampai siap dipakai di iPad saat acara.
Perkiraan waktu: **±45–60 menit**, sekali saja.

Yang dibutuhkan:
- Akun **Gmail** (tempat semua foto pelanggan disimpan di Google Drive)
- Akun **GitHub**, **Vercel**, dan **Turso** (semuanya gratis; bisa daftar pakai GitHub)
- iPad dengan Safari (iPadOS 16.4 atau lebih baru)

---

## 1. Unggah kode ke GitHub (±5 menit)

1. Buka https://github.com/new, beri nama misalnya `street-photobooth`, pilih **Private**, lalu **Create repository** (jangan centang README).
2. Di terminal, dari folder `Fotobooth`, jalankan (ganti `USERNAME`):

   ```bash
   git remote add origin https://github.com/USERNAME/street-photobooth.git
   git push -u origin main
   ```

## 2. Siapkan Google Drive (±15 menit)

Foto disimpan di Drive akun Gmail-mu. Aplikasi hanya bisa melihat folder & berkas
yang ia buat sendiri (izin `drive.file`), bukan isi Drive-mu yang lain.

1. Buka https://console.cloud.google.com → **Buat project** baru, misalnya `Street Photobooth`.
2. Menu **APIs & Services → Library** → cari **Google Drive API** → **Enable**.
3. Menu **APIs & Services → OAuth consent screen**:
   - User type: **External** → isi nama aplikasi (`Street Photobooth`) dan email.
   - Bagian *Scopes* boleh dilewati.
   - Setelah selesai, tekan **Publish app** / **Push to production**. *Penting:* bila
     dibiarkan "Testing", izin kedaluwarsa setelah 7 hari dan unggahan akan berhenti.
4. Menu **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Desktop app** → **Create**.
   - Salin **Client ID** dan **Client secret**.
5. Di folder `Fotobooth`, buat berkas `.env.local` berisi:

   ```
   GOOGLE_OAUTH_CLIENT_ID=isi-client-id
   GOOGLE_OAUTH_CLIENT_SECRET=isi-client-secret
   ```

6. Jalankan:

   ```bash
   npm run drive:token
   ```

   Browser akan terbuka → masuk dengan **akun Gmail penyimpan foto** → izinkan.
   (Bila muncul "Google hasn't verified this app", pilih *Advanced → Go to Street
   Photobooth* — ini aplikasimu sendiri.) Terminal akan menampilkan
   `GOOGLE_OAUTH_REFRESH_TOKEN=...` — **simpan nilai itu**, perlakukan seperti kata sandi.

## 3. Siapkan database Turso (±5 menit)

1. Daftar di https://turso.tech → **Create Database**, region **Singapore**.
2. Salin **Database URL** (diawali `libsql://`) dan buat **token** (Create Token).

## 4. Deploy ke Vercel (±10 menit)

1. Buka https://vercel.com/new → **Import** repo `street-photobooth`.
2. Sebelum Deploy, buka **Environment Variables** dan isi:

   | Nama | Nilai |
   |---|---|
   | `DATABASE_URL` | URL Turso (`libsql://…`) |
   | `DATABASE_AUTH_TOKEN` | token Turso |
   | `GOOGLE_OAUTH_CLIENT_ID` | dari langkah 2 |
   | `GOOGLE_OAUTH_CLIENT_SECRET` | dari langkah 2 |
   | `GOOGLE_OAUTH_REFRESH_TOKEN` | dari langkah 2 |
   | `OPERATOR_TOKEN` | kata acak panjang buatanmu |
   | `CRON_SECRET` | kata acak panjang lain |

3. Tekan **Deploy**. Tabel database dan frame awal dibuat otomatis saat build.
4. Setelah selesai, salin alamat aplikasi (mis. `https://street-photobooth.vercel.app`),
   tambahkan variabel `NEXT_PUBLIC_APP_URL` = alamat itu, lalu **Redeploy**
   (Deployments → ⋯ → Redeploy) agar tautan QR memakai domain yang benar.

## 5. Siapkan iPad (±10 menit)

1. Buka alamat aplikasi di **Safari**.
2. Tekan tombol **Bagikan → Tambahkan ke Layar Utama**, lalu buka aplikasi dari ikon
   "Photobooth" (tampil layar penuh, tanpa bilah Safari).
3. Saat pertama kali ke halaman foto, **izinkan kamera**. Bila terlanjur menolak:
   Pengaturan → Safari → Kamera → **Izinkan**.
4. Kunci iPad ke aplikasi ini dengan **Guided Access**: Pengaturan → Aksesibilitas →
   Akses Terpandu → aktifkan & buat kode. Di aplikasi, tekan tombol samping 3× untuk mulai.
5. Pengaturan → Layar & Kecerahan → **Kunci Otomatis: Jangan Pernah** (aplikasi juga
   menjaga layar tetap menyala). Pasang iPad ke charger selama acara.

## 6. Uji coba sebelum acara (wajib)

- [ ] Satu sesi penuh: pilih frame → foto 3× → Lanjut → Simpan & Bagikan → QR muncul.
- [ ] Pindai QR dengan 2–3 HP berbeda (iPhone & Android) → foto bisa disimpan ke galeri.
- [ ] Cek Google Drive: folder **Street Photobooth / tanggal** berisi foto.
- [ ] Coba di jaringan lemot (hotspot HP): unggahan mencoba ulang otomatis.
- [ ] Tekan **Selesai** → layar kembali ke awal dan sesi sebelumnya bersih.

## Saat acara

- Siapkan internet cadangan (hotspot HP). Foto yang gagal terunggah tetap bisa dicoba
  ulang dari layar; jangan tekan "Selesai" sebelum muncul QR.
- Halaman operator: ikon roda gigi kecil di pojok kanan bawah layar awal.
- Fitur cetak sedang **nonaktif**. Bila nanti ada printer AirPrint, nyalakan di halaman operator.

## Bila ada masalah

| Gejala | Penyebab & solusi |
|---|---|
| "Kamera belum diizinkan" | Pengaturan → Safari → Kamera → Izinkan, lalu Coba Lagi |
| Unggahan selalu gagal | Cek variabel Google di Vercel; jalankan ulang `npm run drive:token` bila token dicabut/kedaluwarsa |
| QR membuka alamat `localhost` | `NEXT_PUBLIC_APP_URL` belum diisi → isi lalu Redeploy |
| Frame tidak muncul | Cek `DATABASE_URL` / token Turso, lalu Redeploy |
