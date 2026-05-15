CREATE TABLE `agent_pricing_insights` (
`id` int AUTO_INCREMENT NOT NULL,
`agentId` int NOT NULL,
`postcode` varchar(20) NOT NULL,
`propertyType` enum('house','apartment','condo','townhouse','land','commercial') NOT NULL,
`pricePerSqft` decimal(10,2),
`marketTrend` enum('rising','stable','falling') NOT NULL,
`confidenceLevel` enum('low','medium','high') NOT NULL DEFAULT 'medium',
`notes` text,
`accuracy` decimal(5,2),
`submissionsCount` int NOT NULL DEFAULT 1,
`createdAt` timestamp NOT NULL DEFAULT (now()),
`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT `agent_pricing_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_market_adjustments` (
`id` int AUTO_INCREMENT NOT NULL,
`agentId` int NOT NULL,
`propertyId` int NOT NULL,
`adjustmentType` enum('location_premium','condition_adjustment','market_timing','buyer_profile','launch_strategy') NOT NULL,
`adjustmentPercentage` decimal(6,2) NOT NULL,
`reasoning` text,
`launchStrategy` enum('premium_positioning','value_positioning','quick_sale','market_test'),
`targetBuyerProfile` text,
`createdAt` timestamp NOT NULL DEFAULT (now()),
CONSTRAINT `agent_market_adjustments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_engagement_metrics` (
`id` int AUTO_INCREMENT NOT NULL,
`propertyId` int NOT NULL,
`viewingVelocity` decimal(8,2),
`viewingVelocityTrend` enum('accelerating','stable','decelerating'),
`saveCount` int NOT NULL DEFAULT 0,
`savesPerDay` decimal(8,2),
`inquiryCount` int NOT NULL DEFAULT 0,
`inquiriesPerDay` decimal(8,2),
`offerCount` int NOT NULL DEFAULT 0,
`offerConversionRate` decimal(5,2),
`averageOfferPrice` decimal(12,2),
`priceChangeCount` int NOT NULL DEFAULT 0,
`averagePriceAdjustment` decimal(6,2),
`timeOnMarket` int,
`engagementScore` decimal(5,2),
`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
`createdAt` timestamp NOT NULL DEFAULT (now()),
CONSTRAINT `property_engagement_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `valuation_outcomes` (
`id` int AUTO_INCREMENT NOT NULL,
`valuationRequestId` int NOT NULL,
`propertyId` int NOT NULL,
`estimatedPriceLow` decimal(12,2) NOT NULL,
`estimatedPriceHigh` decimal(12,2) NOT NULL,
`estimatedMidpoint` decimal(12,2) NOT NULL,
`actualSalePrice` decimal(12,2),
`listingPrice` decimal(12,2),
`accuracy` decimal(6,2),
`dataSourcesUsed` json,
`confidenceAtValuation` enum('low','medium','high') NOT NULL,
`valuationDate` timestamp NOT NULL,
`saleDate` timestamp,
`daysToSale` int,
`createdAt` timestamp NOT NULL DEFAULT (now()),
CONSTRAINT `valuation_outcomes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `valuation_data_sources` (
`id` int AUTO_INCREMENT NOT NULL,
`valuationRequestId` int NOT NULL,
`propertyId` int NOT NULL,
`sourceType` enum('public_data','api_data','agent_intelligence','platform_native') NOT NULL,
`sourceDetail` varchar(255),
`contribution` decimal(5,2) NOT NULL,
`dataPoints` int,
`confidence` enum('low','medium','high') NOT NULL,
`createdAt` timestamp NOT NULL DEFAULT (now()),
CONSTRAINT `valuation_data_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `agent_idx` ON `agent_pricing_insights` (`agentId`);
--> statement-breakpoint
CREATE INDEX `postcode_idx` ON `agent_pricing_insights` (`postcode`);
--> statement-breakpoint
CREATE INDEX `agent_idx` ON `agent_market_adjustments` (`agentId`);
--> statement-breakpoint
CREATE INDEX `property_idx` ON `agent_market_adjustments` (`propertyId`);
--> statement-breakpoint
CREATE INDEX `property_idx` ON `property_engagement_metrics` (`propertyId`);
--> statement-breakpoint
CREATE INDEX `property_idx` ON `valuation_outcomes` (`propertyId`);
--> statement-breakpoint
CREATE INDEX `valuation_idx` ON `valuation_outcomes` (`valuationRequestId`);
--> statement-breakpoint
CREATE INDEX `property_idx` ON `valuation_data_sources` (`propertyId`);
--> statement-breakpoint
CREATE INDEX `valuation_idx` ON `valuation_data_sources` (`valuationRequestId`);
--> statement-breakpoint
CREATE INDEX `source_type_idx` ON `valuation_data_sources` (`sourceType`);
