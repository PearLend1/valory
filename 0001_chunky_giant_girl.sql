CREATE TABLE `agentSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`tier` enum('basic','premium') NOT NULL DEFAULT 'basic',
	`status` enum('active','inactive','cancelled') NOT NULL DEFAULT 'active',
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `agentSubscriptions_agentId_unique` UNIQUE(`agentId`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`address` text NOT NULL,
	`city` varchar(100) NOT NULL,
	`postcode` varchar(20) NOT NULL,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`price` decimal(12,2) NOT NULL,
	`bedrooms` int,
	`bathrooms` int,
	`squareFeet` int,
	`propertyType` enum('house','apartment','condo','townhouse','land','commercial') NOT NULL,
	`status` enum('active','pending','sold','withdrawn') NOT NULL DEFAULT 'active',
	`listingMethod` enum('agent','self','hybrid') NOT NULL DEFAULT 'agent',
	`videoUrl` text,
	`videoThumbnailUrl` text,
	`images` text,
	`ownerId` int NOT NULL,
	`agentId` int,
	`viewCount` int NOT NULL DEFAULT 0,
	`inquiryCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`soldAt` timestamp,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`date` timestamp NOT NULL DEFAULT (now()),
	`views` int NOT NULL DEFAULT 0,
	`inquiries` int NOT NULL DEFAULT 0,
	`saves` int NOT NULL DEFAULT 0,
	`videoPlays` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedProperties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`propertyId` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedProperties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedSearches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`city` varchar(100),
	`minPrice` decimal(12,2),
	`maxPrice` decimal(12,2),
	`minBedrooms` int,
	`maxBedrooms` int,
	`propertyTypes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedSearches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `valuations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int,
	`requesterId` int NOT NULL,
	`address` text NOT NULL,
	`city` varchar(100) NOT NULL,
	`postcode` varchar(20) NOT NULL,
	`bedrooms` int,
	`bathrooms` int,
	`squareFeet` int,
	`propertyType` enum('house','apartment','condo','townhouse','land','commercial') NOT NULL,
	`estimatedPriceLow` decimal(12,2) NOT NULL,
	`estimatedPriceHigh` decimal(12,2) NOT NULL,
	`confidenceLevel` enum('low','medium','high') NOT NULL,
	`reasoning` text,
	`status` enum('pending','completed','accepted','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `valuations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendorAgentConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`agentId` int NOT NULL,
	`valuationId` int,
	`propertyId` int,
	`status` enum('pending','accepted','rejected','completed') NOT NULL DEFAULT 'pending',
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendorAgentConnections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('buyer','vendor','agent','admin') NOT NULL DEFAULT 'buyer';--> statement-breakpoint
CREATE INDEX `agent_idx` ON `agentSubscriptions` (`agentId`);--> statement-breakpoint
CREATE INDEX `city_idx` ON `properties` (`city`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `properties` (`status`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `properties` (`ownerId`);--> statement-breakpoint
CREATE INDEX `agent_idx` ON `properties` (`agentId`);--> statement-breakpoint
CREATE INDEX `property_idx` ON `propertyAnalytics` (`propertyId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `propertyAnalytics` (`date`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `savedProperties` (`userId`);--> statement-breakpoint
CREATE INDEX `property_idx` ON `savedProperties` (`propertyId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `savedSearches` (`userId`);--> statement-breakpoint
CREATE INDEX `requester_idx` ON `valuations` (`requesterId`);--> statement-breakpoint
CREATE INDEX `property_idx` ON `valuations` (`propertyId`);--> statement-breakpoint
CREATE INDEX `vendor_idx` ON `vendorAgentConnections` (`vendorId`);--> statement-breakpoint
CREATE INDEX `agent_idx` ON `vendorAgentConnections` (`agentId`);--> statement-breakpoint
CREATE INDEX `valuation_idx` ON `vendorAgentConnections` (`valuationId`);