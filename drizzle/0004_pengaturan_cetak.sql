CREATE TABLE `print_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text,
	`printer_enabled` integer DEFAULT true NOT NULL,
	`paper_size` text DEFAULT '4R' NOT NULL,
	`orientation` text DEFAULT 'potret' NOT NULL,
	`strips_per_sheet` integer DEFAULT 2 NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `print_settings_device_uq` ON `print_settings` (`device_id`);--> statement-breakpoint
-- Baris pengaturan umum acara (semua iPad).
INSERT INTO `print_settings` (`id`, `device_id`) VALUES ('default', NULL);
