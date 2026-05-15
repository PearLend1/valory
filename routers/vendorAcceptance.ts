/**
 * Vendor Acceptance Router
 * Handles valuation acceptance, launch profile completion, lead state progression,
 * and tiered agent notification.
 *
 * Lead progression:
 *   REGISTERED → PROFILE_IN_PROGRESS → ACCEPTED_VALUATION → READY_FOR_AGENT_MATCH
 *
 * Acceptance triggers:
 *   - Lock valuation for 12 months
 *   - Notify premium agents only (anonymised early signal)
 *   - Route vendor to post-acceptance dashboard
 *
 * Profile completion triggers:
 *   - READY_FOR_AGENT_MATCH state
 *   - Notify ALL relevant agents
 *   - Open full agent matching process
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { vendorProcedure } from '../_core/rbac';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import {
  valuationRequests,
  vendorLeadStates,
  leadStateAuditLog,
  premiumEarlyLeadSignals,
  premiumAgentLeadNotifications,
  agentInterestExpressions,
  agentSubscriptions,
  vendorLaunchProfiles,
} from '../drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { notifyOwner } from '../_core/notification';
import { DEMO_MODE } from '../demo-mode';
import { DEMO_VALUATIONS } from '../mock-data';

/** 12 months in milliseconds */
const LOCK_DURATION_MS = 365 * 24 * 60 * 60 * 1000;

/** 30 days for early lead signal expiry */
const SIGNAL_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

// ─── Profile Completion Criteria ─────────────────────────────────
// Each criterion has an id, label, and a check function against the valuation/profile data.

interface ProfileCheckResult {
  id: string;
  label: string;
  description: string;
  completed: boolean;
}

function evaluateProfileCompletion(valuation: any, launchProfile: any): ProfileCheckResult[] {
  const propertyData = valuation?.propertyData as any || {};
  const basics = valuation?.propertyBasics as any || {};
  const features = valuation?.propertyFeatures as any || {};

  return [
    {
      id: 'valuation_accepted',
      label: 'Valuation accepted',
      description: 'Your Valory valuation is locked for 12 months.',
      completed: valuation?.status === 'accepted' && !!valuation?.acceptedAt,
    },
    {
      id: 'address_confirmed',
      label: 'Address confirmed',
      description: 'Your property address and postcode are on record.',
      completed: !!(propertyData.address && propertyData.postcode),
    },
    {
      id: 'property_basics',
      label: 'Property basics',
      description: 'Type, bedrooms, bathrooms, and other key details.',
      completed: !!(basics.propertyType && basics.bedrooms),
    },
    {
      id: 'property_features',
      label: 'Features and condition',
      description: 'Condition, EPC rating, and notable features.',
      completed: !!(features.condition || (features.features && features.features.length > 0)),
    },
    {
      id: 'property_photos',
      label: 'Property photos',
      description: 'At least one front-of-house photo to complete your profile.',
      completed: !!valuation?.hasPhotos,
    },
  ];
}

function computeCompletionPercentage(checks: ProfileCheckResult[]): number {
  const completed = checks.filter(c => c.completed).length;
  return Math.round((completed / checks.length) * 100);
}

function isProfileComplete(checks: ProfileCheckResult[]): boolean {
  return checks.every(c => c.completed);
}

// ─── Input Schemas ────────────────────────────────────────────────

const acceptValuationSchema = z.object({
  address: z.string().min(1),
  postcode: z.string().min(2),
  estimatedPriceLow: z.number().positive(),
  estimatedPriceHigh: z.number().positive(),
  estimatedMidpoint: z.number().positive(),
  confidence: z.enum(['low', 'medium', 'high']),
  propertyBasics: z.object({
    propertyType: z.string().optional(),
    bedrooms: z.string().optional(),
    bathrooms: z.string().optional(),
    receptionRooms: z.string().optional(),
    sqft: z.string().optional(),
    tenure: z.string().optional(),
  }).optional(),
  propertyFeatures: z.object({
    condition: z.string().optional(),
    epcRating: z.string().optional(),
    features: z.array(z.string()).optional(),
    improvements: z.string().optional(),
  }).optional(),
});

