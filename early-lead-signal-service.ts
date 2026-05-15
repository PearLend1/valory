import { eq } from 'drizzle-orm';
import { premiumEarlyLeadSignals, properties, vendorLeadStates } from '../drizzle/schema';
import type { InsertPremiumEarlyLeadSignal } from '../drizzle/schema';
import { getReadinessStage, getLaunchTiming } from './lead-state-manager';

/**
 * Extract postcode sector from full postcode
 * Examples: "TA20 1AB" → "TA20", "SW1A 1AA" → "SW1A"
 */
export function extractPostcodeSector(postcode: string): string {
  const cleaned = postcode.replace(/\s/g, '').toUpperCase();
  // UK postcodes: 1-2 letters + 1-2 digits + optional letter = outcode
  // Sector = outcode + first digit of incode
  const match = cleaned.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)\d/);
  return match ? match[1] : cleaned.substring(0, 3);
}

/**
 * Create valuation bracket label from price range
 * Examples: 250000 → "£250k-£300k", 500000 → "£500k-£550k"
 */
export function createValuationBracket(
  estimatedLow: number,
  estimatedHigh: number
): { label: string; low: number; high: number } {
  const roundToNearestK = (price: number) => Math.round(price / 1000) * 1000;
  const low = roundToNearestK(estimatedLow);
  const high = roundToNearestK(estimatedHigh);

  const formatK = (price: number) => {
    const k = Math.round(price / 1000);
    return `£${k}k`;
  };

  return {
    label: `${formatK(low)}-${formatK(high)}`,
    low,
    high,
  };
}

/**
 * Generate an anonymised early lead signal when vendor reaches REGISTERED or PROFILE_IN_PROGRESS
 */
export async function generateEarlyLeadSignal(
  db: any,
  vendorId: number,
  propertyId: number,
  estimatedPriceLow: number,
  estimatedPriceHigh: number,
  confidenceLevel: 'low' | 'medium' | 'high',
  profileCompletionPercentage: number = 0
): Promise<{ success: boolean; error?: string; signalId?: number }> {
  try {
    // Get property details
    const propertyResult = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!propertyResult.length) {
      return { success: false, error: 'Property not found' };
    }

    const property = propertyResult[0];

    // Get current lead state
    const leadStateResult = await db
      .select()
      .from(vendorLeadStates)
      .where(eq(vendorLeadStates.propertyId, propertyId))
      .limit(1);

    if (!leadStateResult.length) {
      return { success: false, error: 'Lead state not found' };
    }

    const leadState = leadStateResult[0];
    const readinessStage = getReadinessStage(leadState.state);
    const launchTiming = getLaunchTiming(leadState.state, profileCompletionPercentage);

    // Extract postcode sector
    const postcodeSector = extractPostcodeSector(property.postcode);

    // Create valuation bracket
    const bracket = createValuationBracket(estimatedPriceLow, estimatedPriceHigh);

    // Set signal expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Check if signal already exists for this property
    const existingSignal = await db
      .select()
      .from(premiumEarlyLeadSignals)
      .where(eq(premiumEarlyLeadSignals.propertyId, propertyId))
      .limit(1);

    let signalId: number;

    if (existingSignal.length > 0) {
      // Update existing signal
      await db
        .update(premiumEarlyLeadSignals)
        .set({
          readinessStage,
          launchTiming,
          confidenceLevel,
          expiresAt,
        })
        .where(eq(premiumEarlyLeadSignals.propertyId, propertyId));

      signalId = existingSignal[0].id;
    } else {
      // Create new signal
      const signalData: any = {
        propertyId,
        vendorId,
        postcodeSector,
        valuationBracketLow: bracket.low as any,
        valuationBracketHigh: bracket.high as any,
        propertyType: property.propertyType || 'property',
        readinessStage,
        launchTiming,
        confidenceLevel,
        agentNotifications: 0,
        expiresAt,
      };

      const result = await db.insert(premiumEarlyLeadSignals).values(signalData);
      signalId = (result[0] as any).insertId;
    }

    return { success: true, signalId };
  } catch (error) {
    console.error('Error generating early lead signal:', error);
    return { success: false, error: 'Failed to generate early lead signal' };
  }
}

/**
 * Get anonymised early lead signal for premium agent display
 * Returns only non-identifying information
 */
