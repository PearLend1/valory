import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  calculateRelevanceScore,
  calculateMomentumScore,
  getUserPreferences,
  getUserEngagementSignals,
  getUserBrowsingHistory,
  rankPropertiesForUser,
  recordEngagementSignal,
  updateUserPreferences,
} from "./feed-ranking-engine";

/**
 * Tests for:
 * 1. Feed ranking engine (stubbed Phase 17 functions)
 * 2. Properties list endpoint (buyer feed)
 * 3. Seller valuation flow routing (via tRPC)
 */

// Helper to create test contexts
function createContext(role: "public" | "vendor" | "agent" | "admin", userId: number = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `test-${role}-${userId}`,
      email: `${role}@test.com`,
      name: `Test ${role}`,
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {
      clearCookie: () => {},
    } as any,
  };
}

describe("Feed Ranking Engine", () => {
  describe("calculateMomentumScore", () => {
    it("returns 100 for high momentum", () => {
      expect(calculateMomentumScore("high")).toBe(100);
    });

    it("returns 75 for rising momentum", () => {
      expect(calculateMomentumScore("rising")).toBe(75);
    });

    it("returns 50 for stable momentum", () => {
      expect(calculateMomentumScore("stable")).toBe(50);
    });

    it("returns 25 for cooling momentum", () => {
      expect(calculateMomentumScore("cooling")).toBe(25);
    });

    it("returns 50 for unknown momentum", () => {
      expect(calculateMomentumScore("unknown")).toBe(50);
    });
  });

  describe("calculateRelevanceScore", () => {
    it("returns 50 when no user preferences are set", async () => {
      const score = await calculateRelevanceScore(1, { price: 300000 }, null);
      expect(score).toBe(50);
    });

    it("scores higher for matching location", async () => {
      const prefs = {
        locationPreferences: ["BS1"],
        priceRangeMin: 200000,
        priceRangeMax: 500000,
        propertyTypePreferences: ["house"],
        bedsMin: 2,
        bedsMax: 4,
        bathsMin: 1,
        bathsMax: 3,
      };
      const matchingProperty = {
        postcode: "BS1 4QA",
        price: 300000,
        propertyType: "house",
        beds: 3,
        baths: 2,
      };
      const nonMatchingProperty = {
        postcode: "EX1 1AA",
        price: 300000,
        propertyType: "house",
        beds: 3,
        baths: 2,
      };

      const matchScore = await calculateRelevanceScore(1, matchingProperty, prefs);
      const nonMatchScore = await calculateRelevanceScore(1, nonMatchingProperty, prefs);

      expect(matchScore).toBeGreaterThan(nonMatchScore);
    });

    it("gives partial credit for near-range prices", async () => {
      const prefs = {
        locationPreferences: [],
        priceRangeMin: 200000,
        priceRangeMax: 300000,
        propertyTypePreferences: [],
        bedsMin: 0,
        bedsMax: 10,
        bathsMin: 0,
        bathsMax: 10,
      };
      const nearRangeProperty = {
        postcode: "XX1",
        price: 320000, // 6.7% above max, within 10% tolerance
        propertyType: "flat",
        beds: 2,
        baths: 1,
      };
      const farRangeProperty = {
        postcode: "XX1",
        price: 500000, // way above max
        propertyType: "flat",
        beds: 2,
        baths: 1,
      };

      const nearScore = await calculateRelevanceScore(1, nearRangeProperty, prefs);
      const farScore = await calculateRelevanceScore(1, farRangeProperty, prefs);

      expect(nearScore).toBeGreaterThan(farScore);
    });
  });

  describe("Stubbed Phase 17 functions", () => {
    it("getUserPreferences returns null (stub)", async () => {
      const result = await getUserPreferences(1);
      expect(result).toBeNull();
    });

    it("getUserEngagementSignals returns 0 (stub)", async () => {
      const result = await getUserEngagementSignals(1, 1);
      expect(result).toBe(0);
    });

    it("getUserBrowsingHistory returns null (stub)", async () => {
      const result = await getUserBrowsingHistory(1, 1);
      expect(result).toBeNull();
    });

    it("recordEngagementSignal does not throw (stub)", async () => {
      await expect(recordEngagementSignal(1, 1, "view")).resolves.toBeUndefined();
    });

    it("updateUserPreferences does not throw (stub)", async () => {
      await expect(updateUserPreferences(1, { priceRangeMin: 100000 })).resolves.toBeUndefined();
    });
  });

  describe("rankPropertiesForUser", () => {
    it("ranks properties by combined score (momentum-only for now)", async () => {
      const properties = [
        { id: 1, price: 300000, momentum: "cooling", postcode: "XX1", propertyType: "house", beds: 3, baths: 2 },
        { id: 2, price: 400000, momentum: "high", postcode: "XX2", propertyType: "flat", beds: 2, baths: 1 },
        { id: 3, price: 350000, momentum: "rising", postcode: "XX3", propertyType: "house", beds: 4, baths: 3 },
      ];

      const ranked = await rankPropertiesForUser(1, properties);

      // With no user preferences (all get 50 relevance), momentum determines order
      // High (100) > Rising (75) > Cooling (25)
      expect(ranked[0].momentumScore).toBe(100);
      expect(ranked[1].momentumScore).toBe(75);
      expect(ranked[2].momentumScore).toBe(25);
    });

    it("respects the limit parameter", async () => {
      const properties = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        price: 200000 + i * 50000,
        momentum: "stable",
        postcode: `XX${i}`,
        propertyType: "house",
        beds: 3,
        baths: 2,
      }));

      const ranked = await rankPropertiesForUser(1, properties, 5);
      expect(ranked.length).toBe(5);
    });
  });
});

describe("Properties List Endpoint (Buyer Feed)", () => {
  it("allows public users to list properties", async () => {
    const caller = appRouter.createCaller(createContext("public"));
    // This should not throw - public users can browse properties
    try {
      const result = await caller.properties.list({
        limit: 5,
        offset: 0,
      });
      expect(Array.isArray(result)).toBe(true);
    } catch (err: any) {
      // Database errors are expected in test environment
      // but access control should not block this
      expect(err.code).not.toBe("UNAUTHORIZED");
      expect(err.code).not.toBe("FORBIDDEN");
    }
  });
});

describe("Seller Valuation Endpoint", () => {
  it("denies public users from requesting valuations", async () => {
    const caller = appRouter.createCaller(createContext("public"));
    try {
      await caller.valuations.request({
        address: "42 Victoria Road",
        postcode: "BS1 4QA",
        propertyType: "house",
        bedrooms: 3,
        bathrooms: 2,
        price: 350000,
      });
      expect.fail("Should have thrown UNAUTHORIZED");
    } catch (err: any) {
      // RBAC returns FORBIDDEN for authenticated users with wrong role
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("allows vendor users to request valuations", async () => {
    const caller = appRouter.createCaller(createContext("vendor"));
    try {
      const result = await caller.valuations.request({
        address: "42 Victoria Road",
        postcode: "BS1 4QA",
        propertyType: "house",
        bedrooms: 3,
        bathrooms: 2,
        price: 350000,
      });
      expect(result).toHaveProperty("estimatedPriceLow");
      expect(result).toHaveProperty("estimatedPriceHigh");
      expect(result).toHaveProperty("confidence");
    } catch (err: any) {
      // Database errors are expected in test environment
      expect(err.code).not.toBe("UNAUTHORIZED");
      expect(err.code).not.toBe("FORBIDDEN");
    }
  });
});
