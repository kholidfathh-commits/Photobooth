# Street Photobooth

Photobooth web untuk iPad di CFD, acara kampus, dan event: pilih frame → foto
otomatis dengan hitung mundur → photostrip → simpan ke Google Drive → pelanggan
mengunduh lewat QR Code (tanpa login).

- **Deploy & penyiapan iPad:** lihat [PANDUAN-DEPLOY.md](PANDUAN-DEPLOY.md)
- **Teknologi:** Next.js 16, Tailwind 4, shadcn/ui, SQLite/Turso + Drizzle, sharp, Google Drive API

## Menjalankan di komputer

```bash
npm install
npm run db:migrate
npm run dev
```

Buka http://localhost:3000. Tanpa kredensial Google, unggahan memakai Drive tiruan
(berkas di `data/drive-tiruan`). Tanpa kamera, buka `/sesi?kamera=tiruan`.

## Perintah lain

| Perintah | Kegunaan |
|---|---|
| `npm run db:generate` | Buat migrasi dari perubahan `src/db/schema.ts` |
| `npm run db:migrate` | Terapkan migrasi ke database |
| `npm run drive:token` | Ambil refresh token Google Drive (akun Gmail) |
