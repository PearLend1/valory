import { 
  bigint,
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  json,
  boolean,
  longtext,
  index,
  unique,
  primaryKey
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Roles: public (buyer), vendor, agent, admin
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["public", "vendor", "agent", "admin"]).default("public").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * VALORY Master Property Record
 * 
 * This is the authoritative property record owned by VALORY.
 * Every property gets a unique internal ID at creation.
 * UPRN is optional but important for official data linkage.
 * External sources (Rightmove, Zoopla, etc.) link to this master record.
 * 
 * Key principles:
 * - VALORY owns the master property relationship with sellers/buyers/agents
 * - UPRN is optional (for new builds, commercial properties, etc.)
 * - Multiple external sources can link to one master record
 * - Address components support messy/inconsistent formats
 * - Supports valuation, EPC, sold-price, geography, and agent lead-state workflows
 */
export const properties = mysqlTable("properties", {
  // Master Identity
  id: int("id").autoincrement().primaryKey(),
  
  // Address Components (canonical/best-known version)
  addressNumber: varchar("addressNumber", { length: 20 }),
  addressStreet: varchar("addressStreet", { length: 255 }).notNull(),
  addressArea: varchar("addressArea", { length: 100 }),
  addressTown: varchar("addressTown", { length: 100 }).notNull(),
  addressCounty: varchar("addressCounty", { length: 100 }),
  addressPostcode: varchar("addressPostcode", { length: 10 }).notNull(),
  
  // Postcode Derived Fields
  postcodeOutcode: varchar("postcodeOutcode", { length: 4 }).notNull(),  // e.g., "SW1A" from "SW1A 1AA"
  postcodeSector: varchar("postcodeSector", { length: 6 }).notNull(),   // e.g., "SW1A 1" from "SW1A 1AA"
  
  // Geospatial
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  
  // Administrative Boundaries
  localAuthority: varchar("localAuthority", { length: 100 }),
  region: varchar("region", { length: 100 }),
  country: varchar("country", { length: 50 }).default("UK"),
  
  // UPRN (Optional)
  uprn: bigint("uprn", { mode: "number" }).unique(),
  uprn_confidence: int("uprn_confidence"),  // 0-100, confidence in UPRN linkage
  uprn_verified_at: timestamp("uprn_verified_at"),
  
  // Property Characteristics
  propertyType: mysqlEnum("propertyType", ["house", "flat", "townhouse", "bungalow", "detached", "semi-detached", "terraced", "apartment", "condo", "land", "commercial"]).notNull(),
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  receptions: int("receptions"),
  floorAreaSqm: decimal("floorAreaSqm", { precision: 10, scale: 2 }),
  
  // Source Provenance
  sourceType: varchar("sourceType", { length: 50 }),  // seller-submitted, uprn-lookup, postcode-lookup
  sourceConfidence: int("sourceConfidence").default(50),  // 0-100
  sourceFreshnessAt: timestamp("sourceFreshnessAt"),
  
  // Anonymisation & Privacy
  isAnonymised: boolean("isAnonymised").default(true),  // For area-level visibility before full reveal
  anonymisationLevel: varchar("anonymisationLevel", { length: 20 }),  // postcode-sector, postcode-outcode, area
  
  // Seller Linkage
  sellerId: int("sellerId"),  // References vendors table
  sellerPropertyReference: varchar("sellerPropertyReference", { length: 255 }),  // Seller's own reference
  
  // Legacy fields (for backwards compatibility)
  title: varchar("title", { length: 255 }),
  description: text("description"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  postcode: varchar("postcode", { length: 20 }),
  price: decimal("price", { precision: 12, scale: 2 }),
  squareFeet: int("squareFeet"),
  status: mysqlEnum("status", ["active", "pending", "sold", "withdrawn"]).default("active").notNull(),
  listingMethod: mysqlEnum("listingMethod", ["agent", "self", "hybrid"]).default("agent").notNull(),
  videoUrl: text("videoUrl"),
  videoThumbnailUrl: text("videoThumbnailUrl"),
  images: text("images"), // JSON array of image URLs
  ownerId: int("ownerId"),
  agentId: int("agentId"),
  viewCount: int("viewCount").default(0).notNull(),
  inquiryCount: int("inquiryCount").default(0).notNull(),
  
  // Soft Delete & Audit
  isDeleted: boolean("isDeleted").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  soldAt: timestamp("soldAt"),
  createdBy: int("createdBy"),
  updatedBy: int("updatedBy"),
}, (table) => ({
  postcodeIdx: index("postcode_idx").on(table.addressPostcode),
  postcodeSectorIdx: index("postcode_sector_idx").on(table.postcodeSector),
  coordinatesIdx: index("coordinates_idx").on(table.latitude, table.longitude),
  uprn_idx: index("uprn_idx").on(table.uprn),
  sellerIdx: index("seller_idx").on(table.sellerId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  cityIdx: index("city_idx").on(table.city),
  statusIdx: index("status_idx").on(table.status),
}));

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

/**
 * External Source Linking
 * 
 * Links external identifiers (UPRN, Rightmove ID, Zoopla ID, etc.) to master properties.
 * Supports multi-source linking with confidence scoring and freshness tracking.
 * Enables deduplication and record merging logic.
 */
export const propertySourceLinks = mysqlTable("property_source_links", {
  // Link Identity
  id: int("id").autoincrement().primaryKey(),
  
  // Master Property Reference
  propertyId: int("propertyId").notNull(),
  
  // External Source
  sourceType: varchar("sourceType", { length: 50 }).notNull(),  // uprn, rightmove, zoopla, land-registry, epc, etc.
  sourceId: varchar("sourceId", { length: 255 }).notNull(),   // External identifier
  
  // Linkage Confidence
  confidence: int("confidence").notNull(),  // 0-100, how confident is this linkage
  matchScore: decimal("matchScore", { precision: 5, scale: 2 }),     // 0-100, similarity score
  matchMethod: varchar("matchMethod", { length: 50 }),      // exact, postcode-address, coordinates, manual
  
  // Source Data Snapshot
  sourceDataSnapshot: json("sourceDataSnapshot"),  // Full source record at time of linking
  
  // Provenance
  sourceFreshnessAt: timestamp("sourceFreshnessAt"),
  sourceVerifiedAt: timestamp("sourceVerifiedAt"),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
}, (table) => ({
  propertyIdx: index("property_id_idx").on(table.propertyId),
  sourceTypeIdx: index("source_type_idx").on(table.sourceType),
  sourceIdIdx: index("source_id_idx").on(table.sourceId),
  confidenceIdx: index("confidence_idx").on(table.confidence),
  uniqueSourceLink: unique("unique_source_link").on(table.propertyId, table.sourceType, table.sourceId),
}));

export type PropertySourceLink = typeof propertySourceLinks.$inferSelect;
export type InsertPropertySourceLink = typeof propertySourceLinks.$inferInsert;

/**
 * Property Address History & Audit Trail
 * 
 * Tracks all address changes with reason and source for full audit trail.
 */
export const propertyAddressHistory = mysqlTable("property_address_history", {
  // History Record
  id: int("id").autoincrement().primaryKey(),
  
  // Master Property Reference
  propertyId: int("propertyId").notNull(),
  
  // Address Snapshot
  addressNumber: varchar("addressNumber", { length: 20 }),
  addressStreet: varchar("addressStreet", { length: 255 }),
  addressArea: varchar("addressArea", { length: 100 }),
  addressTown: varchar("addressTown", { length: 100 }),
  addressCounty: varchar("addressCounty", { length: 100 }),
  addressPostcode: varchar("addressPostcode", { length: 10 }),
  
  // Change Reason
  changeReason: varchar("changeReason", { length: 100 }),  // seller-update, source-correction, deduplication, etc.
  changeSource: varchar("changeSource", { length: 50 }),   // seller, uprn-lookup, postcode-lookup, admin
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
}, (table) => ({
  propertyIdx: index("property_id_idx").on(table.propertyId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type PropertyAddressHistory = typeof propertyAddressHistory.$inferSelect;
export type InsertPropertyAddressHistory = typeof propertyAddressHistory.$inferInsert;

/**
 * Property Geospatial Enrichment
 * 
 * Stores enriched geospatial data: administrative boundaries, amenity counts, market data.
 */
export const propertyGeospatialData = mysqlTable("property_geospatial_data", {
  // Enrichment Record
  id: int("id").autoincrement().primaryKey(),
  
  // Master Property Reference
  propertyId: int("propertyId").notNull().unique(),
  
  // Administrative Boundaries
  lsoaCode: varchar("lsoaCode", { length: 20 }),  // Lower Layer Super Output Area
  msoaCode: varchar("msoaCode", { length: 20 }),  // Middle Layer Super Output Area
  councilWard: varchar("councilWard", { length: 100 }),
  parliamentaryConstituency: varchar("parliamentaryConstituency", { length: 100 }),
  
  // Amenity Counts (from OpenStreetMap)
  schoolsNearby: int("schoolsNearby"),
  parksNearby: int("parksNearby"),
  hospitalsNearby: int("hospitalsNearby"),
  publicTransportNearby: int("publicTransportNearby"),
  
  // Market Data
  averagePricePerSqm: decimal("averagePricePerSqm", { precision: 10, scale: 2 }),
  priceTrend3m: decimal("priceTrend3m", { precision: 5, scale: 2 }),  // Percentage change
  priceTrend12m: decimal("priceTrend12m", { precision: 5, scale: 2 }),
  
  // Source Provenance
  sourceType: varchar("sourceType", { length: 50 }),
  sourceFreshnessAt: timestamp("sourceFreshnessAt"),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  propertyIdx: index("property_id_idx").on(table.propertyId),
}));

export type PropertyGeospatialData = typeof propertyGeospatialData.$inferSelect;
export type InsertPropertyGeospatialData = typeof propertyGeospatialData.$inferInsert;

/**
 * Property EPC Links
 * 
 * Links EPC (Energy Performance Certificate) data to master properties.
 */
export const propertyEpcLinks = mysqlTable("property_epc_links", {
  // EPC Link Record
  id: int("id").autoincrement().primaryKey(),
  
  // Master Property Reference
  propertyId: int("propertyId").notNull(),
  
  // EPC Data
  epcRating: varchar("epcRating", { length: 1 }),  // A-G
  epcScore: int("epcScore"),     // 0-100
  floorAreaSqm: decimal("floorAreaSqm", { precision: 10, scale: 2 }),
  
  // EPC Provenance
  epcSource: varchar("epcSource", { length: 50 }),  // epc-api, seller-provided, etc.
  epcReferenceNumber: varchar("epcReferenceNumber", { length: 50 }),
  epcValidFrom: timestamp("epcValidFrom"),
  epcValidUntil: timestamp("epcValidUntil"),
  
  // Source Freshness
  sourceFreshnessAt: timestamp("sourceFreshnessAt"),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  propertyIdx: index("property_id_idx").on(table.propertyId),
  epcRatingIdx: index("epc_rating_idx").on(table.epcRating),
}));

export type PropertyEpcLink = typeof propertyEpcLinks.$inferSelect;
export type InsertPropertyEpcLink = typeof propertyEpcLinks.$inferInsert;

/**
 * Property Sold Prices (Land Registry)
 * 
 * Historical sold prices linked to master properties for valuation learning.
 */
export const propertySoldPrices = mysqlTable("property_sold_prices", {
  // Sold Price Record
  id: int("id").autoincrement().primaryKey(),
  
  // Master Property Reference
  propertyId: int("propertyId").notNull(),
  
  // Sale Details
  salePrice: decimal("salePrice", { precision: 12, scale: 2 }).notNull(),
  saleDate: timestamp("saleDate").notNull(),
  transactionType: varchar("transactionType", { length: 50 }),  // standard, transfer, etc.
  
  // Land Registry Reference
  lrTransactionId: varchar("lrTransactionId", { length: 100 }),
  
  // Source Provenance
  sourceType: varchar("sourceType", { length: 50 }),  // land-registry, seller-provided
  sourceFreshnessAt: timestamp("sourceFreshnessAt"),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index("property_id_idx").on(table.propertyId),
  saleDateIdx: index("sale_date_idx").on(table.saleDate),
}));

export type PropertySoldPrice = typeof propertySoldPrices.$inferSelect;
export type InsertPropertySoldPrice = typeof propertySoldPrices.$inferInsert;

/**
 * Property Valuations
 * 
 * Stores valuation history with confidence scoring, layer contributions, and seller improvements.
 * Supports 12-month lock after seller acceptance.
 */
export const propertyValuations = mysqlTable("property_valuations", {
  // Valuation Record
  id: int("id").autoincrement().primaryKey(),
  
  // Master Property Reference
  propertyId: int("propertyId").notNull(),
  
  // Valuation Brackets
  broadValuationLow: decimal("broadValuationLow", { precision: 12, scale: 2 }),
  broadValuationHigh: decimal("broadValuationHigh", { precision: 12, scale: 2 }),
  refinedValuationLow: decimal("refinedValuationLow", { precision: 12, scale: 2 }),
  refinedValuationHigh: decimal("refinedValuationHigh", { precision: 12, scale: 2 }),
  
  // Confidence
  overallConfidence: int("overallConfidence"),  // 0-100
  confidenceReasons: json("confidenceReasons"),     // Array of confidence factors
  
  // Layer Contributions
  layer1Contribution: int("layer1Contribution"),  // Official data %
  layer2Contribution: int("layer2Contribution"),  // Commercial data %
  layer3Contribution: int("layer3Contribution"),  // Agent intelligence %
  layer4Contribution: int("layer4Contribution"),  // VALORY-native data %
  
  // Seller Improvements
  sellerImprovements: json("sellerImprovements"),  // Array of improvements and estimated values
  
  // Status
  isLocked: boolean("isLocked").default(false),  // 12-month lock after acceptance
  lockedUntil: timestamp("lockedUntil"),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
}, (table) => ({
  propertyIdx: index("property_id_idx").on(table.propertyId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  isLockedIdx: index("is_locked_idx").on(table.isLocked),
}));

export type PropertyValuation = typeof propertyValuations.$inferSelect;
export type InsertPropertyValuation = typeof propertyValuations.$inferInsert;

/**
 * Valuation requests from vendors (legacy, for backwards compatibility)
 */
export const valuationRequests = mysqlTable("valuationRequests", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),
  propertyId: int("propertyId"),
  propertyData: json("propertyData"), // Fallback if property not yet created
  status: mysqlEnum("status", ["pending", "accepted", "rejected"]).default("pending").notNull(),
  estimatedPriceLow: decimal("estimatedPriceLow", { precision: 12, scale: 2 }),
  estimatedPriceHigh: decimal("estimatedPriceHigh", { precision: 12, scale: 2 }),
  confidence: mysqlEnum("confidence", ["low", "medium", "high"]).default("medium"),
  reasoning: longtext("reasoning"),
  acceptedAt: timestamp("acceptedAt"),
  lockedUntil: timestamp("lockedUntil"),
  estimatedMidpoint: decimal("estimatedMidpoint", { precision: 12, scale: 2 }),
  leadState: mysqlEnum("leadState", ["REGISTERED", "PROFILE_IN_PROGRESS", "ACCEPTED_VALUATION", "READY_FOR_AGENT_MATCH"]),
  propertyBasics: json("propertyBasics"), // {propertyType, bedrooms, bathrooms, receptionRooms, sqft, tenure}
  propertyFeatures: json("propertyFeatures"), // {condition, epcRating, features[], improvements}
  hasPhotos: boolean("hasPhotos").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  vendorIdx: index("vendor_idx").on(table.vendorId),
  statusIdx: index("status_idx").on(table.status),
  leadStateIdx: index("lead_state_idx").on(table.leadState),
}));

export type ValuationRequest = typeof valuationRequests.$inferSelect;
export type InsertValuationRequest = typeof valuationRequests.$inferInsert;

/**
 * Vendor route-to-market selection
 */
export const routeToMarket = mysqlTable("routeToMarket", {
  id: int("id").autoincrement().primaryKey(),
  valuationId: int("valuationId").notNull().unique(),
  vendorId: int("vendorId").notNull(),
  method: mysqlEnum("method", ["agent-led", "self-list", "hybrid"]).notNull(),
  selectedAgentId: int("selectedAgentId"), // For agent-led or hybrid
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  vendorIdx: index("vendor_idx").on(table.vendorId),
  valuationIdx: index("valuation_idx").on(table.valuationId),
}));

