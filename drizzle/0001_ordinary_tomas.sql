CREATE TABLE `assignment` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`task_ids` text NOT NULL,
	`user_id` text NOT NULL,
	`canvas_assignment_id` text,
	`canvas_course_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`body` text NOT NULL,
	`user_id` text NOT NULL,
	`bookmarked` integer DEFAULT 0 NOT NULL,
	`assignment_id` text,
	`finished` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignment`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `user` ADD `theme` text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `canvas_api_url` text;--> statement-breakpoint
ALTER TABLE `user` ADD `canvas_api_token` text;--> statement-breakpoint
ALTER TABLE `user` ADD `canvas_last_sync` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `enabled_courses` text;--> statement-breakpoint
ALTER TABLE `user` ADD `auto_complete_expired` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `user` ADD `auto_complete_all_tasks` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `user` ADD `show_completed_assignments` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `user` ADD `font_family` text DEFAULT 'default';--> statement-breakpoint
ALTER TABLE `user` ADD `font_size` text DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE `user` ADD `reduced_motion` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `user` ADD `high_contrast` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `user` ADD `theme_mode` text DEFAULT 'light';--> statement-breakpoint
ALTER TABLE `user` ADD `auto_theme_enabled` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `user` ADD `light_mode_start` text DEFAULT '07:00';--> statement-breakpoint
ALTER TABLE `user` ADD `light_mode_end` text DEFAULT '20:00';