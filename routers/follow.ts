import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getPool } from '../db';
import { DEMO_MODE } from '../demo-mode';
import { DEMO_PROPERTIES, DEMO_FOLLOWED_PROPERTIES } from '../mock-data';

const ToggleFollowSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
});

const GetFollowedPropertiesSchema = z.object({
  limit: z.number().int().positive().default(50).optional(),
  offset: z.number().int().nonnegative().default(0).optional(),
});

export const followRouter = router({
  // Toggle follow/save property
  toggleFollowProperty: protectedProcedure
    .input(ToggleFollowSchema)
    .mutation(async ({ ctx, input }) => {
      const pool = await getPool();
      if (!pool) {
        throw new Error('Database connection failed');
      }

      const userId = ctx.user.id;
      const { propertyId } = input;

      try {
        // Check if already following
        const existingResult = await pool.query(
          'SELECT id FROM saved_properties WHERE userId = ? AND propertyId = ?',
          [userId, propertyId]
        );

        const existingRows = Array.isArray(existingResult) ? existingResult : [];
        const isFollowing = existingRows.length > 0;

        if (isFollowing) {
          // Unfollow
          await pool.query(
            'DELETE FROM saved_properties WHERE userId = ? AND propertyId = ?',
            [userId, propertyId]
          );
          return { followed: false, message: 'Property removed from saved' };
        } else {
          // Follow
          await pool.query(
            'INSERT INTO saved_properties (userId, propertyId, createdAt) VALUES (?, ?, NOW())',
            [userId, propertyId]
          );
          return { followed: true, message: 'Property saved' };
        }
      } catch (error) {
        console.error('Error toggling follow:', error);
        throw new Error('Failed to toggle follow status');
      }
    }),

  // Get followed properties
  getFollowedProperties: protectedProcedure
    .input(GetFollowedPropertiesSchema)
    .query(async ({ ctx, input }) => {
      // In demo mode, return mock followed properties
      if (DEMO_MODE) {
        const limit = input.limit || 50;
        const offset = input.offset || 0;

        const properties = DEMO_PROPERTIES
          .filter(p => DEMO_FOLLOWED_PROPERTIES.includes(p.id))
          .map(p => ({
            ...p,
            savedAt: p.createdAt,
          }))
          .slice(offset, offset + limit);

        return {
          properties,
          total: properties.length,
          limit,
          offset,
        };
      }

      const pool = await getPool();
      if (!pool) {
        throw new Error('Database connection failed');
      }

      const userId = ctx.user.id;
      const limit = input.limit || 50;
      const offset = input.offset || 0;

      try {
        // Get saved properties with event count
        const result = await pool.query(
          `SELECT
            p.id,
            p.title,
            p.price,
            p.bedrooms,
            p.bathrooms,
            p.squareFeet,
            p.city,
            p.postcode,
            p.description,
            p.latitude,
            p.longitude,
            p.createdAt,
            sp.createdAt as savedAt
          FROM saved_properties sp
          JOIN properties p ON sp.propertyId = p.id
          WHERE sp.userId = ?
          ORDER BY sp.createdAt DESC
          LIMIT ? OFFSET ?`,
          [userId, limit, offset]
        );

        const properties = Array.isArray(result) ? result : [];

        return {
          properties,
          total: properties.length,
          limit,
          offset,
        };
      } catch (error) {
        console.error('Error getting followed properties:', error);
        throw new Error('Failed to fetch followed properties');
      }
    }),

  // Check if user follows a property
  isFollowing: protectedProcedure
    .input(z.object({ propertyId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const pool = await getPool();
      if (!pool) {
        throw new Error('Database connection failed');
      }

      const userId = ctx.user.id;
      const { propertyId } = input;

      try {
        const resultData = await pool.query(
          'SELECT id FROM saved_properties WHERE userId = ? AND propertyId = ?',
          [userId, propertyId]
        );

        const rows = Array.isArray(resultData) ? resultData : [];
        return { isFollowing: rows.length > 0 };
      } catch (error) {
        console.error('Error checking follow status:', error);
        throw new Error('Failed to check follow status');
      }
    }),

  // Get follower count for a property
  getFollowerCount: protectedProcedure
    .input(z.object({ propertyId: z.string().min(1) }))
    .query(async ({ input }) => {
      const pool = await getPool();
      if (!pool) {
        throw new Error('Database connection failed');
      }

      const { propertyId } = input;

      try {
        const result = await pool.query(
          'SELECT COUNT(*) as count FROM saved_properties WHERE propertyId = ?',
          [propertyId]
        );

        const rows = Array.isArray(result) ? result : [];
        const count = rows.length > 0 ? (rows[0] as any).count : 0;
        return { followerCount: count };
      } catch (error) {
        console.error('Error getting follower count:', error);
        throw new Error('Failed to get follower count');
      }
    }),
});