export type RouteToMarket = typeof routeToMarket.$inferSelect;
export type InsertRouteToMarket = typeof routeToMarket.$inferInsert;

/**
 * Vendor consent for agent contact
 */
export const vendorConsent = mysqlTable("vendorConsent", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull().unique(),
  allowAgentContact: boolean("allowAgentContact").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VendorConsent = typeof vendorConsent.$inferSelect;
export type InsertVendorConsent = typeof vendorConsent.$inferInsert;

/**
 * Agent subscriptions
 */
export const agentSubscriptions = mysqlTable("agentSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull().unique(),
  tier: mysqlEnum("tier", ["tier1", "tier2"]).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "cancelled"]).default("active").notNull(),
  renewalDate: timestamp("renewalDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  agentIdx: index("agent_idx").on(table.agentId),
  statusIdx: index("status_idx").on(table.status),
}));

export type AgentSubscription = typeof agentSubscriptions.$inferSelect;
export type InsertAgentSubscription = typeof agentSubscriptions.$inferInsert;

/**
 * Property launch videos
 */
export const launchVideos = mysqlTable("launchVideos", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  agentId: int("agentId").notNull(),
  templateType: mysqlEnum("templateType", ["agent-intro", "property-showcase", "hybrid"]).notNull(),
  durationType: mysqlEnum("durationType", ["30s", "90s"]).notNull(),
  videoUrl: varchar("videoUrl", { length: 512 }).notNull(),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  publishedAt: timestamp("publishedAt"),
}, (table) => ({
  propertyIdx: index("property_idx").on(table.propertyId),
  agentIdx: index("agent_idx").on(table.agentId),
  statusIdx: index("status_idx").on(table.status),
}));

