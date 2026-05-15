import { eq, and } from 'drizzle-orm';
import { vendorLeadStates, leadStateAuditLog, premiumEarlyLeadSignals } from '../drizzle/schema';
import type { VendorLeadState, InsertVendorLeadState, LeadStateAuditLog, InsertLeadStateAuditLog } from '../drizzle/schema';

export type LeadState = 'REGISTERED' | 'PROFILE_IN_PROGRESS' | 'READY_FOR_AGENT_MATCH' | 'PAUSED' | 'WITHDRAWN';

export interface LeadStateTransition {
  from: LeadState | null;
  to: LeadState;
  allowedTransitions: LeadState[];
}

/**
 * Define valid state transitions
 * Prevents invalid state progressions
 */
const STATE_TRANSITIONS: Record<LeadState, LeadState[]> = {
  REGISTERED: ['PROFILE_IN_PROGRESS', 'PAUSED', 'WITHDRAWN'],
  PROFILE_IN_PROGRESS: ['READY_FOR_AGENT_MATCH', 'PAUSED', 'WITHDRAWN', 'REGISTERED'],
  READY_FOR_AGENT_MATCH: ['PAUSED', 'WITHDRAWN'],
  PAUSED: ['PROFILE_IN_PROGRESS', 'READY_FOR_AGENT_MATCH', 'WITHDRAWN'],
  WITHDRAWN: [], // Terminal state
};

/**
 * Get the readiness stage for premium agent signals based on lead state
 */
export function getReadinessStage(state: LeadState): 'EARLY_INTEREST' | 'PROFILE_BUILDING' | 'NEARLY_READY' {
  switch (state) {
    case 'REGISTERED':
      return 'EARLY_INTEREST';
    case 'PROFILE_IN_PROGRESS':
      return 'PROFILE_BUILDING';
    case 'READY_FOR_AGENT_MATCH':
      return 'NEARLY_READY';
    case 'PAUSED':
    case 'WITHDRAWN':
      return 'EARLY_INTEREST'; // Default fallback
  }
}

/**
 * Get launch timing estimate based on lead state
 */
export function getLaunchTiming(state: LeadState, profileCompletionPercentage: number): string {
  if (state === 'READY_FOR_AGENT_MATCH') {
    return 'This week';
  }
  if (profileCompletionPercentage > 75) {
    return 'Next 2 weeks';
  }
  return 'Next month';
}

/**
 * Validate state transition
 */
