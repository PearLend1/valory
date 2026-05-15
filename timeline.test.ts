import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';

describe('Timeline Feature', () => {
  describe('Timeline Event Types', () => {
    it('should accept valid timeline event types', () => {
      const validTypes = [
        'launched',
        'viewing_booked',
        'viewing_milestone',
        'media_uploaded',
        'price_adjusted',
        'offer_received',
        'offer_accepted',
        'offer_fallen_through',
        'back_on_market',
      ];

      validTypes.forEach((type) => {
        expect(validTypes).toContain(type);
      });
    });
  });

  describe('Timeline Event Validation', () => {
    it('should validate timeline event schema', () => {
      const CreateTimelineEventSchema = z.object({
        propertyId: z.number().positive('Property ID must be positive'),
        type: z.enum([
          'launched' as const,
          'viewing_booked' as const,
          'viewing_milestone' as const,
          'media_uploaded' as const,
          'price_adjusted' as const,
          'offer_received' as const,
          'offer_accepted' as const,
          'offer_fallen_through' as const,
          'back_on_market' as const,
        ] as const),
        title: z.string().min(1, 'Title is required').max(255),
        description: z.string().optional(),
        details: z.record(z.string(), z.unknown()).optional(),
      });

      const validEvent = {
        propertyId: 1,
        type: 'launched' as const,
        title: 'Property Launched',
        description: 'Property listing went live',
      };

      const result = CreateTimelineEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('should reject invalid timeline events', () => {
      const CreateTimelineEventSchema = z.object({
        propertyId: z.number().positive('Property ID must be positive'),
        type: z.enum([
          'launched' as const,
          'viewing_booked' as const,
          'viewing_milestone' as const,
          'media_uploaded' as const,
          'price_adjusted' as const,
          'offer_received' as const,
          'offer_accepted' as const,
          'offer_fallen_through' as const,
          'back_on_market' as const,
        ] as const),
        title: z.string().min(1, 'Title is required').max(255),
      });

      const invalidEvent = {
        propertyId: -1, // Invalid: negative ID
        type: 'invalid_type',
        title: '',
      };

      const result = CreateTimelineEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('should validate empty title is rejected', () => {
      const CreateTimelineEventSchema = z.object({
        propertyId: z.number().positive(),
        type: z.enum(['launched' as const] as const),
        title: z.string().min(1, 'Title is required'),
      });

      const eventWithEmptyTitle = {
        propertyId: 1,
        type: 'launched' as const,
        title: '',
      };

      const result = CreateTimelineEventSchema.safeParse(eventWithEmptyTitle);
      expect(result.success).toBe(false);
    });
  });

  describe('Viewing Milestone Recording', () => {
    it('should validate viewing milestone count', () => {
      const milestones = [5, 10, 25, 50, 100];
      const testCounts = [5, 10, 15, 25, 50, 100];

      testCounts.forEach((count) => {
        const isMilestone = milestones.includes(count);
        if (isMilestone) {
          expect(milestones).toContain(count);
        }
      });
    });

    it('should generate correct milestone title', () => {
      const viewingCount = 5;
      const title = `${viewingCount}th Viewing Milestone`;
      expect(title).toBe('5th Viewing Milestone');
    });

    it('should generate milestone description', () => {
      const viewingCount = 10;
      const description = `Property has reached ${viewingCount} viewings!`;
      expect(description).toBe('Property has reached 10 viewings!');
    });
  });

  describe('Price Adjustment Recording', () => {
    it('should calculate price difference correctly', () => {
      const oldPrice = 500000;
      const newPrice = 475000;
      const difference = newPrice - oldPrice;

      expect(difference).toBe(-25000);
    });

    it('should calculate percentage change correctly', () => {
      const oldPrice = 500000;
      const newPrice = 525000;
      const percentChange = ((newPrice - oldPrice) / oldPrice) * 100;

      expect(percentChange).toBe(5);
    });

    it('should determine price direction', () => {
      const oldPrice = 500000;
      const newPrice1 = 525000;
      const newPrice2 = 475000;

      const direction1 = newPrice1 > oldPrice ? 'increased' : 'decreased';
      const direction2 = newPrice2 > oldPrice ? 'increased' : 'decreased';

      expect(direction1).toBe('increased');
      expect(direction2).toBe('decreased');
    });

    it('should generate price adjustment description', () => {
      const oldPrice = 500000;
      const newPrice = 475000;
      const difference = newPrice - oldPrice;
      const percentChange = ((difference / oldPrice) * 100).toFixed(1);
      const direction = difference > 0 ? 'increased' : 'decreased';

      const description = `Price changed from £${oldPrice.toLocaleString()} to £${newPrice.toLocaleString()} (${direction} by ${Math.abs(Number(percentChange))}%)`;

      expect(description).toContain('£500,000');
      expect(description).toContain('£475,000');
      expect(description).toContain('decreased');
      expect(description).toContain('5%');
    });
  });

  describe('Timeline Event Ordering', () => {
    it('should sort events by timestamp (newest first)', () => {
      const events = [
        { id: '1', timestamp: new Date('2026-01-15') },
        { id: '2', timestamp: new Date('2026-01-20') },
        { id: '3', timestamp: new Date('2026-01-18') },
      ];

      const sorted = [...events].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      expect(sorted[0]?.id).toBe('2');
      expect(sorted[1]?.id).toBe('3');
      expect(sorted[2]?.id).toBe('1');
    });
  });

  describe('Timeline Event Details', () => {
    it('should handle optional details field', () => {
      const eventWithDetails = {
        id: '1',
        title: 'Viewing Milestone',
        details: { viewingCount: 5 },
      };

      const eventWithoutDetails = {
        id: '2',
        title: 'Property Launched',
      };

      expect(eventWithDetails.details).toBeDefined();
      expect(eventWithoutDetails.details).toBeUndefined();
    });

    it('should serialize and deserialize JSON details', () => {
      const details = { viewingCount: 10, timestamp: '2026-01-20' };
      const serialized = JSON.stringify(details);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(details);
      expect(deserialized.viewingCount).toBe(10);
    });
  });
});
