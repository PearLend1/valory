/**
 * Role-Based Access Control (RBAC) middleware for Valory
 * Enforces role-based access on protected endpoints
 */

import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./_core/trpc";
import type { TrpcContext } from "./_core/context";

export type UserRole = "public" | "vendor" | "agent" | "admin";

/**
 * Middleware for buyer/public users
 */
export const buyerProcedure = protectedProcedure.use(({ ctx, next }) => {
  const userRole = ctx.user?.role as UserRole;
  
  if (userRole !== "public" && userRole !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Buyer access required",
    });
  }
  
  return next({ ctx });
});

/**
 * Middleware for vendors
 */
export const vendorProcedure = protectedProcedure.use(({ ctx, next }) => {
  const userRole = ctx.user?.role as UserRole;
  
  if (userRole !== "vendor" && userRole !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Vendor access required",
    });
  }
  
  return next({ ctx });
});

/**
 * Middleware for agents
 */
export const agentProcedure = protectedProcedure.use(({ ctx, next }) => {
  const userRole = ctx.user?.role as UserRole;
  
  if (userRole !== "agent" && userRole !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Agent access required",
    });
  }
  
  return next({ ctx });
});

/**
 * Middleware for admin users only
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const userRole = ctx.user?.role as UserRole;
  
  if (userRole !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  
  return next({ ctx });
});

/**
 * Middleware for agents with active Tier 1+ subscription
 */
export const tier1AgentProcedure = agentProcedure.use(async ({ ctx, next }) => {
  const { DEMO_MODE } = await import("./demo-mode");

  // In demo mode, always grant access with a mock subscription
  if (DEMO_MODE) {
    return next({
      ctx: {
        ...ctx,
        subscription: { id: 1, agentId: ctx.user!.id, tier: 'tier2', status: 'active' },
      },
    });
  }

  const { getDb } = await import("./db");
  const { eq } = await import("drizzle-orm");
  const { agentSubscriptions } = await import("./schema");

  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database unavailable",
    });
  }

  const subscription = await db
    .select()
    .from(agentSubscriptions)
    .where(eq(agentSubscriptions.agentId, ctx.user!.id))
    .limit(1);

  if (!subscription.length || subscription[0].status !== "active") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Active Tier 1 subscription required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      subscription: subscription[0],
    },
  });
});

/**
 * Middleware for agents with active Tier 2 subscription
 */
export const tier2AgentProcedure = agentProcedure.use(async ({ ctx, next }) => {
  const { DEMO_MODE } = await import("./demo-mode");

  // In demo mode, always grant access with a mock subscription
  if (DEMO_MODE) {
    return next({
      ctx: {
        ...ctx,
        subscription: { id: 1, agentId: ctx.user!.id, tier: 'tier2', status: 'active' },
      },
    });
  }

  const { getDb } = await import("./db");
  const { eq } = await import("drizzle-orm");
  const { agentSubscriptions } = await import("./schema");

  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database unavailable",
    });
  }

  const subscription = await db
    .select()
    .from(agentSubscriptions)
    .where(eq(agentSubscriptions.agentId, ctx.user!.id))
    .limit(1);

  if (!subscription.length || subscription[0].status !== "active" || subscription[0].tier !== "tier2") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Active Tier 2 subscription required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      subscription: subscription[0],
    },
  });
});