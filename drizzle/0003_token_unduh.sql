ALTER TABLE `photostrips` ADD `download_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `photostrips` ADD `last_downloaded_at` text;--> statement-breakpoint
ALTER TABLE `photostrips` ADD `token_revoked_at` text;