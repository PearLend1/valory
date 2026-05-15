CREATE TABLE `follow_properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`propertyId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follow_properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`propertyId` int NOT NULL,
	`eventId` int NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_timeline_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`eventType` enum('LAUNCHED','VIEWING_BOOKED','VIEWING_MILESTONE','MEDIA_UPDATED','PRICE_CHANGED','OFFER_RECEIVED','UNDER_OFFER','OFFER_FELL_THROUGH','BACK_ON_MARKET','SOLD') NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`details` json,
	`agentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `property_timeline_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP INDEX `vendor_idx` ON `properties`;--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `address` text NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `status` enum('active','pending','sold','withdrawn') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `description` text;--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `latitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `longitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `properties` ADD `title` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` ADD `propertyType` enum('house','apartment','condo','townhouse','land','commercial') NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` ADD `listingMethod` enum('agent','self','hybrid') DEFAULT 'agent' NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` ADD `videoUrl` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `videoThumbnailUrl` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `images` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `ownerId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` ADD `agentId` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `viewCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` ADD `inquiryCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` ADD `soldAt` timestamp;--> statement-breakpoint
CREATE INDEX `user_idx` ON `follow_properties` (`userId`);--> statement-breakpoint
CREATE INDEX `property_idx` ON `follow_properties` (`propertyId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `property_idx` ON `notifications` (`propertyId`);--> statement-breakpoint
CREATE INDEX `is_read_idx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `property_idx` ON `property_timeline_events` (`propertyId`);--> statement-breakpoint
CREATE INDEX `agent_idx` ON `property_timeline_events` (`agentId`);--> statement-breakpoint
CREATE INDEX `event_type_idx` ON `property_timeline_events` (`eventType`);--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `vendorId`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `addressPartial`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `type`;