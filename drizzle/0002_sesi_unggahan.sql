CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`photostrip_id` text NOT NULL,
	`status` text DEFAULT 'menunggu' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`next_retry_at` text,
	`file_name` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`md5` text NOT NULL,
	`drive_file_id` text,
	`drive_folder_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`finished_at` text,
	FOREIGN KEY (`photostrip_id`) REFERENCES `photostrips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uploads_photostrip_uq` ON `uploads` (`photostrip_id`);--> statement-breakpoint
CREATE INDEX `uploads_status_idx` ON `uploads` (`status`,`next_retry_at`);