export async function getAnonymisedLeadSignal(db: any, signalId: number): Promise<any | null> {
  const result = await db
    .select()
    .from(premiumEarlyLeadSignals)
    .where(eq(premiumEarlyLeadSignals.id, signalId))
    .limit(1);

  if (!result.length) {
    return null;
  }

  const signal = result[0];

  // Return only anonymised fields
  return {
    id: signal.id,
    postcodeSector: signal.postcodeSector,
    valuationBracket: `£${Math.round(signal.valuationBracketLow / 1000)}k-£${Math.round(signal.valuationBracketHigh / 1000)}k`,
    propertyType: signal.propertyType,
    readinessStage: signal.readinessStage,
    readinessLabel: getReadinessLabel(signal.readinessStage),
    launchTiming: signal.launchTiming,
    confidenceLevel: signal.confidenceLevel,
    agentNotifications: signal.agentNotifications,
    createdAt: signal.createdAt,
    expiresAt: signal.expiresAt,
    daysUntilExpiry: Math.ceil((signal.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  };
}

/**
 * Get human-readable label for readiness stage
 */
export function getReadinessLabel(stage: 'EARLY_INTEREST' | 'PROFILE_BUILDING' | 'NEARLY_READY'): string {
  switch (stage) {
    case 'EARLY_INTEREST':
      return 'Early Interest - Vendor just registered';
    case 'PROFILE_BUILDING':
      return 'Profile Building - Vendor actively preparing';
    case 'NEARLY_READY':
      return 'Nearly Ready - Vendor ready for agent match';
  }
}

/**
 * Increment agent notification count when agent clicks "Notify Me"
 */
export async function incrementAgentNotificationCount(db: any, signalId: number): Promise<boolean> {
  try {
    const signal = await db
      .select()
      .from(premiumEarlyLeadSignals)
      .where(eq(premiumEarlyLeadSignals.id, signalId))
      .limit(1);

    if (!signal.length) {
      return false;
    }

    await db
      .update(premiumEarlyLeadSignals)
      .set({
        agentNotifications: (signal[0].agentNotifications || 0) + 1,
      })
      .where(eq(premiumEarlyLeadSignals.id, signalId));

    return true;
  } catch (error) {
    console.error('Error incrementing agent notification count:', error);
    return false;
  }
}

/**
 * Clean up expired early lead signals (older than 30 days)
 */
export async function cleanupExpiredSignals(db: any): Promise<{ deleted: number }> {
  try {
    const now = new Date();
    const result = await db
      .delete(premiumEarlyLeadSignals)
      .where((table: any) => table.expiresAt < now);

    return { deleted: result.rowsAffected || 0 };
  } catch (error) {
    console.error('Error cleaning up expired signals:', error);
    return { deleted: 0 };
  }
}

/**
 * Get early lead signals for a specific postcode sector (for premium agents)
 */
export async function getLeadSignalsForPostcode(
  db: any,
  postcodeSector: string,
  limit: number = 20
): Promise<any[]> {
  try {
    const now = new Date();
    const results = await db
      .select()
      .from(premiumEarlyLeadSignals)
      .where((table: any) =>
        and(
          eq(table.postcodeSector, postcodeSector),
          (table.expiresAt as any).gt(now)
        )
      )
      .limit(limit);

    return Promise.all(results.map((signal: any) => getAnonymisedLeadSignal(db, signal.id)));
  } catch (error) {
    console.error('Error fetching lead signals for postcode:', error);
    return [];
  }
}

/**
 * Get early lead signals by property type (for premium agents)
 */
export async function getLeadSignalsByPropertyType(
  db: any,
  propertyType: string,
  limit: number = 20
): Promise<any[]> {
  try {
    const now = new Date();
    const results = await db
      .select()
      .from(premiumEarlyLeadSignals)
      .where((table: any) =>
        and(
          eq(table.propertyType, propertyType),
          (table.expiresAt as any).gt(now)
        )
      )
      .limit(limit);

    return Promise.all(results.map((signal: any) => getAnonymisedLeadSignal(db, signal.id)));
  } catch (error) {
    console.error('Error fetching lead signals by property type:', error);
    return [];
  }
}

/**
 * Get early lead signals by valuation range (for premium agents)
 */
export async function getLeadSignalsByValuation(
  db: any,
  minPrice: number,
  maxPrice: number,
  limit: number = 20
): Promise<any[]> {
  try {
    const now = new Date();
    const results = await db
      .select()
      .from(premiumEarlyLeadSignals)
      .where((table: any) =>
        and(
          (table.valuationBracketLow as any).gte(minPrice),
          (table.valuationBracketHigh as any).lte(maxPrice),
          (table.expiresAt as any).gt(now)
        )
      )
      .limit(limit);

    return Promise.all(results.map((signal: any) => getAnonymisedLeadSignal(db, signal.id)));
  } catch (error) {
    console.error('Error fetching lead signals by valuation:', error);
    return [];
  }
}

// Import and for type checking
import { and } from 'drizzle-orm';
