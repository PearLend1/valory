CREATE TABLE `analyticsEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`propertyId` int NOT NULL,
	`launchVideoId` int,
	`eventType` enum('impression','view','watch_complete','save','enquiry','contact_request') NOT NULL,
	`watchTimeSeconds` int,
	`completionRate` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`vendorId` int NOT NULL,
	`action` enum('view_contact_details','request_contact','accept_contact','reject_contact') NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `launchVideos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`agentId` int NOT NULL,
	`templateType` enum('agent-intro','property-showcase','hybrid') NOT NULL,
	`durationType` enum('30s','90s') NOT NULL,
	`videoUrl` varchar(512) NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`publishedAt` timestamp,
	CONSTRAINT `launchVideos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyAnalyticsSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`agentId` int NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`renewalDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyAnalyticsSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `propertyAnalyticsSubscriptions_propertyId_unique` UNIQUE(`propertyId`)
);
--> statement-breakpoint
CREATE TABLE `routeToMarket` (
	`id` int AUTO_INCREMENT NOT NULL,
	`valuationId` int NOT NULL,
	`vendorId` int NOT NULL,
	`method` enum('agent-led','self-list','hybrid') NOT NULL,
	`selectedAgentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `routeToMarket_id` PRIMARY KEY(`id`),
	CONSTRAINT `routeToMarket_valuationId_unique` UNIQUE(`valuationId`)
);
--> statement-breakpoint
CREATE TABLE `valuationRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`propertyId` int,
	`propertyData` json,
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`estimatedPriceLow` decimal(12,2),
	`estimatedPriceHigh` decimal(12,2),
	`confidence` enum('low','medium','high') DEFAULT 'medium',
	`reasoning` longtext,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `valuationRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendorConsent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`allowAgentContact` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendorConsent_id` PRIMARY KEY(`id`),
	CONSTRAINT `vendorConsent_vendorId_unique` UNIQUE(`vendorId`)
);
--> statement-breakpoint
DROP TABLE `propertyAnalytics`;--> statement-breakpoint
DROP TABLE `valuations`;--> statement-breakpoint
DROP TABLE `vendorAgentConnections`;--> statement-breakpoint
DROP INDEX `owner_idx` ON `properties`;--> statement-breakpoint
DROP INDEX `agent_idx` ON `properties`;--> statement-breakpoint
ALTER TABLE `agentSubscriptions` MODIFY COLUMN `tier` enum('tier1','tier2') NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `description` longtext;--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `address` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `latitude` decimal(10,8);--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `longitude` decimal(11,8);--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `status` enum('active','sold','withdrawn') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('public','vendor','agent','admin') NOT NULL DEFAULT 'public';--> statement-breakpoint
ALTER TABLE `agentSubscriptions` ADD `renewalDate` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` ADD `vendorId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` ADD `addressPartial` varchar(255);--> statement-breakpoint
ALTER TABLE `properties` ADD `type` enum('house','apartment','townhouse','land','commercial') NOT NULL;--> statement-breakpoint
ALTER TABLE `savedSearches` ADD `filtersJson` json NOT NULL;--> statement-breakpoint
ALTER TABLE `savedSearches` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
CREATE INDEX `property_idx` ON `analyticsEvents` (`propertyId`);--> statement-breakpoint
CREATE INDEX `launch_idx` ON `analyticsEvents` (`launchVideoId`);--> statement-breakpoint
CREATE INDEX `event_type_idx` ON `analyticsEvents` (`eventType`);--> statement-breakpoint
CREATE INDEX `agent_idx` ON `auditLog` (`agentId`);--> statement-breakpoint
CREATE INDEX `vendor_idx` ON `auditLog` (`vendorId`);--> statement-breakpoint
CREATE INDEX `action_idx` ON `auditLog` (`action`);--> statement-breakpoint
CREATE INDEX `property_idx` ON `launchVideos` (`propertyId`);--> statement-breakpoint
CREATE INDEX `agent_idx` ON `launchVideos` (`agentId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `launchVideos` (`status`);--> statement-breakpoint
CREATE INDEX `property_idx` ON `propertyAnalyticsSubscriptions` (`propertyId`);--> statement-breakpoint
CREATE INDEX `agent_idx` ON `propertyAnalyticsSubscriptions` (`agentId`);--> statement-breakpoint
CREATE INDEX `vendor_idx` ON `routeToMarket` (`vendorId`);--> statement-breakpoint
CREATE INDEX `valuation_idx` ON `routeToMarket` (`valuationId`);--> statement-breakpoint
CREATE INDEX `vendor_idx` ON `valuationRequests` (`vendorId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `valuationRequests` (`status`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `agentSubscriptions` (`status`);--> statement-breakpoint
CREATE INDEX `vendor_idx` ON `properties` (`vendorId`);--> statement-breakpoint
ALTER TABLE `agentSubscriptions` DROP COLUMN `startDate`;--> statement-breakpoint
ALTER TABLE `agentSubscriptions` DROP COLUMN `endDate`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `title`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `propertyType`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `listingMethod`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `videoUrl`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `videoThumbnailUrl`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `images`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `ownerId`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `agentId`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `viewCount`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `inquiryCount`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `soldAt`;--> statement-breakpoint
ALTER TABLE `savedSearches` DROP COLUMN `city`;--> statement-breakpoint
ALTER TABLE `savedSearches` DROP COLUMN `minPrice`;--> statement-breakpoint
ALTER TABLE `savedSearches` DROP COLUMN `maxPrice`;--> statement-breakpoint
ALTER TABLE `savedSearches` DROP COLUMN `minBedrooms`;--> statement-breakpoint
ALTER TABLE `savedSearches` DROP COLUMN `maxBedrooms`;--> statement-breakpoint
ALTER TABLE `savedSearches` DROP COLUMN `propertyTypes`;