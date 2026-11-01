CREATE TABLE `planner_data` (
	`user_id` text PRIMARY KEY NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL
);
