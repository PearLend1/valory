import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getPool } from '../db';
import { DEMO_MODE } from '../demo-mode';
import { DEMO_TIMELINE_EVENTS } from '../mock-data';

// Zod schema for timeline event types
const TimelineEventTypeSchema = z.enum([
  'launched' as const,
  'viewing_booked' as const,
  'viewing_milestone' as const,
  'media_uploaded' as const,
  'price_adjusted' as const,
  'offer_received' as const,
  'offer_accepted' as const,
  'offer_fallen_through' as const,
  'back_on_market' as const,
] as const);

const CreateTimelineEventSchema = z.object({
  propertyId: z.number().positive('Property ID must be positive'),
  type: TimelineEventTypeSchema,
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

const GetTimelineEventsSchema = z.object({
  propertyId: z.number().positive('Property ID must be positive'),
});

export const timelineRouter = router({
  // Get timeline events for a property (public)
  getPropertyTimeline: publicProcedure
    .input(GetTimelineEventsSchema)
    .query(async ({ input }) => {
      try {
        // In demo mode, return mock timeline events
        if (DEMO_MODE) {
          const events = DEMO_TIMELINE_EVENTS
            .filter(e => e.propertyId === input.propertyId)
            .map((e, index) => ({
              id: index + 1,
              propertyId: e.propertyId,
              type: e.type,
              title: e.title,
              description: undefined,
              details: undefined,
              timestamp: e.timestamp,
            }));

          return events;
        }

        const pool = await getPool();
        if (!pool) {
          throw new Error('Database not available');
        }

        const query = `
          SELECT
            id,
            property_id as propertyId,
            event_type as type,
            title,
            description,
            details,
            created_at as timestamp
          FROM property_timeline_events
          WHERE property_id = ?
          ORDER BY created_at DESC
          LIMIT 100
        `;

        const [rows] = await pool.query(query, [input.propertyId]);

        // Parse JSON details field
        const events = (rows as any[]).map((row) => ({
          ...row,
          details: row.details ? JSON.parse(row.details) : undefined,
        }));

        return events;
      } catch (error) {
        console.error('[Timeline] Failed to fetch events:', error);
        return [];
      }
    }),

  // Create timeline event (protected - agents only)
  createEvent: protectedProcedure
    .input(CreateTimelineEventSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Only agents can create timeline events
        if (ctx.user?.role !== 'agent') {
          throw new Error('Only agents can create timeline events');
        }

        const pool = await getPool();
        if (!pool) {
          throw new Error('Database not available');
        }

        const query = `
          INSERT INTO property_timeline_events 
          (property_id, event_type, title, description, details, created_at)
          VALUES (?, ?, ?, ?, ?, NOW())
        `;

        const detailsJson = input.details ? JSON.stringify(input.details) : null;

        await pool.query(query, [
          input.propertyId,
          input.type,
          input.title,
          input.description || null,
          detailsJson,
        ]);

        return { success: true, message: 'Timeline event created' };
      } catch (error) {
        console.error('[Timeline] Failed to create event:', error);
        throw new Error('Failed to create timeline event');
      }
    }),

  // Create viewing milestone event (helper for viewing counts)
  recordViewingMilestone: protectedProcedure
    .input(
      z.object({
        propertyId: z.number().positive(),
        viewingCount: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user?.role !== 'agent') {
          throw new Error('Only agents can record viewing milestones');
        }

        const pool = await getPool();
        if (!pool) {
          throw new Error('Database not available');
        }

        const milestones = [5, 10, 25, 50, 100];
        if (!milestones.includes(input.viewingCount)) {
          throw new Error('Viewing count must be a milestone (5, 10, 25, 50, 100)');
        }

        const query = `
          INSERT INTO property_timeline_events 
          (property_id, event_type, title, description, details, created_at)
          VALUES (?, ?, ?, ?, ?, NOW())
        `;

        const title = `${input.viewingCount}th Viewing Milestone`;
        const description = `Property has reached ${input.viewingCount} viewings!`;
        const details = JSON.stringify({ viewingCount: input.viewingCount });

        await pool.query(query, [
          input.propertyId,
          'viewing_milestone',
          title,
          description,
          details,
        ]);

        return { success: true, message: `Milestone recorded: ${title}` };
      } catch (error) {
        console.error('[Timeline] Failed to record milestone:', error);
        throw new Error('Failed to record viewing milestone');
      }
    }),

  // Record price adjustment
  recordPriceAdjustment: protectedProcedure
    .input(
      z.object({
        propertyId: z.number().positive(),
        oldPrice: z.number().positive(),
        newPrice: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user?.role !== 'agent') {
          throw new Error('Only agents can record price adjustments');
        }

        const pool = await getPool();
        if (!pool) {
          throw new Error('Database not available');
        }

        const priceDifference = input.newPrice - input.oldPrice;
        const percentChange = ((priceDifference / input.oldPrice) * 100).toFixed(1);
        const direction = priceDifference > 0 ? 'increased' : 'decreased';

        const query = `
          INSERT INTO property_timeline_events 
          (property_id, event_type, title, description, details, created_at)
          VALUES (?, ?, ?, ?, ?, NOW())
        `;

        const title = `Price ${direction === 'increased' ? 'Increased' : 'Reduced'}`;
        const description = `Price changed from £${input.oldPrice.toLocaleString()} to £${input.newPrice.toLocaleString()} (${direction} by ${Math.abs(Number(percentChange))}%)`;
        const details = JSON.stringify({
          oldPrice: input.oldPrice,
          newPrice: input.newPrice,
          difference: priceDifference,
          percentChange: Number(percentChange),
        });

        await pool.query(query, [
          input.propertyId,
          'price_adjusted',
          title,
          description,
          details,
        ]);

        return { success: true, message: title };
      } catch (error) {
        console.error('[Timeline] Failed to record price adjustment:', error);
        throw new Error('Failed to record price adjustment');
      }
    }),
});
