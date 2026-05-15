CREATE TABLE `agent_interest_expressions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`valuationRequestId` int NOT NULL,
	`earlyLeadSignalId` int,
	`status` enum('expressed','matched','declined','expired') NOT NULL DEFAULT 'expressed',
	`expressedAt` timestamp NOT NULL DEFAULT (now()),
	`matchedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_interest_expressions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `vendor_lead_states` MODIFY COLUMN `state` enum('REGISTERED','PROFILE_IN_PROGRESS','ACCEPTED_VALUATION','READY_FOR_AGENT_MATCH','PAUSED','WITHDRAWN') NOT NULL DEFAULT 'REGISTERED';--> statement-breakpoint
ALTER TABLE `valuationRequests` ADD `lockedUntil` timestamp;--> statement-breakpoint
ALTER TABLE `valuationRequests` ADD `estimatedMidpoint` decimal(12,2);--> statement-breakpoint
ALTER TABLE `valuationRequests` ADD `leadState` enum('REGISTERED','PROFILE_IN_PROGRESS','ACCEPTED_VALUATION','READY_FOR_AGENT_MATCH');--> statement-breakpoint
ALTER TABLE `valuationRequests` ADD `propertyBasics` json;--> statement-breakpoint
ALTER TABLE `valuationRequests` ADD `propertyFeatures` json;--> statement-breakpoint
ALTER TABLE `valuationRequests` ADD `hasPhotos` boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX `agent_idx` ON `agent_interest_expressions` (`agentId`);--> statement-breakpoint
CREATE INDEX `valuation_idx` ON `agent_interest_expressions` (`valuationRequestId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `agent_interest_expressions` (`status`);--> statement-breakpoint
CREATE INDEX `lead_state_idx` ON `valuationRequests` (`leadState`);