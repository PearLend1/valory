/**
 * Zod validation schemas for Valory MVP
 * All tRPC inputs must be validated with these schemas
 */

import { z } from "zod";

// ============ PROPERTY SCHEMAS ============

export const PropertyFilterSchema = z.object({
  city: z.string().min(1).max(100).optional(),
  type: z.enum(["house", "apartment", "townhouse", "land", "commercial"]).optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  status: z.enum(["active", "sold", "withdrawn"]).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

export const PropertyIdSchema = z.object({
  id: z.number().int().positive(),
});

// ============ VALUATION SCHEMAS ============

export const ValuationRequestSchema = z.object({
  address: z.string().min(5).max(255),
  city: z.string().min(2).max(100),
  postcode: z.string().min(2).max(20),
  type: z.enum(["house", "apartment", "townhouse", "land", "commercial"]),
  price: z.number().positive(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  squareFeet: z.number().int().positive().optional(),
  description: z.string().max(5000).optional(),
});

export const ValuationIdSchema = z.object({
  valuationId: z.number().int().positive(),
});

export const ValuationAcceptSchema = z.object({
  valuationId: z.number().int().positive(),
});

// ============ ROUTE TO MARKET SCHEMAS ============

export const RouteToMarketSchema = z.object({
  valuationId: z.number().int().positive(),
  method: z.enum(["agent-led", "self-list", "hybrid"]),
  selectedAgentId: z.number().int().positive().optional(),
});

// ============ VENDOR CONSENT SCHEMAS ============

export const VendorConsentSchema = z.object({
  allowAgentContact: z.boolean(),
});

// ============ AGENT SUBSCRIPTION SCHEMAS ============

export const AgentSubscriptionSchema = z.object({
  tier: z.enum(["tier1", "tier2"]),
});

// ============ LAUNCH VIDEO SCHEMAS ============

export const LaunchVideoSchema = z.object({
  propertyId: z.number().int().positive(),
  templateType: z.enum(["agent-intro", "property-showcase", "hybrid"]),
  durationType: z.enum(["30s", "90s"]),
  videoUrl: z.string().url(),
});

export const LaunchVideoIdSchema = z.object({
  videoId: z.number().int().positive(),
});

export const LaunchVideoPublishSchema = z.object({
  videoId: z.number().int().positive(),
});

// ============ SAVED PROPERTY SCHEMAS ============

export const SavePropertySchema = z.object({
  propertyId: z.number().int().positive(),
  notes: z.string().max(500).optional(),
});

export const RemoveSavedPropertySchema = z.object({
  propertyId: z.number().int().positive(),
});

// ============ SAVED SEARCH SCHEMAS ============

export const SavedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  city: z.string().min(1).max(100).optional(),
  type: z.enum(["house", "apartment", "townhouse", "land", "commercial"]).optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  minBedrooms: z.number().int().nonnegative().optional(),
  maxBedrooms: z.number().int().nonnegative().optional(),
});

// ============ ADMIN SCHEMAS ============

export const CreatePropertySchema = z.object({
  address: z.string().min(5).max(255),
  addressPartial: z.string().min(5).max(255),
  city: z.string().min(2).max(100),
  postcode: z.string().min(2).max(20),
  type: z.enum(["house", "apartment", "townhouse", "land", "commercial"]),
  price: z.number().positive(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  squareFeet: z.number().int().positive().optional(),
  description: z.string().max(5000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const CreateTestUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role: z.enum(["public", "vendor", "agent", "admin"]),
});

// Type exports for use in routers
export type PropertyFilter = z.infer<typeof PropertyFilterSchema>;
export type ValuationRequest = z.infer<typeof ValuationRequestSchema>;
export type RouteToMarket = z.infer<typeof RouteToMarketSchema>;
export type VendorConsent = z.infer<typeof VendorConsentSchema>;
export type AgentSubscription = z.infer<typeof AgentSubscriptionSchema>;
export type LaunchVideo = z.infer<typeof LaunchVideoSchema>;
export type SaveProperty = z.infer<typeof SavePropertySchema>;
export type SavedSearch = z.infer<typeof SavedSearchSchema>;
export type CreateProperty = z.infer<typeof CreatePropertySchema>;
export type CreateTestUser = z.infer<typeof CreateTestUserSchema>;

// ============ BETA SIGNUP SCHEMAS ============

export const BetaSignupSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  role: z.enum(["Seller", "Buyer", "Agent"]),
});

export type BetaSignup = z.infer<typeof BetaSignupSchema>;

// ============ AGENT REGISTRATION SCHEMAS ============

export const AgentRegistrationSchema = z.object({
  agencyName:     z.string().min(1, "Agency name is required").max(255),
  branchPostcode: z.string().min(1, "Branch postcode is required").max(20),
  websiteUrl:     z.string().url().optional().or(z.literal("")),
  fullName:       z.string().min(1, "Full name is required").max(255),
  jobTitle:       z.string().max(255).optional(),
  email:          z.string().email("Valid email required"),
  phone:          z.string().min(1, "Phone number is required").max(50),
  coverageArea:   z.string().min(1, "Coverage area is required"),
  tier:           z.enum(["standard", "premium"]).default("standard"),
});

export type AgentRegistration = z.infer<typeof AgentRegistrationSchema>;
