CREATE TABLE `property_address_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`addressNumber` varchar(20),
	`addressStreet` varchar(255),
	`addressArea` varchar(100),
	`addressTown` varchar(100),
	`addressCounty` varchar(100),
	`addressPostcode` varchar(10),
	`changeReason` varchar(100),
	`changeSource` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	CONSTRAINT `property_address_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_epc_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`epcRating` varchar(1),
	`epcScore` int,
	`floorAreaSqm` decimal(10,2),
	`epcSource` varchar(50),
	`epcReferenceNumber` varchar(50),
	`epcValidFrom` timestamp,
	`epcValidUntil` timestamp,
	`sourceFreshnessAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `property_epc_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_geospatial_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`lsoaCode` varchar(20),
	`msoaCode` varchar(20),
	`councilWard` varchar(100),
	`parliamentaryConstituency` varchar(100),
	`schoolsNearby` int,
	`parksNearby` int,
	`hospitalsNearby` int,
	`publicTransportNearby` int,
	`averagePricePerSqm` decimal(10,2),
	`priceTrend3m` decimal(5,2),
	`priceTrend12m` decimal(5,2),
	`sourceType` varchar(50),
	`sourceFreshnessAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `property_geospatial_data_id` PRIMARY KEY(`id`),
	CONSTRAINT `property_geospatial_data_propertyId_unique` UNIQUE(`propertyId`)
);
--> statement-breakpoint
CREATE TABLE `property_sold_prices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`salePrice` decimal(12,2) NOT NULL,
	`saleDate` timestamp NOT NULL,
	`transactionType` varchar(50),
	`lrTransactionId` varchar(100),
	`sourceType` varchar(50),
	`sourceFreshnessAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `property_sold_prices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_source_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`sourceType` varchar(50) NOT NULL,
	`sourceId` varchar(255) NOT NULL,
	`confidence` int NOT NULL,
	`matchScore` decimal(5,2),
	`matchMethod` varchar(50),
	`sourceDataSnapshot` json,
	`sourceFreshnessAt` timestamp,
	`sourceVerifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `property_source_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_source_link` UNIQUE(`propertyId`,`sourceType`,`sourceId`)
);
--> statement-breakpoint
CREATE TABLE `property_valuations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`broadValuationLow` decimal(12,2),
	`broadValuationHigh` decimal(12,2),
	`refinedValuationLow` decimal(12,2),
	`refinedValuationHigh` decimal(12,2),
	`overallConfidence` int,
	`confidenceReasons` json,
	`layer1Contribution` int,
	`layer2Contribution` int,
	`layer3Contribution` int,
	`layer4Contribution` int,
	`sellerImprovements` json,
	`isLocked` boolean DEFAULT false,
	`lockedUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `property_valuations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `title` varchar(255);--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `address` text;--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `city` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `postcode` varchar(20);--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `price` decimal(12,2);--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `propertyType` enum('house','flat','townhouse','bungalow','detached','semi-detached','terraced','apartment','condo','land','commercial') NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `ownerId` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `addressNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `properties` ADD `addressStreet` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` ADD `addressArea` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `addressTown` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` ADD `addressCounty` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `addressPostcode` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` ADD `postcodeOutcode` varchar(4) NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` ADD `postcodeSector` varchar(6) NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` ADD `localAuthority` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `region` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `country` varchar(50) DEFAULT 'UK';--> statement-breakpoint
ALTER TABLE `properties` ADD `uprn` bigint;--> statement-breakpoint
ALTER TABLE `properties` ADD `uprn_confidence` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `uprn_verified_at` timestamp;--> statement-breakpoint
ALTER TABLE `properties` ADD `receptions` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `floorAreaSqm` decimal(10,2);--> statement-breakpoint
ALTER TABLE `properties` ADD `sourceType` varchar(50);--> statement-breakpoint
ALTER TABLE `properties` ADD `sourceConfidence` int DEFAULT 50;--> statement-breakpoint
ALTER TABLE `properties` ADD `sourceFreshnessAt` timestamp;--> statement-breakpoint
ALTER TABLE `properties` ADD `isAnonymised` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `properties` ADD `anonymisationLevel` varchar(20);--> statement-breakpoint
ALTER TABLE `properties` ADD `sellerId` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `sellerPropertyReference` varchar(255);--> statement-breakpoint
ALTER TABLE `properties` ADD `isDeleted` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `createdBy` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `updatedBy` int;--> statement-breakpoint
ALTER TABLE `properties` ADD CONSTRAINT `properties_uprn_unique` UNIQUE(`uprn`);--> statement-breakpoint
CREATE INDEX `property_id_idx` ON `property_address_history` (`propertyId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `property_address_history` (`createdAt`);--> statement-breakpoint
CREATE INDEX `property_id_idx` ON `property_epc_links` (`propertyId`);--> statement-breakpoint
CREATE INDEX `epc_rating_idx` ON `property_epc_links` (`epcRating`);--> statement-breakpoint
CREATE INDEX `property_id_idx` ON `property_geospatial_data` (`propertyId`);--> statement-breakpoint
CREATE INDEX `property_id_idx` ON `property_sold_prices` (`propertyId`);--> statement-breakpoint
CREATE INDEX `sale_date_idx` ON `property_sold_prices` (`saleDate`);--> statement-breakpoint
CREATE INDEX `property_id_idx` ON `property_source_links` (`propertyId`);--> statement-breakpoint
CREATE INDEX `source_type_idx` ON `property_source_links` (`sourceType`);--> statement-breakpoint
CREATE INDEX `source_id_idx` ON `property_source_links` (`sourceId`);--> statement-breakpoint
CREATE INDEX `confidence_idx` ON `property_source_links` (`confidence`);--> statement-breakpoint
CREATE INDEX `property_id_idx` ON `property_valuations` (`propertyId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `property_valuations` (`createdAt`);--> statement-breakpoint
CREATE INDEX `is_locked_idx` ON `property_valuations` (`isLocked`);--> statement-breakpoint
CREATE INDEX `signal_idx` ON `agent_interest_expressions` (`earlyLeadSignalId`);--> statement-breakpoint
CREATE INDEX `postcode_idx` ON `properties` (`addressPostcode`);--> statement-breakpoint
CREATE INDEX `postcode_sector_idx` ON `properties` (`postcodeSector`);--> statement-breakpoint
CREATE INDEX `coordinates_idx` ON `properties` (`latitude`,`longitude`);--> statement-breakpoint
CREATE INDEX `uprn_idx` ON `properties` (`uprn`);--> statement-breakpoint
CREATE INDEX `seller_idx` ON `properties` (`sellerId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `properties` (`createdAt`);--> statement-breakpoint
ALTER TABLE `agent_interest_expressions` DROP COLUMN `updatedAt`;