CREATE TABLE `print_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`photostrip_id` text NOT NULL,
	`paper_size` text NOT NULL,
	`orientation` text NOT NULL,
	`layout` text NOT NULL,
	`status` text DEFAULT 'dikirim' NOT NULL,
	`copies` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`error` text,
	`requested_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`photostrip_id`) REFERENCES `photostrips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `print_jobs_photostrip_idx` ON `print_jobs` (`photostrip_id`);--> statement-breakpoint
CREATE INDEX `print_jobs_status_idx` ON `print_jobs` (`status`);