export type LaunchVideo = typeof launchVideos.$inferSelect;
export type InsertLaunchVideo = typeof launchVideos.$inferInsert;

/**
 * Analytics bolt-on subscriptions per property
 */
export const propertyAnalyticsSubscriptions = mysqlTable("propertyAnalyticsSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull().unique(),
  agentId: int("agentId").notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  renewalDate: timestamp("renewalDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index("property_idx").on(table.propertyId),
  agentIdx: index("agent_idx").on(table.agentId),
}));

export type PropertyAnalyticsSubscription = typeof propertyAnalyticsSubscriptions.$inferSelect;
export type InsertPropertyAnalyticsSubscription = typeof propertyAnalyticsSubscriptions.$inferInsert;

/**
 * Analytics events for launch performance tracking
 */
export const analyticsEvents = mysqlTable("analyticsEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  propertyId: int("propertyId").notNull(),
  launchVideoId: int("launchVideoId"),
  eventType: mysqlEnum("eventType", [
    "impression",
    "view",
    "watch_complete",
    "save",
    "enquiry",
    "contact_request"
  ]).notNull(),
  watchTimeSeconds: int("watchTimeSeconds"), // For view events
  completionRate: decimal("completionRate", { precision: 5, scale: 2 }), // 0-100%
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index("property_idx").on(table.propertyId),
  launchIdx: index("launch_idx").on(table.launchVideoId),
  eventTypeIdx: index("event_type_idx").on(table.eventType),
}));

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Saved properties (buyer watch lists)
 */