export function isValidTransition(from: LeadState | null, to: LeadState): boolean {
  if (!from) {
    // Initial state must be REGISTERED
    return to === 'REGISTERED';
  }
  return STATE_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Create or update lead state with audit logging
 */
export async function transitionLeadState(
  db: any,
  vendorId: number,
  propertyId: number,
  newState: LeadState,
  reason?: string,
  triggeredBy: string = 'vendor'
): Promise<{ success: boolean; error?: string; leadState?: VendorLeadState }> {
  try {
    // Get current state
    const currentLeadState = await db
      .select()
      .from(vendorLeadStates)
      .where(and(eq(vendorLeadStates.vendorId, vendorId), eq(vendorLeadStates.propertyId, propertyId)))
      .limit(1);

    const previousState = currentLeadState[0]?.state || null;

    // Validate transition
    if (!isValidTransition(previousState, newState)) {
      return {
        success: false,
        error: `Invalid state transition from ${previousState || 'null'} to ${newState}`,
      };
    }

    // Update or insert lead state
    let leadState: VendorLeadState;
    if (currentLeadState.length > 0) {
      await db
        .update(vendorLeadStates)
        .set({
          state: newState,
          stateChangedAt: new Date(),
          notes: reason,
        })
        .where(and(eq(vendorLeadStates.vendorId, vendorId), eq(vendorLeadStates.propertyId, propertyId)));

      leadState = { ...currentLeadState[0], state: newState, stateChangedAt: new Date(), notes: reason || null };
    } else {
      const result = await db.insert(vendorLeadStates).values({
        vendorId,
        propertyId,
        state: newState,
        notes: reason || null,
      });

      leadState = {
        id: result[0].insertId,
        vendorId,
        propertyId,
        state: newState,
        stateChangedAt: new Date(),
        notes: reason || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Log state change
    await db.insert(leadStateAuditLog).values({
      vendorId,
      propertyId,
      previousState,
      newState,
      reason,
      triggeredBy,
    });

    return { success: true, leadState };
  } catch (error) {
    console.error('Error transitioning lead state:', error);
    return {
      success: false,
      error: 'Failed to transition lead state',
    };
  }
}

/**
 * Get current lead state for a vendor property
 */
export async function getLeadState(
  db: any,
  vendorId: number,
  propertyId: number
): Promise<VendorLeadState | null> {
  const result = await db
    .select()
    .from(vendorLeadStates)
    .where(and(eq(vendorLeadStates.vendorId, vendorId), eq(vendorLeadStates.propertyId, propertyId)))
    .limit(1);

  return result[0] || null;
}

/**
 * Get all leads in a specific state
 */
export async function getLeadsByState(db: any, state: LeadState, limit: number = 100): Promise<VendorLeadState[]> {
  return db
    .select()
    .from(vendorLeadStates)
    .where(eq(vendorLeadStates.state, state))
    .limit(limit);
}

/**
 * Get active early lead signals (not expired)
 */
export async function getActiveEarlyLeadSignals(db: any, limit: number = 100): Promise<any[]> {
  const now = new Date();
  return db
    .select()
    .from(premiumEarlyLeadSignals)
    .where((table: any) => (table.expiresAt as any).gt(now))
    .limit(limit);
}

/**
 * Get early lead signals by postcode sector for premium agents
 */
export async function getEarlyLeadSignalsByPostcode(
  db: any,
  postcodeSector: string,
  limit: number = 50
): Promise<any[]> {
  const now = new Date();
  return db
    .select()
    .from(premiumEarlyLeadSignals)
    .where((table: any) =>
      and(
        eq(table.postcodeSector, postcodeSector),
        (table.expiresAt as any).gt(now)
      )
    )
    .limit(limit);
}

/**
 * Get early lead signals by readiness stage
 */
export async function getEarlyLeadSignalsByReadiness(
  db: any,
  readinessStage: 'EARLY_INTEREST' | 'PROFILE_BUILDING' | 'NEARLY_READY',
  limit: number = 50
): Promise<any[]> {
  const now = new Date();
  return db
    .select()
    .from(premiumEarlyLeadSignals)
    .where((table: any) =>
      and(
        eq(table.readinessStage, readinessStage),
        (table.expiresAt as any).gt(now)
      )
    )
    .limit(limit);
}

/**
 * Get state transition history for a vendor property
 */
export async function getStateHistory(db: any, vendorId: number, propertyId: number): Promise<LeadStateAuditLog[]> {
  return db
    .select()
    .from(leadStateAuditLog)
    .where(and(eq(leadStateAuditLog.vendorId, vendorId), eq(leadStateAuditLog.propertyId, propertyId)))
    .orderBy((table: any) => table.createdAt);
}

/**
 * Check if vendor is ready for agent matching
 */
export function isReadyForAgentMatch(leadState: VendorLeadState): boolean {
  return leadState.state === 'READY_FOR_AGENT_MATCH';
}

/**
 * Check if lead is active (not paused or withdrawn)
 */
export function isLeadActive(leadState: VendorLeadState): boolean {
  return leadState.state !== 'PAUSED' && leadState.state !== 'WITHDRAWN';
}

/**
 * Get state description for UI display
 */
export function getStateDescription(state: LeadState): string {
  switch (state) {
    case 'REGISTERED':
      return 'Valuation completed. Build your launch profile to attract agent interest.';
    case 'PROFILE_IN_PROGRESS':
      return 'Your profile is being built. Premium agents can see early signals.';
    case 'READY_FOR_AGENT_MATCH':
      return 'Your property is ready for agent matching and full visibility.';
    case 'PAUSED':
      return 'Your profile is paused. You can resume at any time.';
    case 'WITHDRAWN':
      return 'Your profile has been withdrawn from the platform.';
  }
}
