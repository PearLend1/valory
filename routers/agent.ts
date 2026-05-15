import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { agentProcedure } from '../_core/rbac';
import { getPool } from '../db';
import { DEMO_MODE } from '../demo-mode';
import { DEMO_PROPERTIES, DEMO_AGENT_STATS } from '../mock-data';

const GetActiveListingsSchema = z.object({
  agentId: z.number().positive('Agent ID must be positive'),
});

export const agentRouter = router({
  // Get agent's active listings with timeline events
  getActiveListings: agentProcedure
    .input(GetActiveListingsSchema)
    .query(async ({ input, ctx }) => {
      try {
        // In demo mode, return mock listings for the agent
        if (DEMO_MODE) {
          const properties = DEMO_PROPERTIES
            .filter(p => p.agentId === input.agentId)
            .map(p => ({
              ...p,
              images: [],
              timelineEvents: [],
              followerCount: p.saves,
            }));

          return properties;
        }

        const pool = await getPool();
        if (!pool) {
          throw new Error('Database not available');
        }

        // Get properties where agentId matches current user
        const propertiesQuery = `
          SELECT
            p.*,
            COUNT(DISTINCT sp.userId) as followerCount
          FROM properties p
          LEFT JOIN saved_properties sp ON p.id = sp.propertyId
          WHERE p.agentId = ?
          GROUP BY p.id
          ORDER BY p.createdAt DESC
        `;

        const [propertyRows] = await pool.query(propertiesQuery, [input.agentId]);
        const properties = (propertyRows as any[]) || [];

        // For each property, fetch timeline events
        const propertiesWithTimeline = await Promise.all(
          properties.map(async (property: any) => {
            const timelineQuery = `
              SELECT
                id,
                propertyId,
                eventType,
                timestamp,
                details
              FROM property_timeline_events
              WHERE propertyId = ?
              ORDER BY timestamp DESC
              LIMIT 50
            `;

            const [timelineRows] = await pool.query(timelineQuery, [property.id]);
            const timelineEvents = (timelineRows as any[])?.map((row: any) => ({
              ...row,
              details: row.details ? JSON.parse(row.details) : undefined,
            })) || [];

            // Parse images JSON
            let images = [];
            if (property.images) {
              try {
                images = JSON.parse(property.images);
              } catch (e) {
                images = [];
              }
            }

            return {
              ...property,
              images,
              timelineEvents,
            };
          })
        );

        return propertiesWithTimeline;
      } catch (error) {
        console.error('[Agent] Failed to fetch active listings:', error);
        throw new Error('Failed to fetch active listings');
      }
    }),

  // Get agent's statistics
  getStats: agentProcedure
    .query(async ({ ctx }) => {
      try {
        // In demo mode, return mock stats
        if (DEMO_MODE) {
          return DEMO_AGENT_STATS;
        }

        const pool = await getPool();
        if (!pool) {
          throw new Error('Database not available');
        }

        const agentId = ctx.user?.id;
        if (!agentId) {
          throw new Error('User not authenticated');
        }

        // Get total active listings
        const [listingsResult] = await pool.query(
          'SELECT COUNT(*) as count FROM properties WHERE agentId = ?',
          [agentId]
        );
        const totalListings = (listingsResult as any[])?.[0]?.count || 0;

        // Get total followers across all properties
        const [followersResult] = await pool.query(
          `SELECT COUNT(DISTINCT sp.userId) as count
           FROM saved_properties sp
           JOIN properties p ON sp.propertyId = p.id
           WHERE p.agentId = ?`,
          [agentId]
        );
        const totalFollowers = (followersResult as any[])?.[0]?.count || 0;

        // Get total timeline events
        const [eventsResult] = await pool.query(
          `SELECT COUNT(*) as count
           FROM property_timeline_events pte
           JOIN properties p ON pte.propertyId = p.id
           WHERE p.agentId = ?`,
          [agentId]
        );
        const totalEvents = (eventsResult as any[])?.[0]?.count || 0;

        return {
          totalListings,
          totalFollowers,
          totalEvents,
        };
      } catch (error) {
        console.error('[Agent] Failed to fetch stats:', error);
        throw new Error('Failed to fetch agent statistics');
      }
    }),
});