export const savedProperties = mysqlTable("savedProperties", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  propertyId: int("propertyId").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  propertyIdx: index("property_idx").on(table.propertyId),
}));

export type SavedProperty = typeof savedProperties.$inferSelect;
export type InsertSavedProperty = typeof savedProperties.$inferInsert;

/**
 * Saved searches (buyer search preferences)
 */
export const savedSearches = mysqlTable("savedSearches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  filtersJson: json("filtersJson").notNull(), // {city, type, minPrice, maxPrice, minBeds, etc}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export type SavedSearch = typeof savedSearches.$inferSelect;
export type InsertSavedSearch = typeof savedSearches.$inferInsert;

/**
 * Audit log for sensitive operations
 */
export const auditLog = mysqlTable("auditLog", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  vendorId: int("vendorId").notNull(),
  action: mysqlEnum("action", [
    "view_contact_details",
    "request_contact",
    "accept_contact",
    "reject_contact"
  ]).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  agentIdx: index("agent_idx").on(table.agentId),
  vendorIdx: index("vendor_idx").on(table.vendorId),
  actionIdx: index("action_idx").on(table.action),
}));

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type InsertAuditLogEntry = typeof auditLog.$inferInsert;

/**
 * Property timeline events for momentum tracking
 * Tracks all significant property events: launches, viewings, offers, price changes, etc.
 */
