/**
 * Role-Based Access Control (RBAC) middleware for Valory
 * Enforces role-based access on protected endpoints
 */

import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./trpc";

export type UserRole = "public" | "vendor" | "agent" | "admin";

/** Buyer / browsing users */
export const buyerProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.user?.role as UserRole;
  if (role !== "public" && role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Buyer access required" });
  }
  return next({ ctx });
});

/** Vendors (sellers) */
export const vendorProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.user?.role as UserRole;
  if (role !== "vendor" && role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Vendor access required" });
  }
  return next({ ctx });
});

/** Estate agents */
export const agentProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.user?.role as UserRole;
  if (role !== "agent" && role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Agent access required" });
  }
  return next({ ctx });
});

/** Platform admins */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.user?.role as UserRole;
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

/** Agents with an active Tier 1+ subscription */
export const tier1AgentProcedure = agentProcedure.use(async ({ ctx, next }) => {
  const { DEMO_MODE } = await import("../demo-mode");
  if (DEMO_MODE) {
    return next({
      ctx: {
        ...ctx,
        subscription: { id: 1, agentId: ctx.user!.id, tier: "tier2", status: "active" },
      },
    });
  }

  const { getDb } = await import("../db");
  const { eq } = await import("drizzle-orm");
  const { agentSubscriptions } = await import("../drizzle/schema");

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const sub = await db.select().from(agentSubscriptions)
    .where(eq(agentSubscriptions.agentId, ctx.user!.id)).limit(1);

  if (!sub.length || sub[0].status !== "active") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Active Tier 1 subscription required" });
  }

  return next({ ctx: { ...ctx, subscription: sub[0] } });
});

/** Agents with an active Tier 2 subscription */
export const tier2AgentProcedure = agentProcedure.use(async ({ ctx, next }) => {
  const { DEMO_MODE } = await import("../demo-mode");
  if (DEMO_MODE) {
    return next({
      ctx: {
        ...ctx,
        subscription: { id: 1, agentId: ctx.user!.id, tier: "tier2", status: "active" },
      },
    });
  }

  const { getDb } = await import("../db");
  const { eq } = await import("drizzle-orm");
  const { agentSubscriptions } = await import("../drizzle/schema");

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const sub = await db.select().from(agentSubscriptions)
    .where(eq(agentSubscriptions.agentId, ctx.user!.id)).limit(1);

  if (!sub.length || sub[0].status !== "active" || sub[0].tier !== "tier2") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Active Tier 2 subscription required" });
  }

  return next({ ctx: { ...ctx, subscription: sub[0] } });
});
