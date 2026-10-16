CREATE TABLE `photostrips` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`final_url` text,
	`drive_file_id` text,
	`qr_token` text NOT NULL,
	`resolution` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photostrips_session_uq` ON `photostrips` (`session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `photostrips_qr_token_uq` ON `photostrips` (`qr_token`);