CREATE TABLE `agent_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agency_name` varchar(255) NOT NULL,
	`branch_postcode` varchar(20) NOT NULL,
	`website_url` varchar(500),
	`full_name` varchar(255) NOT NULL,
	`job_title` varchar(255),
	`email` varchar(255) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`coverage_area` text NOT NULL,
	`tier` varchar(20) NOT NULL DEFAULT 'standard',
	`status` varchar(50) NOT NULL DEFAULT 'PENDING_APPROVAL',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `beta_signups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`role` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `beta_signups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `email_idx` ON `agent_registrations` (`email`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `agent_registrations` (`status`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `beta_signups` (`email`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `beta_signups` (`role`);