export const propertyTimelineEvents = mysqlTable("property_timeline_events", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  eventType: mysqlEnum("eventType", [
    "LAUNCHED",
    "VIEWING_BOOKED",
    "VIEWING_MILESTONE",
    "MEDIA_UPDATED",
    "PRICE_CHANGED",
    "OFFER_RECEIVED",
    "UNDER_OFFER",
    "OFFER_FELL_THROUGH",
    "BACK_ON_MARKET",
    "SOLD"
  ]).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  details: json("details"), // Flexible JSON for event-specific data
  agentId: int("agentId"), // Optional: agent who created the event
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index("property_idx").on(table.propertyId),
  agentIdx: index("agent_idx").on(table.agentId),
  eventTypeIdx: index("event_type_idx").on(table.eventType),
}));

export type PropertyTimelineEvent = typeof propertyTimelineEvents.$inferSelect;
export type InsertPropertyTimelineEvent = typeof propertyTimelineEvents.$inferInsert;

/**
 * Follow/saved properties for real-time momentum tracking
 */
export const followProperties = mysqlTable("follow_properties", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  propertyId: int("propertyId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  propertyIdx: index("property_idx").on(table.propertyId),
}));

export type FollowProperty = typeof followProperties.$inferSelect;
export type InsertFollowProperty = typeof followProperties.$inferInsert;

/**
 * In-app notifications for property updates
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  propertyId: int("propertyId").notNull(),
  eventId: int("eventId").notNull(), // Reference to property_timeline_events
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  propertyIdx: index("property_idx").on(table.propertyId),
  isReadIdx: index("is_read_idx").on(table.isRead),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;


/**
 * Agent pricing intelligence and market insights
 * Agents contribute local market knowledge to improve valuations
 */
