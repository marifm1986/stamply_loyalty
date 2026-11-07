CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`member` text NOT NULL,
	`kind` text NOT NULL,
	`at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`stamps` integer DEFAULT 0 NOT NULL,
	`visits` integer DEFAULT 0 NOT NULL,
	`last` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shops` (
	`owner` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`reward` text NOT NULL,
	`goal` integer NOT NULL
);
