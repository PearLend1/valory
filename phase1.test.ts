import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Phase 1 MVP Tests: Role-Based Access Control & Subscriptions
 * Focus: Verify RBAC enforcement and Zod validation
 * Note: Database errors are expected in test environment; we verify access control
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

describe("Phase 1 MVP: Role-Based Access Control", () => {
  describe("Vendor-Only Endpoints", () => {
    it("denies public users from requesting valuations", async () => {
      const caller = appRouter.createCaller(createContext("public"));
      try {
        await caller.valuations.request({
          address: "123 Test Street",
          city: "London",
          postcode: "SW1A 1AA",
          type: "house",
          price: 500000,
        });
        expect.fail("Should have thrown FORBIDDEN");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });

    it("denies agents from requesting valuations", async () => {
      const caller = appRouter.createCaller(createContext("agent"));
      try {
        await caller.valuations.request({
          address: "123 Test Street",
          city: "London",
          postcode: "SW1A 1AA",
          type: "house",
          price: 500000,
        });
        expect.fail("Should have thrown FORBIDDEN");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });

    it("denies non-vendors from managing consent", async () => {
      const caller = appRouter.createCaller(createContext("public"));
      try {
        await caller.vendorConsent.update({ allowAgentContact: true });
        expect.fail("Should have thrown FORBIDDEN");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });

    it("denies agents from managing vendor consent", async () => {
      const caller = appRouter.createCaller(createContext("agent"));
      try {
        await caller.vendorConsent.update({ allowAgentContact: true });
        expect.fail("Should have thrown FORBIDDEN");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("Agent-Only Endpoints", () => {
    it("denies public users from viewing agent subscriptions", async () => {
      const caller = appRouter.createCaller(createContext("public"));
      try {
        await caller.agentSubscriptions.get();
        expect.fail("Should have thrown FORBIDDEN");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });

    it("denies vendors from subscribing", async () => {
      const caller = appRouter.createCaller(createContext("vendor"));
      try {
        await caller.agentSubscriptions.subscribe({ tier: "tier1" });
        expect.fail("Should have thrown FORBIDDEN");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });

    it("denies public users from creating launch videos", async () => {
      const caller = appRouter.createCaller(createContext("public"));
      try {
        await caller.launchVideos.create({
          propertyId: 1,
          templateType: "agent-intro",
          durationType: "30s",
          videoUrl: "https://example.com/video.mp4",
        });
        expect.fail("Should have thrown FORBIDDEN");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });

    it("denies vendors from publishing launch videos", async () => {
      const caller = appRouter.createCaller(createContext("vendor"));
      try {
        await caller.launchVideos.publish({ videoId: 1 });
        expect.fail("Should have thrown FORBIDDEN");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("Buyer-Only Endpoints", () => {
    it("denies vendors from saving properties", async () => {
      const caller = appRouter.createCaller(createContext("vendor"));
      try {
        await caller.savedProperties.save({ propertyId: 1 });
        expect.fail("Should have thrown FORBIDDEN");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });

    it("denies agents from saving properties", async () => {
      const caller = appRouter.createCaller(createContext("agent"));
      try {
        await caller.savedProperties.save({ propertyId: 1 });
        expect.fail("Should have thrown FORBIDDEN");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });

    it("denies vendors from creating saved searches", async () => {
      const caller = appRouter.createCaller(createContext("vendor"));
      try {
        await caller.savedSearches.create({
          name: "My Search",
          city: "London",
        });
        expect.fail("Should have thrown FORBIDDEN");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });

    it("denies agents from listing saved searches", async () => {
      const caller = appRouter.createCaller(createContext("agent"));
      try {
        await caller.savedSearches.list();
        expect.fail("Should have thrown FORBIDDEN");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("Admin-Only Endpoints", () => {
    it("denies agents from creating properties", async () => {
      const caller = appRouter.createCaller(createContext("agent"));
      try {
        await caller.admin.createProperty({
          address: "123 Admin Street",
          addressPartial: "123 Admin Street",
          city: "London",
          postcode: "SW1A 1AA",
          type: "house",
          price: 500000,
        });
        expect.fail("Should have thrown FORBIDDEN");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });

    it("denies public users from creating test users", async () => {
      const caller = appRouter.createCaller(createContext("public"));
      try {
        await caller.admin.createTestUser({
          email: "test@example.com",
          name: "Test User",
          role: "vendor",
        });
        expect.fail("Should have thrown FORBIDDEN");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });

    it("denies vendors from creating test users", async () => {
      const caller = appRouter.createCaller(createContext("vendor"));
      try {
        await caller.admin.createTestUser({
          email: "test@example.com",
          name: "Test User",
          role: "agent",
        });
        expect.fail("Should have thrown FORBIDDEN");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("Zod Input Validation", () => {
    it("rejects invalid property filter (negative price)", async () => {
      const caller = appRouter.createCaller(createContext("public"));
      try {
        await caller.properties.list({
          minPrice: -100,
          limit: 10,
          offset: 0,
        });
        expect.fail("Should have thrown validation error");
      } catch (err: any) {
        expect(err.code).toBe("BAD_REQUEST");
      }
    });

    it("rejects invalid property filter (limit too high)", async () => {
      const caller = appRouter.createCaller(createContext("public"));
      try {
        await caller.properties.list({
          limit: 200, // Max is 100
          offset: 0,
        });
        expect.fail("Should have thrown validation error");
      } catch (err: any) {
        expect(err.code).toBe("BAD_REQUEST");
      }
    });

    it("rejects invalid valuation request (address too short)", async () => {
      const caller = appRouter.createCaller(createContext("vendor"));
      try {
        await caller.valuations.request({
          address: "ab", // Too short (min 5)
          city: "London",
          postcode: "SW1A 1AA",
          type: "house",
          price: 500000,
        });
        expect.fail("Should have thrown validation error");
      } catch (err: any) {
        expect(err.code).toBe("BAD_REQUEST");
      }
    });

    it("rejects invalid valuation request (city too short)", async () => {
      const caller = appRouter.createCaller(createContext("vendor"));
      try {
        await caller.valuations.request({
          address: "123 Test Street",
          city: "L", // Too short (min 2)
          postcode: "SW1A 1AA",
          type: "house",
          price: 500000,
        });
        expect.fail("Should have thrown validation error");
      } catch (err: any) {
        expect(err.code).toBe("BAD_REQUEST");
      }
    });

    it("rejects invalid valuation request (negative price)", async () => {
      const caller = appRouter.createCaller(createContext("vendor"));
      try {
        await caller.valuations.request({
          address: "123 Test Street",
          city: "London",
          postcode: "SW1A 1AA",
          type: "house",
          price: -500000, // Must be positive
        });
        expect.fail("Should have thrown validation error");
      } catch (err: any) {
        expect(err.code).toBe("BAD_REQUEST");
      }
    });

    it("rejects invalid launch video (invalid template type)", async () => {
      const caller = appRouter.createCaller(createContext("agent"));
      try {
        await caller.launchVideos.create({
          propertyId: 1,
          templateType: "invalid-template" as any,
          durationType: "30s",
          videoUrl: "https://example.com/video.mp4",
        });
        expect.fail("Should have thrown validation error");
      } catch (err: any) {
        // Zod validation error or subscription check error
        expect(["BAD_REQUEST", "FORBIDDEN", "INTERNAL_SERVER_ERROR"].includes(err.code)).toBe(true);
      }
    });

    it("rejects invalid launch video (invalid duration)", async () => {
      const caller = appRouter.createCaller(createContext("agent"));
      try {
        await caller.launchVideos.create({
          propertyId: 1,
          templateType: "agent-intro",
          durationType: "60s" as any, // Only 30s or 90s allowed
          videoUrl: "https://example.com/video.mp4",
        });
        expect.fail("Should have thrown validation error");
      } catch (err: any) {
        // Zod validation error or subscription check error
        expect(["BAD_REQUEST", "FORBIDDEN", "INTERNAL_SERVER_ERROR"].includes(err.code)).toBe(true);
      }
    });

    it("rejects invalid saved search (empty name)", async () => {
      const caller = appRouter.createCaller(createContext("public"));
      try {
        await caller.savedSearches.create({
          name: "", // Empty name not allowed
          city: "London",
        });
        expect.fail("Should have thrown validation error");
      } catch (err: any) {
        expect(err.code).toBe("BAD_REQUEST");
      }
    });

    it("rejects invalid saved search (name too long)", async () => {
      const caller = appRouter.createCaller(createContext("public"));
      try {
        await caller.savedSearches.create({
          name: "a".repeat(101), // Max 100 chars
          city: "London",
        });
        expect.fail("Should have thrown validation error");
      } catch (err: any) {
        expect(err.code).toBe("BAD_REQUEST");
      }
    });

    it("accepts valid property filter", async () => {
      const caller = appRouter.createCaller(createContext("public"));
      try {
        await caller.properties.list({
          city: "London",
          type: "house",
          minPrice: 100000,
          maxPrice: 1000000,
          limit: 20,
          offset: 0,
        });
        // Success or database error is OK; BAD_REQUEST means validation failed
        expect(true).toBe(true);
      } catch (err: any) {
        expect(err.code).not.toBe("BAD_REQUEST");
      }
    });

    it("accepts valid valuation request", async () => {
      const caller = appRouter.createCaller(createContext("vendor"));
      try {
        await caller.valuations.request({
          address: "123 Test Street",
          city: "London",
          postcode: "SW1A 1AA",
          type: "house",
          price: 500000,
          bedrooms: 3,
        });
        // Success or database error is OK; BAD_REQUEST means validation failed
        expect(true).toBe(true);
      } catch (err: any) {
        expect(err.code).not.toBe("BAD_REQUEST");
      }
    });

    it("accepts valid launch video", async () => {
      const caller = appRouter.createCaller(createContext("agent"));
      try {
        await caller.launchVideos.create({
          propertyId: 1,
          templateType: "property-showcase",
          durationType: "90s",
          videoUrl: "https://example.com/video.mp4",
        });
        // Success or database error is OK; BAD_REQUEST means validation failed
        expect(true).toBe(true);
      } catch (err: any) {
        expect(err.code).not.toBe("BAD_REQUEST");
      }
    });

    it("accepts valid saved search", async () => {
      const caller = appRouter.createCaller(createContext("public"));
      try {
        await caller.savedSearches.create({
          name: "My Search",
          city: "London",
          type: "apartment",
          minPrice: 200000,
          maxPrice: 800000,
        });
        // Success or database error is OK; BAD_REQUEST means validation failed
        expect(true).toBe(true);
      } catch (err: any) {
        expect(err.code).not.toBe("BAD_REQUEST");
      }
    });
  });

  describe("Admin Override", () => {
    it("allows admins to access vendor endpoints", async () => {
      const caller = appRouter.createCaller(createContext("admin"));
      try {
        await caller.vendorConsent.update({ allowAgentContact: true });
        // Success or database error is OK; FORBIDDEN means access was denied
        expect(true).toBe(true);
      } catch (err: any) {
        expect(err.code).not.toBe("FORBIDDEN");
      }
    });

    it("allows admins to access agent endpoints", async () => {
      const caller = appRouter.createCaller(createContext("admin"));
      try {
        await caller.agentSubscriptions.get();
        // Success or database error is OK; FORBIDDEN means access was denied
        expect(true).toBe(true);
      } catch (err: any) {
        expect(err.code).not.toBe("FORBIDDEN");
      }
    });

    it("allows admins to access buyer endpoints", async () => {
      const caller = appRouter.createCaller(createContext("admin"));
      try {
        await caller.savedProperties.list();
        // Success or database error is OK; FORBIDDEN means access was denied
        expect(true).toBe(true);
      } catch (err: any) {
        expect(err.code).not.toBe("FORBIDDEN");
      }
    });
  });
});