export const agentPricingInsights = mysqlTable("agent_pricing_insights", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  postcode: varchar("postcode", { length: 20 }).notNull(),
  propertyType: mysqlEnum("propertyType", ["house", "apartment", "condo", "townhouse", "land", "commercial"]).notNull(),
  pricePerSqft: decimal("pricePerSqft", { precision: 10, scale: 2 }),
  marketTrend: mysqlEnum("marketTrend", ["rising", "stable", "falling"]).notNull(),
  confidenceLevel: mysqlEnum("confidenceLevel", ["low", "medium", "high"]).default("medium").notNull(),
  notes: text("notes"),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }), // Tracked over time (0-100%)
  submissionsCount: int("submissionsCount").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  agentIdx: index("agent_idx").on(table.agentId),
  postcodeIdx: index("postcode_idx").on(table.postcode),
}));

export type AgentPricingInsight = typeof agentPricingInsights.$inferSelect;
export type InsertAgentPricingInsight = typeof agentPricingInsights.$inferInsert;

/**
 * Market adjustments from agent experience
 * Captures location-specific adjustments and launch strategy signals
 */
export const agentMarketAdjustments = mysqlTable("agent_market_adjustments", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  propertyId: int("propertyId").notNull(),
  adjustmentType: mysqlEnum("adjustmentType", [
    "location_premium",
    "condition_adjustment",
    "market_timing",
    "buyer_profile",
    "launch_strategy"
  ]).notNull(),
  adjustmentPercentage: decimal("adjustmentPercentage", { precision: 6, scale: 2 }).notNull(), // Can be negative
  reasoning: text("reasoning"),
  launchStrategy: mysqlEnum("launchStrategy", ["premium_positioning", "value_positioning", "quick_sale", "market_test"]),
  targetBuyerProfile: text("targetBuyerProfile"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  agentIdx: index("agent_idx").on(table.agentId),
  propertyIdx: index("property_idx").on(table.propertyId),
}));

export type AgentMarketAdjustment = typeof agentMarketAdjustments.$inferSelect;
export type InsertAgentMarketAdjustment = typeof agentMarketAdjustments.$inferInsert;

/**
 * Valory-native engagement metrics for valuation
 * Tracks platform-specific signals that indicate property value and market interest
 */
export const propertyEngagementMetrics = mysqlTable("property_engagement_metrics", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  viewingVelocity: decimal("viewingVelocity", { precision: 8, scale: 2 }), // Views per day
  viewingVelocityTrend: mysqlEnum("viewingVelocityTrend", ["accelerating", "stable", "decelerating"]),
  saveCount: int("saveCount").default(0).notNull(),
  savesPerDay: decimal("savesPerDay", { precision: 8, scale: 2 }),
  inquiryCount: int("inquiryCount").default(0).notNull(),
  inquiriesPerDay: decimal("inquiriesPerDay", { precision: 8, scale: 2 }),
  offerCount: int("offerCount").default(0).notNull(),
  offerConversionRate: decimal("offerConversionRate", { precision: 5, scale: 2 }), // 0-100%
  averageOfferPrice: decimal("averageOfferPrice", { precision: 12, scale: 2 }),
  priceChangeCount: int("priceChangeCount").default(0).notNull(),
  averagePriceAdjustment: decimal("averagePriceAdjustment", { precision: 6, scale: 2 }), // Percentage
  timeOnMarket: int("timeOnMarket"), // Days
  engagementScore: decimal("engagementScore", { precision: 5, scale: 2 }), // 0-100 composite score
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index("property_idx").on(table.propertyId),
}));

export type PropertyEngagementMetrics = typeof propertyEngagementMetrics.$inferSelect;
export type InsertPropertyEngagementMetrics = typeof propertyEngagementMetrics.$inferInsert;

/**
 * Valuation outcomes and learning data
 * Tracks how valuations compare to actual sale prices for continuous learning
 */
export const valuationOutcomes = mysqlTable("valuation_outcomes", {
  id: int("id").autoincrement().primaryKey(),
  valuationRequestId: int("valuationRequestId").notNull(),
  propertyId: int("propertyId").notNull(),
  estimatedPriceLow: decimal("estimatedPriceLow", { precision: 12, scale: 2 }).notNull(),
  estimatedPriceHigh: decimal("estimatedPriceHigh", { precision: 12, scale: 2 }).notNull(),
  estimatedMidpoint: decimal("estimatedMidpoint", { precision: 12, scale: 2 }).notNull(),
  actualSalePrice: decimal("actualSalePrice", { precision: 12, scale: 2 }),
  listingPrice: decimal("listingPrice", { precision: 12, scale: 2 }),
  accuracy: decimal("accuracy", { precision: 6, scale: 2 }), // Percentage deviation from actual
  dataSourcesUsed: json("dataSourcesUsed"), // {public: true, api: true, agent: true, platform: true}
  confidenceAtValuation: mysqlEnum("confidenceAtValuation", ["low", "medium", "high"]).notNull(),
  valuationDate: timestamp("valuationDate").notNull(),
  saleDate: timestamp("saleDate"),
  daysToSale: int("daysToSale"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index("property_idx").on(table.propertyId),
  valuationIdx: index("valuation_idx").on(table.valuationRequestId),
}));

