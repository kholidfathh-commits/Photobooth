-- Frame bawaan acara (id sama dengan data cadangan di aplikasi).
INSERT OR IGNORE INTO `frames` (`id`, `name`, `slot_count`, `layout_json`, `is_active`) VALUES
  ('frame-cfd-pagi', 'CFD Pagi', 3, '{"background":"#f6efe3","accent":"#c2410c","caption":"Car Free Day"}', 1),
  ('frame-kampus', 'Kampus Ceria', 2, '{"background":"#1e293b","accent":"#facc15","caption":"Hari Kampus"}', 1),
  ('frame-senja-kota', 'Senja Kota', 2, '{"background":"#3b0764","accent":"#fda4af","caption":"Street Photobooth"}', 1),
  ('frame-minimalis', 'Minimalis', 3, '{"background":"#ffffff","accent":"#171717","caption":"Street Photobooth"}', 1);
--> statement-breakpoint
-- Belum ada printer di lokasi: fitur cetak nonaktif sampai operator menyalakannya.
UPDATE `print_settings` SET `printer_enabled` = 0 WHERE `id` = 'default';
