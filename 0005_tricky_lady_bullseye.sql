CREATE TABLE `lead_state_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`propertyId` int NOT NULL,
	`previousState` varchar(50),
	`newState` varchar(50) NOT NULL,
	`reason` text,
	`triggeredBy` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_state_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `premium_agent_lead_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`earlyLeadSignalId` int NOT NULL,
	`notifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `premium_agent_lead_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `premium_early_lead_signals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`vendorId` int NOT NULL,
	`postcodeSector` varchar(10) NOT NULL,
	`valuationBracketLow` decimal(12,2) NOT NULL,
	`valuationBracketHigh` decimal(12,2) NOT NULL,
	`propertyType` varchar(50) NOT NULL,
	`readinessStage` enum('EARLY_INTEREST','PROFILE_BUILDING','NEARLY_READY') NOT NULL,
	`launchTiming` varchar(50),
	`confidenceLevel` enum('low','medium','high') NOT NULL,
	`agentNotifications` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `premium_early_lead_signals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendor_launch_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`propertyId` int NOT NULL,
	`images` json,
	`keyFeatures` json,
	`condition` text,
	`improvements` json,
	`marketingHighlights` text,
	`additionalMedia` json,
	`completionPercentage` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendor_launch_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendor_lead_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`propertyId` int NOT NULL,
	`state` enum('REGISTERED','PROFILE_IN_PROGRESS','READY_FOR_AGENT_MATCH','PAUSED','WITHDRAWN') NOT NULL DEFAULT 'REGISTERED',
	`stateChangedAt` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendor_lead_states_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `vendor_idx` ON `lead_state_audit_log` (`vendorId`);--> statement-breakpoint
CREATE INDEX `property_idx` ON `lead_state_audit_log` (`propertyId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `lead_state_audit_log` (`createdAt`);--> statement-breakpoint
CREATE INDEX `agent_idx` ON `premium_agent_lead_notifications` (`agentId`);--> statement-breakpoint
CREATE INDEX `signal_idx` ON `premium_agent_lead_notifications` (`earlyLeadSignalId`);--> statement-breakpoint
CREATE INDEX `property_idx` ON `premium_early_lead_signals` (`propertyId`);--> statement-breakpoint
CREATE INDEX `vendor_idx` ON `premium_early_lead_signals` (`vendorId`);--> statement-breakpoint
CREATE INDEX `postcode_sector_idx` ON `premium_early_lead_signals` (`postcodeSector`);--> statement-breakpoint
CREATE INDEX `readiness_idx` ON `premium_early_lead_signals` (`readinessStage`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `premium_early_lead_signals` (`createdAt`);--> statement-breakpoint
CREATE INDEX `expires_at_idx` ON `premium_early_lead_signals` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `vendor_idx` ON `vendor_launch_profiles` (`vendorId`);--> statement-breakpoint
CREATE INDEX `property_idx` ON `vendor_launch_profiles` (`propertyId`);--> statement-breakpoint
CREATE INDEX `vendor_idx` ON `vendor_lead_states` (`vendorId`);--> statement-breakpoint
CREATE INDEX `property_idx` ON `vendor_lead_states` (`propertyId`);--> statement-breakpoint
CREATE INDEX `state_idx` ON `vendor_lead_states` (`state`);