export type ValuationOutcome = typeof valuationOutcomes.$inferSelect;
export type InsertValuationOutcome = typeof valuationOutcomes.$inferInsert;

/**
 * Valuation data source tracking
 * Tracks which data sources contributed to each valuation for transparency
 */
export const valuationDataSources = mysqlTable("valuation_data_sources", {
  id: int("id").autoincrement().primaryKey(),
  valuationRequestId: int("valuationRequestId").notNull(),
  propertyId: int("propertyId").notNull(),
  sourceType: mysqlEnum("sourceType", ["public_data", "api_data", "agent_intelligence", "platform_native"]).notNull(),
  sourceDetail: varchar("sourceDetail", { length: 255 }), // e.g., "Land Registry", "Zoopla", "Agent Insight", "Viewing Velocity"
  contribution: decimal("contribution", { precision: 5, scale: 2 }).notNull(), // Weight percentage
  dataPoints: int("dataPoints"), // Number of comparable data points used
  confidence: mysqlEnum("confidence", ["low", "medium", "high"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index("property_idx").on(table.propertyId),
  valuationIdx: index("valuation_idx").on(table.valuationRequestId),
  sourceTypeIdx: index("source_type_idx").on(table.sourceType),
}));

export type ValuationDataSource = typeof valuationDataSources.$inferSelect;
export type InsertValuationDataSource = typeof valuationDataSources.$inferInsert;


/**
 * Vendor launch profiles
 * Stores vendor-provided property details for market launch
 */
export const vendorLaunchProfiles = mysqlTable("vendor_launch_profiles", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),
  propertyId: int("propertyId").notNull(),
  images: json("images"), // [{url: string, caption?: string}]
  keyFeatures: json("keyFeatures"), // {bedrooms, bathrooms, garden, parking, etc.}
  condition: text("condition"), // Description of property condition
  improvements: json("improvements"), // [{item: string, year?: number}]
  marketingHighlights: text("marketingHighlights"), // Key selling points
  additionalMedia: json("additionalMedia"), // [{type: 'floor_plan'|'document'|'video', url: string, title?: string}]
  completionPercentage: int("completionPercentage").default(0), // 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  vendorIdx: index("vendor_idx").on(table.vendorId),
  propertyIdx: index("property_idx").on(table.propertyId),
}));

export type VendorLaunchProfile = typeof vendorLaunchProfiles.$inferSelect;
export type InsertVendorLaunchProfile = typeof vendorLaunchProfiles.$inferInsert;


/**
 * Vendor Lead States
 * 
 * Tracks the lead state progression for each vendor's property.
 * States: REGISTERED → PROFILE_IN_PROGRESS → ACCEPTED_VALUATION → READY_FOR_AGENT_MATCH
 */
export const vendorLeadStates = mysqlTable("vendor_lead_states", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),
  propertyId: int("propertyId").notNull(),
  state: mysqlEnum("state", ["REGISTERED", "PROFILE_IN_PROGRESS", "ACCEPTED_VALUATION", "READY_FOR_AGENT_MATCH", "PAUSED", "WITHDRAWN"]).default("REGISTERED").notNull(),
  stateChangedAt: timestamp("stateChangedAt").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  vendorIdx: index("vendor_idx").on(table.vendorId),
  propertyIdx: index("property_idx").on(table.propertyId),
  stateIdx: index("state_idx").on(table.state),
}));

export type VendorLeadState = typeof vendorLeadStates.$inferSelect;
export type InsertVendorLeadState = typeof vendorLeadStates.$inferInsert;

/**
 * Premium Early Lead Signals
 * 
 * Anonymised property opportunities shown to premium agents.
 * Provides early visibility without exposing vendor identity.
 */