const getVendorDashboardSchema = z.object({
  valuationId: z.number().int().positive().optional(),
});

const uploadPhotosSchema = z.object({
  valuationId: z.number().int().positive(),
  photoUrls: z.array(z.string().url()).min(1).max(10),
});

const completeProfileSchema = z.object({
  valuationId: z.number().int().positive(),
});

// ─── Router ───────────────────────────────────────────────────────

export const vendorAcceptanceRouter = router({
  /**
   * Accept Valory Valuation
   * - Creates/updates the valuation request with locked status
   * - Transitions lead state to ACCEPTED_VALUATION
   * - Creates anonymised early lead signal for premium agents ONLY
   * - Notifies the platform owner
   * - Does NOT open full agent matching (that requires profile completion)
   */
  acceptValuation: vendorProcedure
    .input(acceptValuationSchema)
    .mutation(async ({ ctx, input }) => {
      const vendorId = ctx.user!.id;
      const now = new Date();
      const lockedUntil = new Date(now.getTime() + LOCK_DURATION_MS);

      // In demo mode, return success without DB operations
      if (DEMO_MODE) {
        const valuationId = 1;
        const postcodeSector = input.postcode.split(' ')[0] || input.postcode.substring(0, 3);
        const premiumNotificationCount = 3;

        return {
          success: true,
          valuationId,
          lockedUntil: lockedUntil.toISOString(),
          leadState: 'ACCEPTED_VALUATION' as const,
          premiumNotificationCount,
          message: 'Your Valory valuation has been accepted and locked for 12 months.',
        };
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      }

      try {
        // 1. Create the valuation request with locked status
        const insertResult = await db.insert(valuationRequests).values({
          vendorId,
          propertyData: {
            address: input.address,
            postcode: input.postcode,
            type: input.propertyBasics?.propertyType || 'house',
          },
          status: 'accepted',
          estimatedPriceLow: String(input.estimatedPriceLow),
          estimatedPriceHigh: String(input.estimatedPriceHigh),
          estimatedMidpoint: String(input.estimatedMidpoint),
          confidence: input.confidence,
          acceptedAt: now,
          lockedUntil,
          leadState: 'ACCEPTED_VALUATION',
          propertyBasics: input.propertyBasics || null,
          propertyFeatures: input.propertyFeatures || null,
          reasoning: `Valory valuation accepted by vendor on ${now.toISOString()}. Locked until ${lockedUntil.toISOString()}.`,
        } as any);

        const valuationId = (insertResult as any)[0]?.insertId || (insertResult as any).insertId;

        // 2. Upsert vendor lead state
        const existingLead = await db.select()
          .from(vendorLeadStates)
          .where(eq(vendorLeadStates.vendorId, vendorId))
          .limit(1);

        const previousState = existingLead.length > 0 ? existingLead[0].state : null;

        if (existingLead.length > 0) {
          await db.update(vendorLeadStates)
            .set({
              state: 'ACCEPTED_VALUATION',
              stateChangedAt: now,
              notes: `Valuation accepted. Locked until ${lockedUntil.toLocaleDateString()}.`,
            } as any)
            .where(eq(vendorLeadStates.vendorId, vendorId));
        } else {
          await db.insert(vendorLeadStates).values({
            vendorId,
            propertyId: valuationId,
            state: 'ACCEPTED_VALUATION',
            stateChangedAt: now,
            notes: `Valuation accepted. Locked until ${lockedUntil.toLocaleDateString()}.`,
          } as any);
        }

        // 3. Audit log the state transition
        await db.insert(leadStateAuditLog).values({
          vendorId,
          propertyId: valuationId,
          previousState: previousState || 'NONE',
          newState: 'ACCEPTED_VALUATION',
          reason: 'Vendor accepted Valory valuation',
          triggeredBy: 'vendor',
        } as any);

        // 4. Create anonymised early lead signal for PREMIUM agents only
        const postcodeSector = input.postcode.split(' ')[0] || input.postcode.substring(0, 3);
        const bracketLow = Math.round(input.estimatedPriceLow / 25000) * 25000;
        const bracketHigh = Math.round(input.estimatedPriceHigh / 25000) * 25000;

        await db.insert(premiumEarlyLeadSignals).values({
          propertyId: valuationId,
          vendorId,
          postcodeSector,
          valuationBracketLow: String(bracketLow),
          valuationBracketHigh: String(bracketHigh),
          propertyType: input.propertyBasics?.propertyType || 'house',
          readinessStage: 'NEARLY_READY',
          launchTiming: 'Next 2 weeks',
          confidenceLevel: input.confidence,
          expiresAt: new Date(now.getTime() + SIGNAL_EXPIRY_MS),
        } as any);

        // 5. Count premium agents eligible for early notification
        const premiumAgents = await db.select()
          .from(agentSubscriptions)
          .where(eq(agentSubscriptions.status, 'active'))
          .limit(50);

        let premiumNotificationCount = 0;
        for (const agent of premiumAgents) {
          if (agent.tier === 'tier1' || agent.tier === 'tier2') {
            premiumNotificationCount++;
          }
        }

        // 6. Create vendor launch profile placeholder (60% without photos)
        await db.insert(vendorLaunchProfiles).values({
          vendorId,
          propertyId: valuationId,
          keyFeatures: input.propertyBasics || null,
          condition: input.propertyFeatures?.condition || null,
          improvements: input.propertyFeatures?.improvements ? [{ item: input.propertyFeatures.improvements }] : null,
          completionPercentage: 60,
        } as any);

        // 7. Notify platform owner (non-blocking)
        try {
          await notifyOwner({
            title: `New Valuation Accepted — ${postcodeSector}`,
            content: `A vendor has accepted their Valory valuation for a property in ${postcodeSector}.\n\nValuation: £${input.estimatedPriceLow.toLocaleString()} – £${input.estimatedPriceHigh.toLocaleString()} (midpoint: £${input.estimatedMidpoint.toLocaleString()})\nConfidence: ${input.confidence}\nProperty type: ${input.propertyBasics?.propertyType || 'Not specified'}\n\n${premiumNotificationCount} premium agent(s) eligible for early lead visibility.\nStandard agents will be notified once the vendor completes their launch profile.`,
          });
        } catch (e) {
          console.warn('[VendorAcceptance] Owner notification failed:', e);
        }

        return {
          success: true,
          valuationId,
          lockedUntil: lockedUntil.toISOString(),
          leadState: 'ACCEPTED_VALUATION' as const,
          premiumNotificationCount,
          message: 'Your Valory valuation has been accepted and locked for 12 months.',
        };
      } catch (error) {
        console.error('[VendorAcceptance] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to accept valuation. Please try again.',
        });
      }
    }),

  /**
   * Get vendor dashboard data
   * Returns the vendor's accepted valuation, lead state, profile completion checklist,
   * agent interest, and next steps — with profile completion as the primary emphasis.
   */
  getDashboard: vendorProcedure
    .input(getVendorDashboardSchema.optional())
    .query(async ({ ctx, input }) => {
      const vendorId = ctx.user!.id;

      // In demo mode, return mock dashboard
      if (DEMO_MODE) {
        const valuation = DEMO_VALUATIONS[0];
        const profileChecklist = [
          { id: 'valuation_accepted', label: 'Valuation accepted', description: 'Your Valory valuation is locked for 12 months.', completed: true },
          { id: 'address_confirmed', label: 'Address confirmed', description: 'Your property address and postcode are on record.', completed: true },
          { id: 'property_basics', label: 'Property basics', description: 'Type, bedrooms, bathrooms, and other key details.', completed: true },
          { id: 'property_features', label: 'Features and condition', description: 'Condition, EPC rating, and notable features.', completed: true },
          { id: 'property_photos', label: 'Property photos', description: 'At least one front-of-house photo to complete your profile.', completed: false },
        ] as ProfileCheckResult[];

        return {
          hasValuation: true,
          valuation: {
            id: 1,
            status: 'accepted',
            estimatedPriceLow: 700000,
            estimatedPriceHigh: 800000,
            estimatedMidpoint: 750000,
            confidence: 'high',
            acceptedAt: '2024-02-10T11:30:00Z',
          },
          leadState: {
            state: 'ACCEPTED_VALUATION',
            stateChangedAt: '2024-02-10T11:30:00Z',
          },
          launchProfile: null,
          profileChecklist,
          profileComplete: false,
          completionPercentage: 80,
          agentInterest: { total: 0, expressed: 0, premiumOnly: true },
          nextSteps: ['Upload at least one property photo to complete your profile and open full agent matching.'],
        };
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      }

      try {
        // Get the latest accepted valuation
        const valuations = await db.select()
          .from(valuationRequests)
          .where(
            and(
              eq(valuationRequests.vendorId, vendorId),
              eq(valuationRequests.status, 'accepted')
            )
          )
          .orderBy(desc(valuationRequests.createdAt))
          .limit(1);

        if (!valuations.length) {
          return {
            hasValuation: false,
            valuation: null,
            leadState: null,
            launchProfile: null,
            profileChecklist: [] as ProfileCheckResult[],
            profileComplete: false,
            completionPercentage: 0,
            agentInterest: { total: 0, expressed: 0, premiumOnly: true },
            nextSteps: ['Complete your property valuation to get started.'],
          };
        }

        const valuation = valuations[0];

        // Get lead state
        const leadStates = await db.select()
          .from(vendorLeadStates)
          .where(eq(vendorLeadStates.vendorId, vendorId))
          .limit(1);

        const leadState = leadStates.length > 0 ? leadStates[0] : null;

        // Get launch profile
        const profiles = await db.select()
          .from(vendorLaunchProfiles)
          .where(eq(vendorLaunchProfiles.vendorId, vendorId))
          .orderBy(desc(vendorLaunchProfiles.createdAt))
          .limit(1);

        const launchProfile = profiles.length > 0 ? profiles[0] : null;

        // Evaluate profile completion checklist
        const profileChecklist = evaluateProfileCompletion(valuation, launchProfile);
        const completionPercentage = computeCompletionPercentage(profileChecklist);
        const profileComplete = isProfileComplete(profileChecklist);

        // Get agent interest count
        const interestCount = await db.select({
          total: sql<number>`COUNT(*)`,
          expressed: sql<number>`SUM(CASE WHEN status = 'expressed' THEN 1 ELSE 0 END)`,
        })
          .from(agentInterestExpressions)
          .where(eq(agentInterestExpressions.valuationRequestId, valuation.id));

        const currentState = leadState?.state || valuation.leadState || 'ACCEPTED_VALUATION';
        const isPremiumOnly = currentState !== 'READY_FOR_AGENT_MATCH';

        const agentInterest = {
          total: Number(interestCount[0]?.total || 0),
          expressed: Number(interestCount[0]?.expressed || 0),
          premiumOnly: isPremiumOnly,
        };

        // Determine next steps based on profile completion
        const nextSteps: string[] = [];
        const incompleteItems = profileChecklist.filter(c => !c.completed);

        if (incompleteItems.length > 0) {
          nextSteps.push('Complete your launch profile to unlock full agent matching.');
          for (const item of incompleteItems) {
            nextSteps.push(item.description);
          }
        } else if (currentState === 'ACCEPTED_VALUATION') {
          nextSteps.push('Your profile is complete! Click "Launch Profile" to go live with all agents.');
        } else if (currentState === 'READY_FOR_AGENT_MATCH') {
          nextSteps.push('Your profile is live. All agents in your area can now express interest.');
          nextSteps.push('Sit tight — you\'ll be notified when agents want to connect.');
        }

        // Extract address/postcode from propertyData JSON
        const propertyData = valuation.propertyData as any || {};

        return {
          hasValuation: true,
          valuation: {
            id: valuation.id,
            address: propertyData.address || '',
            postcode: propertyData.postcode || '',
            estimatedPriceLow: valuation.estimatedPriceLow ? Number(valuation.estimatedPriceLow) : null,
            estimatedPriceHigh: valuation.estimatedPriceHigh ? Number(valuation.estimatedPriceHigh) : null,
            estimatedMidpoint: valuation.estimatedMidpoint ? Number(valuation.estimatedMidpoint) : null,
            confidence: valuation.confidence,
            acceptedAt: valuation.acceptedAt?.toISOString() || null,
            lockedUntil: valuation.lockedUntil?.toISOString() || null,
            isLocked: valuation.lockedUntil ? new Date(valuation.lockedUntil) > new Date() : false,
            leadState: valuation.leadState,
            propertyBasics: valuation.propertyBasics,
            propertyFeatures: valuation.propertyFeatures,
            hasPhotos: valuation.hasPhotos,
          },
          leadState: leadState ? {
            state: leadState.state,
            stateChangedAt: leadState.stateChangedAt?.toISOString(),
            notes: leadState.notes,
          } : null,
          launchProfile: launchProfile ? {
            id: launchProfile.id,
            images: launchProfile.images,
            completionPercentage,
          } : null,
          profileChecklist,
          profileComplete,
          completionPercentage,
          agentInterest,
          nextSteps,
        };
      } catch (error) {
        console.error('[VendorAcceptance] Dashboard error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load dashboard data.',
        });
      }
    }),

  /**
   * Upload property photos (part of launch profile completion)
   * Updates the valuation and launch profile with photo data.
   * Does NOT automatically advance to READY_FOR_AGENT_MATCH —
   * the vendor must explicitly complete their profile via completeProfile.
   */
  uploadPhotos: vendorProcedure
    .input(uploadPhotosSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      }

      const vendorId = ctx.user!.id;

      try {
        // Update valuation request
        await db.update(valuationRequests)
          .set({ hasPhotos: true } as any)
          .where(
            and(
              eq(valuationRequests.id, input.valuationId),
              eq(valuationRequests.vendorId, vendorId)
            )
          );

        // Update launch profile with photos
        const profiles = await db.select()
          .from(vendorLaunchProfiles)
          .where(eq(vendorLaunchProfiles.vendorId, vendorId))
          .orderBy(desc(vendorLaunchProfiles.createdAt))
          .limit(1);

        if (profiles.length > 0) {
          const images = input.photoUrls.map(url => ({ url, caption: '' }));
          await db.update(vendorLaunchProfiles)
            .set({ images } as any)
            .where(eq(vendorLaunchProfiles.id, profiles[0].id));
        }

        return {
          success: true,
          message: 'Photos uploaded successfully. Review your profile to go live.',
        };
      } catch (error) {
        console.error('[VendorAcceptance] Photo upload error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upload photos.',
        });
      }
    }),

  /**
   * Complete Launch Profile
   * This is the explicit action that:
   * - Validates all profile criteria are met
   * - Transitions lead state to READY_FOR_AGENT_MATCH
   * - Notifies ALL relevant agents (not just premium)
   * - Opens the full agent matching process
   */
  completeProfile: vendorProcedure
    .input(completeProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      }

      const vendorId = ctx.user!.id;
      const now = new Date();

      try {
        // 1. Get the valuation
        const valuations = await db.select()
          .from(valuationRequests)
          .where(
            and(
              eq(valuationRequests.id, input.valuationId),
              eq(valuationRequests.vendorId, vendorId),
              eq(valuationRequests.status, 'accepted')
            )
          )
          .limit(1);

        if (!valuations.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No accepted valuation found.',
          });
        }

        const valuation = valuations[0];

        // 2. Get launch profile
        const profiles = await db.select()
          .from(vendorLaunchProfiles)
          .where(eq(vendorLaunchProfiles.vendorId, vendorId))
          .orderBy(desc(vendorLaunchProfiles.createdAt))
          .limit(1);

        const launchProfile = profiles.length > 0 ? profiles[0] : null;

        // 3. Evaluate completion
        const checklist = evaluateProfileCompletion(valuation, launchProfile);
        const allComplete = isProfileComplete(checklist);

        if (!allComplete) {
          const incomplete = checklist.filter(c => !c.completed).map(c => c.label);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Profile is not complete. Missing: ${incomplete.join(', ')}`,
          });
        }

        // 4. Transition lead state to READY_FOR_AGENT_MATCH
        const existingLead = await db.select()
          .from(vendorLeadStates)
          .where(eq(vendorLeadStates.vendorId, vendorId))
          .limit(1);

        if (existingLead.length > 0) {
          await db.update(vendorLeadStates)
            .set({
              state: 'READY_FOR_AGENT_MATCH',
              stateChangedAt: now,
              notes: 'Launch profile completed. Full agent matching activated.',
            } as any)
            .where(eq(vendorLeadStates.vendorId, vendorId));
        }

        // 5. Audit log
        await db.insert(leadStateAuditLog).values({
          vendorId,
          propertyId: input.valuationId,
          previousState: 'ACCEPTED_VALUATION',
          newState: 'READY_FOR_AGENT_MATCH',
          reason: 'Vendor completed launch profile — full agent matching activated',
          triggeredBy: 'vendor',
        } as any);

        // 6. Update valuation lead state
        await db.update(valuationRequests)
          .set({ leadState: 'READY_FOR_AGENT_MATCH' } as any)
          .where(eq(valuationRequests.id, input.valuationId));

        // 7. Update launch profile completion
        if (launchProfile) {
          await db.update(vendorLaunchProfiles)
            .set({ completionPercentage: 100 } as any)
            .where(eq(vendorLaunchProfiles.id, launchProfile.id));
        }

        // 8. Notify ALL relevant agents (not just premium)
        const allAgents = await db.select()
          .from(agentSubscriptions)
          .where(eq(agentSubscriptions.status, 'active'))
          .limit(100);

        let totalAgentsNotified = allAgents.length;

        // 9. Notify platform owner about full launch
        const propertyData = valuation.propertyData as any || {};
        const postcodeSector = (propertyData.postcode || '').split(' ')[0] || 'Unknown';

        try {
          await notifyOwner({
            title: `Launch Profile Complete — ${postcodeSector}`,
            content: `A vendor has completed their launch profile for a property in ${postcodeSector}.\n\nValuation: £${Number(valuation.estimatedPriceLow || 0).toLocaleString()} – £${Number(valuation.estimatedPriceHigh || 0).toLocaleString()}\nLead state: READY_FOR_AGENT_MATCH\n\n${totalAgentsNotified} agent(s) have been notified. Full agent matching is now active.`,
          });
        } catch (e) {
          console.warn('[VendorAcceptance] Owner notification failed:', e);
        }

        return {
          success: true,
          leadState: 'READY_FOR_AGENT_MATCH' as const,
          completionPercentage: 100,
          totalAgentsNotified,
          message: 'Your launch profile is complete. All relevant agents have been notified.',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('[VendorAcceptance] Complete profile error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to complete profile. Please try again.',
        });
      }
    }),

  /**
   * Get lead state history for the vendor
   */
  getLeadHistory: vendorProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      }

      try {
        const history = await db.select()
          .from(leadStateAuditLog)
          .where(eq(leadStateAuditLog.vendorId, ctx.user!.id))
          .orderBy(desc(leadStateAuditLog.createdAt))
          .limit(20);

        return history.map(entry => ({
          previousState: entry.previousState,
          newState: entry.newState,
          reason: entry.reason,
          triggeredBy: entry.triggeredBy,
          createdAt: entry.createdAt.toISOString(),
        }));
      } catch (error) {
        console.error('[VendorAcceptance] Lead history error:', error);
        return [];
      }
    }),
});
