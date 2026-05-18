import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { buyerProcedure, vendorProcedure, agentProcedure, tier1AgentProcedure, tier2AgentProcedure, adminProcedure } from "./_core/rbac";
import * as validation from "./_core/validation";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { valuationRouter } from "./routers/valuation";
import { followRouter } from "./routers/follow";
import { timelineRouter } from "./routers/timeline";
import { agentRouter } from './routers/agent';
import { vendorAcceptanceRouter } from './routers/vendorAcceptance';
import { postcodeRouter } from './routers/postcode';
import { betaSignups, agentRegistrations } from './schema';
import { DEMO_MODE } from './demo-mode';
import { DEMO_MATCHED_AGENTS } from './mock-data';
import { z } from 'zod';

export const appRouter = router({
  system: systemRouter,
  valuation: valuationRouter,
  follow: followRouter,
  timeline: timelineRouter,
  agent: agentRouter,
  vendorAcceptance: vendorAcceptanceRouter,
  postcode: postcodeRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ PROPERTIES (PUBLIC) ============
  properties: router({
    list: publicProcedure
      .input(validation.PropertyFilterSchema)
      .query(async ({ input }) => {
        return db.getPublicProperties({
          city: input.city,
          propertyType: input.type,
          minPrice: input.minPrice,
          maxPrice: input.maxPrice,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    getById: publicProcedure
      .input(validation.PropertyIdSchema)
      .query(async ({ input }) => {
        const property = await db.getPropertyById(input.id);
        if (!property) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });
        }
        return property;
      }),
  }),

  // ============ VALUATIONS (VENDOR) ============
  valuations: router({
    request: vendorProcedure
      .input(validation.ValuationRequestSchema)
      .mutation(async ({ input, ctx }) => {
        // Simulate AI-powered valuation
        const estimatedPriceLow = Math.floor(input.price * 0.9);
        const estimatedPriceHigh = Math.ceil(input.price * 1.1);

        return {
          estimatedPriceLow,
          estimatedPriceHigh,
          confidence: "medium",
          reasoning: "Based on comparable properties in the area.",
        };
      }),
  }),

  // ============ AGENT SUBSCRIPTIONS ============
  subscriptions: router({
    subscribe: agentProcedure
      .input(validation.AgentSubscriptionSchema)
      .mutation(async ({ input, ctx }) => {
        // Verify subscription tier is valid
        if (!["tier1", "tier2"].includes(input.tier)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid subscription tier" });
        }

        // In a real system, this would process payment and create subscription
        return {
          success: true,
          tier: input.tier,
          renewalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        };
      }),

    getActive: agentProcedure
      .query(async ({ ctx }) => {
        const subscription = await db.getAgentSubscription(ctx.user!.id);
        return subscription || null;
      }),
  }),

  // ============ AGENT REGISTRATIONS (PUBLIC) ============
  agentRegistrations: router({
    create: publicProcedure
      .input(validation.AgentRegistrationSchema)
      .mutation(async ({ input }) => {
        try {
          if (DEMO_MODE) {
            console.log('[Demo Mode] Agent registration:', input);
            return { success: true };
          }
          const database = await db.getDb();
          if (!database) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
          }
          await database.insert(agentRegistrations).values({
            agencyName:     input.agencyName,
            branchPostcode: input.branchPostcode,
            websiteUrl:     input.websiteUrl || null,
            fullName:       input.fullName,
            jobTitle:       input.jobTitle   || null,
            email:          input.email,
            phone:          input.phone,
            coverageArea:   input.coverageArea,
            tier:           input.tier,
            status:         'PENDING_APPROVAL',
          });
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create agent registration' });
        }
      }),
  }),

  // ============ SELLER LEAD CAPTURE (PUBLIC) ============
  seller: router({
    submitLead: publicProcedure
      .input(z.object({
        name:      z.string().min(2).max(255),
        email:     z.string().email(),
        phone:     z.string().min(9).max(20),
        postcode:  z.string().min(3).max(8),
        estimate:  z.number().positive().optional(),
        type:      z.string().optional(),
        beds:      z.number().int().optional(),
      }))
      .mutation(async ({ input }) => {
        if (DEMO_MODE) {
          console.log('[Demo Mode] Seller lead:', input);
          return { success: true, agents: DEMO_MATCHED_AGENTS };
        }
        // TODO: persist lead + run real agent matching
        return { success: true, agents: DEMO_MATCHED_AGENTS };
      }),
  }),

  // ============ BETA SIGNUPS (PUBLIC) ============
  betaSignups: router({
    create: publicProcedure
      .input(validation.BetaSignupSchema)
      .mutation(async ({ input }) => {
        try {
          // In demo mode, just return success without DB insert
          if (DEMO_MODE) {
            console.log('[Demo Mode] Beta signup:', input);
            return { success: true };
          }

          const database = await db.getDb();
          if (!database) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
          }
          await database.insert(betaSignups).values({
            name: input.name,
            email: input.email,
            role: input.role,
          });
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create beta signup' });
        }
      }),
  }),

  // ============ LAUNCH VIDEOS (AGENT) ============
  launches: router({
    upload: tier1AgentProcedure
      .input(validation.LaunchVideoSchema)
      .mutation(async ({ input, ctx }) => {
        // Validate video duration and format
        if (!["30s", "90s"].includes(input.durationType)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Duration must be 30s or 90s" });
        }

        if (!["agent-intro", "property-showcase", "hybrid"].includes(input.templateType)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid template type" });
        }

        // In a real system, validate MP4 file and store in S3
        return {
          success: true,
          launchId: Math.floor(Math.random() * 10000),
          message: "Launch video uploaded successfully",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