export const premiumEarlyLeadSignals = mysqlTable("premium_early_lead_signals", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  vendorId: int("vendorId").notNull(),
  postcodeSector: varchar("postcodeSector", { length: 10 }).notNull(), // First 2-3 chars of postcode
  valuationBracketLow: decimal("valuationBracketLow", { precision: 12, scale: 2 }).notNull(),
  valuationBracketHigh: decimal("valuationBracketHigh", { precision: 12, scale: 2 }).notNull(),
  propertyType: varchar("propertyType", { length: 50 }).notNull(),
  readinessStage: mysqlEnum("readinessStage", ["EARLY_INTEREST", "PROFILE_BUILDING", "NEARLY_READY"]).notNull(),
  launchTiming: varchar("launchTiming", { length: 50 }), // "This week", "Next 2 weeks", "Next month"
  confidenceLevel: mysqlEnum("confidenceLevel", ["low", "medium", "high"]).notNull(),
  agentNotifications: int("agentNotifications").default(0), // Count of agents who clicked "Notify Me"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // Signal expires after 30 days
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  propertyIdx: index("property_idx").on(table.propertyId),
  vendorIdx: index("vendor_idx").on(table.vendorId),
  postcodeSectorIdx: index("postcode_sector_idx").on(table.postcodeSector),
  readinessIdx: index("readiness_idx").on(table.readinessStage),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  expiresAtIdx: index("expires_at_idx").on(table.expiresAt),
}));

export type PremiumEarlyLeadSignal = typeof premiumEarlyLeadSignals.$inferSelect;
export type InsertPremiumEarlyLeadSignal = typeof premiumEarlyLeadSignals.$inferInsert;

/**
 * Premium Agent Lead Notifications
 * 
 * Tracks which agents have opted to be notified when an early lead becomes ready.
 */
export const premiumAgentLeadNotifications = mysqlTable("premium_agent_lead_notifications", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  earlyLeadSignalId: int("earlyLeadSignalId").notNull(),
  notifiedAt: timestamp("notifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  agentIdx: index("agent_idx").on(table.agentId),
  signalIdx: index("signal_idx").on(table.earlyLeadSignalId),
}));

export type PremiumAgentLeadNotification = typeof premiumAgentLeadNotifications.$inferSelect;
export type InsertPremiumAgentLeadNotification = typeof premiumAgentLeadNotifications.$inferInsert;

/**
 * Lead State Audit Log
 * 
 * Tracks all state transitions for compliance and debugging.
 */
export const leadStateAuditLog = mysqlTable("lead_state_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),
  propertyId: int("propertyId").notNull(),
  previousState: varchar("previousState", { length: 50 }),
  newState: varchar("newState", { length: 50 }).notNull(),
  reason: text("reason"),
  triggeredBy: varchar("triggeredBy", { length: 50 }), // "vendor", "system", "admin"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  vendorIdx: index("vendor_idx").on(table.vendorId),
  propertyIdx: index("property_idx").on(table.propertyId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type LeadStateAuditLog = typeof leadStateAuditLog.$inferSelect;
export type InsertLeadStateAuditLog = typeof leadStateAuditLog.$inferInsert;

/**
 * Agent Interest Expressions
 * 
 * Tracks when agents express interest in an anonymised early lead.
 */
export const agentInterestExpressions = mysqlTable("agent_interest_expressions", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  valuationRequestId: int("valuationRequestId").notNull(),
  earlyLeadSignalId: int("earlyLeadSignalId"),
  status: mysqlEnum("status", ["expressed", "matched", "declined", "expired"]).default("expressed").notNull(),
  expressedAt: timestamp("expressedAt").defaultNow().notNull(),
  matchedAt: timestamp("matchedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  agentIdx: index("agent_idx").on(table.agentId),
  valuationIdx: index("valuation_idx").on(table.valuationRequestId),
  signalIdx: index("signal_idx").on(table.earlyLeadSignalId),
  statusIdx: index("status_idx").on(table.status),
}));

export type AgentInterestExpression = typeof agentInterestExpressions.$inferSelect;
export type InsertAgentInterestExpression = typeof agentInterestExpressions.$inferInsert;


/**
 * Agent Registrations
 * Captures agent/agency registration requests from /agents/register
 */
export const agentRegistrations = mysqlTable("agent_registrations", {
  id: int("id").primaryKey().autoincrement(),
  agencyName: varchar("agency_name", { length: 255 }).notNull(),
  branchPostcode: varchar("branch_postcode", { length: 20 }).notNull(),
  websiteUrl: varchar("website_url", { length: 500 }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  jobTitle: varchar("job_title", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  coverageArea: text("coverage_area").notNull(),
  tier: varchar("tier", { length: 20 }).notNull().default("standard"),
  status: varchar("status", { length: 50 }).notNull().default("PENDING_APPROVAL"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  statusIdx: index("status_idx").on(table.status),
}));

export type AgentRegistration = typeof agentRegistrations.$inferSelect;
export type InsertAgentRegistration = typeof agentRegistrations.$inferInsert;

/**
 * Beta Signups
 * Captures beta signup requests from /beta-signup
 */
export const betaSignups = mysqlTable("beta_signups", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  roleIdx: index("role_idx").on(table.role),
}));

export type BetaSignup = typeof betaSignups.$inferSelect;
export type InsertBetaSignup = typeof betaSignups.$inferInsert;
