import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { vendorProcedure, agentProcedure, tier1AgentProcedure } from "./_core/rbac";
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

const PUBLIC_SIGNUPS_ENABLED = process.env.ENABLE_PUBLIC_SIGNUPS === 'true';

function assertPublicSignupsEnabled() {
  if (!PUBLIC_SIGNUPS_ENABLED) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Public signups are not yet enabled.',
    });
  }
}

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

  // ============ LEGACY VALUATION ROUTE (VENDOR) ============
  valuations: router({
    request: vendorProcedure
      .input(validation.ValuationRequestSchema)
      .mutation(() => {
        // This route previously returned a fabricated +/-10% result. Keep it
        // closed so no client can mistake placeholder arithmetic for a live
        // data-backed valuation. The canonical route is valuation.estimate.
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Use the verified valuation flow.",
        });
      }),
  }),

  // ============ AGENT SUBSCRIPTIONS ============
  subscriptions: router({
    subscribe: agentProcedure
      .input(validation.AgentSubscriptionSchema)
      .mutation(() => {
        // Never claim that payment or a recurring subscription exists until a
        // real payment provider, terms and cancellation flow are connected.
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Paid subscriptions are not yet enabled.",
        });
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
        if (DEMO_MODE) {
          console.info('[Demo Mode] Agent registration received');
          return { success: true };
        }

        // This flag must stay false until the real privacy notice, retention
        // schedule, processor terms and just-in-time form notice are live.
        assertPublicSignupsEnabled();

        try {
          const database = await db.getDb();
          if (!database) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Database not available',
            });
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
          if (error instanceof TRPCError) throw error;
          console.error('[AgentRegistration] Failed to store registration');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create agent registration',
          });
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
        postcode:  z.string().min(5).max(8),
        estimate:  z.number().positive().optional(),
        type:      z.string().max(50).optional(),
        beds:      z.number().int().min(0).max(10).optional(),
      }))
      .mutation(async ({ input: _input }) => {
        if (DEMO_MODE) {
          console.info('[Demo Mode] Seller lead received');
          return { success: true, agents: DEMO_MATCHED_AGENTS };
        }

        // The old production branch silently discarded the seller's details
        // and returned demo agents. Fail closed until consent, persistence,
        // matching, retention and agent-sharing rules are implemented.
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Seller introductions are not yet enabled.',
        });
      }),
  }),

  // ============ BETA SIGNUPS (PUBLIC) ============
  betaSignups: router({
    create: publicProcedure
      .input(validation.BetaSignupSchema)
      .mutation(async ({ input }) => {
        if (DEMO_MODE) {
          console.info('[Demo Mode] Beta signup received');
          return { success: true };
        }

        assertPublicSignupsEnabled();

        try {
          const database = await db.getDb();
          if (!database) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Database not available',
            });
          }
          await database.insert(betaSignups).values({
            name: input.name,
            email: input.email,
            role: input.role,
          });
          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error('[BetaSignup] Failed to store signup');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create beta signup',
          });
        }
      }),
  }),

  // ============ LAUNCH VIDEOS (AGENT) ============
  launches: router({
    upload: tier1AgentProcedure
      .input(validation.LaunchVideoSchema)
      .mutation(({ input }) => {
        if (!["30s", "90s"].includes(input.durationType)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Duration must be 30s or 90s" });
        }

        if (!["agent-intro", "property-showcase", "hybrid"].includes(input.templateType)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid template type" });
        }

        // Do not return a fake upload ID until object storage, malware/content
        // validation and lifecycle/deletion controls are implemented.
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Video uploads are not yet enabled.",
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
