-- Frame lama bertema acara dinonaktifkan (data sesi lama tetap aman).
UPDATE `frames` SET `is_active` = 0 WHERE `id` IN ('frame-cfd-pagi', 'frame-kampus', 'frame-senja-kota', 'frame-minimalis');
--> statement-breakpoint
-- Katalog frame Potretin (9:16) — desainnya di src/lib/frames & public/frames.
INSERT OR IGNORE INTO `frames` (`id`, `name`, `slot_count`, `layout_json`, `is_active`) VALUES
  ('klasik-putih', 'Klasik Putih', 3, '{"background": "#ffffff", "accent": "#111111", "caption": "Potretin"}', 1),
  ('hitam-elegan', 'Hitam Elegan', 3, '{"background": "#0c0c0c", "accent": "#d4af37", "caption": "Potretin"}', 1),
  ('film-analog', 'Film Analog', 3, '{"background": "#141414", "accent": "#f59e0b", "caption": "Potretin"}', 1),
  ('neon-malam', 'Neon Malam', 3, '{"background": "#0b0620", "accent": "#ff3ea5", "caption": "Potretin"}', 1),
  ('pastel-manis', 'Pastel Manis', 3, '{"background": "#ffd6e7", "accent": "#e0457b", "caption": "Potretin"}', 1),
  ('kertas-kraft', 'Kertas Kraft', 3, '{"background": "#c9a47c", "accent": "#3b2a1a", "caption": "Potretin"}', 1),
  ('laut-biru', 'Laut Biru', 3, '{"background": "#0e7dc2", "accent": "#ffffff", "caption": "Potretin"}', 1),
  ('retro-70an', 'Retro 70an', 3, '{"background": "#fbefd5", "accent": "#c2410c", "caption": "Potretin"}', 1),
  ('botani', 'Botani', 3, '{"background": "#dfe8d8", "accent": "#2f4a32", "caption": "Potretin"}', 1),
  ('pop-ceria', 'Pop Ceria', 3, '{"background": "#ffd60a", "accent": "#111111", "caption": "Potretin"}', 1),
  ('monokrom', 'Monokrom', 2, '{"background": "#f4f4f4", "accent": "#0a0a0a", "caption": "Potretin"}', 1),
  ('polaroid', 'Polaroid', 2, '{"background": "#e9e5dc", "accent": "#2b2b2b", "caption": "Potretin"}', 1),
  ('gradasi-jingga', 'Gradasi Jingga', 2, '{"background": "#ff8a5b", "accent": "#ffffff", "caption": "Potretin"}', 1),
  ('kotak-kotak', 'Kotak-Kotak', 2, '{"background": "#e94b4b", "accent": "#e94b4b", "caption": "Potretin"}', 1),
  ('y2k-krom', 'Y2K Krom', 2, '{"background": "#c7b8ff", "accent": "#1e1b4b", "caption": "Potretin"}', 1),
  ('galaksi', 'Galaksi', 2, '{"background": "#0f1238", "accent": "#c4b5fd", "caption": "Potretin"}', 1),
  ('bunga-liar', 'Bunga Liar', 2, '{"background": "#fff7ed", "accent": "#9d174d", "caption": "Potretin"}', 1),
  ('warna-warni', 'Warna-Warni', 2, '{"background": "#ffffff", "accent": "#2563eb", "caption": "Potretin"}', 1);
