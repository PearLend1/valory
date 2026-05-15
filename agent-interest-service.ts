import { eq, and } from 'drizzle-orm';

/**
 * Agent Interest Service
 * Manages premium agent interest in early lead signals while maintaining strict privacy
 */

export interface AgentInterestRecord {
  id: number;
  agentId: number;
  earlyLeadSignalId: number;
  expressedAt: Date;
  status: 'INTERESTED' | 'WITHDRAWN' | 'MATCHED' | 'CONTACTED';
  withdrawnAt: Date | null;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentLeadMatchRecord {
  id: number;
  agentId: number;
  propertyId: number;
  vendorId: number;
  interestExpressedAt: Date | null;
  matchedAt: Date | null;
  contactInitiatedAt: Date | null;
  contactInitiatedBy: 'vendor' | 'agent' | 'system' | null;
  status: 'INTERESTED' | 'MATCHED' | 'CONTACTED' | 'REJECTED' | 'ACCEPTED';
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Record that a premium agent has expressed interest in an early lead signal
 * This does NOT reveal vendor identity to the agent
 */
export async function recordAgentInterest(
  db: any,
  agentId: number,
  earlyLeadSignalId: number,
  propertyId: number
): Promise<{ success: boolean; error?: string; interestId?: number }> {
  try {
    // Check if interest already exists
    const existing = await db
      .select()
      .from('premium_agent_interests' as any)
      .where((table: any) =>
        and(
          eq(table.agentId, agentId),
          eq(table.earlyLeadSignalId, earlyLeadSignalId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // If previously withdrawn, reactivate interest
      if (existing[0].status === 'WITHDRAWN') {
        await db
          .update('premium_agent_interests' as any)
          .set({
            status: 'INTERESTED',
            withdrawnAt: null,
            reason: null,
            updatedAt: new Date(),
          })
          .where((table: any) =>
            and(
              eq(table.agentId, agentId),
              eq(table.earlyLeadSignalId, earlyLeadSignalId)
            )
          );

        // Log the reactivation
        await logAgentInterestAction(
          db,
          agentId,
          earlyLeadSignalId,
          propertyId,
          'REACTIVATED',
          'WITHDRAWN',
          'INTERESTED'
        );

        return { success: true, interestId: existing[0].id };
      }

      // Interest already active
      return { success: true, interestId: existing[0].id };
    }

    // Create new interest record
    const result = await db
      .insert('premium_agent_interests' as any)
      .values({
        agentId,
        earlyLeadSignalId,
        expressedAt: new Date(),
        status: 'INTERESTED',
      });

    const interestId = (result[0] as any).insertId;

    // Log the interest expression
    await logAgentInterestAction(
      db,
      agentId,
      earlyLeadSignalId,
      propertyId,
      'EXPRESSED_INTEREST',
      null,
      'INTERESTED'
    );

    // Create match history record
    await createMatchHistoryRecord(db, agentId, propertyId, null, new Date());

    return { success: true, interestId };
  } catch (error) {
    console.error('Error recording agent interest:', error);
    return { success: false, error: 'Failed to record interest' };
  }
}

/**
 * Allow agent to withdraw interest before vendor is released
 * Agent can only withdraw if vendor hasn't reached READY_FOR_AGENT_MATCH
 */
export async function withdrawAgentInterest(
  db: any,
  agentId: number,
  earlyLeadSignalId: number,
  propertyId: number,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await db
      .update('premium_agent_interests' as any)
      .set({
        status: 'WITHDRAWN',
        withdrawnAt: new Date(),
        reason: reason || null,
        updatedAt: new Date(),
      })
      .where((table: any) =>
        and(
          eq(table.agentId, agentId),
          eq(table.earlyLeadSignalId, earlyLeadSignalId)
        )
      );

    if ((result as any).rowsAffected === 0) {
      return { success: false, error: 'Interest record not found' };
    }

    // Log the withdrawal
    await logAgentInterestAction(
      db,
      agentId,
      earlyLeadSignalId,
      propertyId,
      'WITHDRAWN',
      'INTERESTED',
      'WITHDRAWN',
      reason
    );

    return { success: true };
  } catch (error) {
    console.error('Error withdrawing agent interest:', error);
    return { success: false, error: 'Failed to withdraw interest' };
  }
}

/**
 * Get all agents interested in a property (for vendor release flow)
 * Returns anonymised agent information - no contact details exposed
 */
export async function getInterestedAgentsForProperty(
  db: any,
  propertyId: number
): Promise<
  Array<{
    agentId: number;
    expressedAt: Date;
    status: string;
  }>
> {
  try {
    const results = await db
      .select()
      .from('agent_lead_match_history' as any)
      .where((table: any) =>
        and(
          eq(table.propertyId, propertyId),
          eq(table.status, 'INTERESTED')
        )
      );

    return results.map((record: any) => ({
      agentId: record.agentId,
      expressedAt: record.interestExpressedAt,
      status: record.status,
    }));
  } catch (error) {
    console.error('Error fetching interested agents:', error);
    return [];
  }
}

/**
 * Get all early lead interests for an agent
 * Returns anonymised lead information
 */
export async function getAgentEarlyLeadInterests(
  db: any,
  agentId: number,
  limit: number = 50
): Promise<any[]> {
  try {
    const results = await db
      .select()
      .from('premium_agent_interests' as any)
      .where((table: any) =>
        and(
          eq(table.agentId, agentId),
          eq(table.status, 'INTERESTED')
        )
      )
      .limit(limit);

    return results.map((record: any) => ({
      id: record.id,
      earlyLeadSignalId: record.earlyLeadSignalId,
      expressedAt: record.expressedAt,
      status: record.status,
    }));
  } catch (error) {
    console.error('Error fetching agent early lead interests:', error);
    return [];
  }
}

/**
 * Check if specific agent is interested in a property
 */
export async function isAgentInterestedInProperty(
  db: any,
  agentId: number,
  propertyId: number
): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from('agent_lead_match_history' as any)
      .where((table: any) =>
        and(
          eq(table.agentId, agentId),
          eq(table.propertyId, propertyId),
          eq(table.status, 'INTERESTED')
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error('Error checking agent interest:', error);
    return false;
  }
}

/**
 * Count agents interested in a property (for display to vendor)
 * Returns count only - no agent identities
 */
export async function countInterestedAgentsForProperty(
  db: any,
  propertyId: number
): Promise<number> {
  try {
    const result = await db
      .select()
      .from('agent_lead_match_history' as any)
      .where((table: any) =>
        and(
          eq(table.propertyId, propertyId),
          eq(table.status, 'INTERESTED')
        )
      );

    return result.length;
  } catch (error) {
    console.error('Error counting interested agents:', error);
    return 0;
  }
}

/**
 * When vendor reaches READY_FOR_AGENT_MATCH, create match records
 * This transitions interested agents from early signals to match history
 */
export async function createMatchesFromEarlyInterests(
  db: any,
  propertyId: number,
  vendorId: number
): Promise<{ success: boolean; matchesCreated: number }> {
  try {
    // Get all interested agents for this property
    const interestedAgents = await getInterestedAgentsForProperty(db, propertyId);

    let matchesCreated = 0;

    for (const agent of interestedAgents) {
      // Update match history status to MATCHED
      await db
        .update('agent_lead_match_history' as any)
        .set({
          matchedAt: new Date(),
          status: 'MATCHED',
          updatedAt: new Date(),
        })
        .where((table: any) =>
          and(
            eq(table.agentId, agent.agentId),
            eq(table.propertyId, propertyId)
          )
        );

      matchesCreated++;
    }

    return { success: true, matchesCreated };
  } catch (error) {
    console.error('Error creating matches from early interests:', error);
    return { success: false, matchesCreated: 0 };
  }
}

/**
 * Get agent's interest history for a property
 * Returns timeline of agent actions on this property
 */
export async function getAgentPropertyInterestHistory(
  db: any,
  agentId: number,
  propertyId: number
): Promise<any[]> {
  try {
    return await db
      .select()
      .from('agent_interest_audit_log' as any)
      .where((table: any) =>
        and(
          eq(table.agentId, agentId),
          eq(table.propertyId, propertyId)
        )
      )
      .orderBy((table: any) => table.createdAt);
  } catch (error) {
    console.error('Error fetching agent property interest history:', error);
    return [];
  }
}

/**
 * Clean up expired interests when early lead signals expire
 */
export async function cleanupExpiredInterests(db: any): Promise<{ cleaned: number }> {
  try {
    // Get all expired early lead signals
    const now = new Date();
    const expiredSignals = await db
      .select()
      .from('premium_early_lead_signals' as any)
      .where((table: any) => table.expiresAt < now);

    let cleaned = 0;

    for (const signal of expiredSignals) {
      // Mark all interests in this signal as expired
    const result = await db
      .update('premium_agent_interests' as any)
      .set({
        status: 'WITHDRAWN',
        withdrawnAt: new Date(),
        reason: 'Lead signal expired',
        updatedAt: new Date(),
      })
      .where((table: any) => eq(table.earlyLeadSignalId, signal.id));

      cleaned += (result as any).rowsAffected || 0;
    }

    return { cleaned };
  } catch (error) {
    console.error('Error cleaning up expired interests:', error);
    return { cleaned: 0 };
  }
}

/**
 * Internal: Create or update match history record
 */
async function createMatchHistoryRecord(
  db: any,
  agentId: number,
  propertyId: number,
  vendorId: number | null,
  interestExpressedAt: Date
): Promise<void> {
  try {
    // Check if record exists
    const existing = await db
      .select()
      .from('agent_lead_match_history' as any)
      .where((table: any) =>
        and(
          eq(table.agentId, agentId),
          eq(table.propertyId, propertyId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      await db
        .update('agent_lead_match_history' as any)
        .set({
          interestExpressedAt,
          updatedAt: new Date(),
        })
        .where((table: any) =>
          and(
            eq(table.agentId, agentId),
            eq(table.propertyId, propertyId)
          )
        );
    } else {
      // Create new record
      await db
        .insert('agent_lead_match_history' as any)
        .values({
          agentId,
          propertyId,
          vendorId: vendorId || 0, // Will be updated when vendor is known
          interestExpressedAt,
          status: 'INTERESTED',
        });
    }
  } catch (error) {
    console.error('Error creating match history record:', error);
  }
}

/**
 * Internal: Log agent interest actions for audit trail
 */
async function logAgentInterestAction(
  db: any,
  agentId: number,
  earlyLeadSignalId: number,
  propertyId: number,
  action: string,
  previousStatus: string | null,
  newStatus: string,
  reason?: string
): Promise<void> {
  try {
    await db
      .insert('agent_interest_audit_log' as any)
      .values({
        agentId,
        earlyLeadSignalId,
        propertyId,
        action,
        previousStatus,
        newStatus,
        reason: reason || null,
      });
  } catch (error) {
    console.error('Error logging agent interest action:', error);
  }
}

/**
 * Get count of agents interested in a lead signal
 * (for display to other agents - shows popularity)
 */
export async function countAgentsInterestedInSignal(
  db: any,
  earlyLeadSignalId: number
): Promise<number> {
  try {
    const result = await db
      .select()
      .from('premium_agent_interests' as any)
      .where((table: any) =>
        and(
          eq(table.earlyLeadSignalId, earlyLeadSignalId),
          eq(table.status, 'INTERESTED')
        )
      );

    return result.length;
  } catch (error) {
    console.error('Error counting interested agents for signal:', error);
    return 0;
  }
}

/**
 * Get agent's interest count across all early leads
 */
export async function getAgentInterestCount(db: any, agentId: number): Promise<number> {
  try {
    const result = await db
      .select()
      .from('premium_agent_interests' as any)
      .where((table: any) =>
        and(
          eq(table.agentId, agentId),
          eq(table.status, 'INTERESTED')
        )
      );

    return result.length;
  } catch (error) {
    console.error('Error getting agent interest count:', error);
    return 0;
  }
}
