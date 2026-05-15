/**
 * Demo Mode Configuration
 * Provides helper functions for running the app without a database
 */

import type { Request } from 'express';
import { DEMO_USERS } from './mock-data';
import type { User } from './schema';

// Check if demo mode is enabled (when DATABASE_URL is not set)
export const DEMO_MODE = !process.env.DATABASE_URL;

/**
 * Get the demo user based on the ?role query parameter
 * Defaults to vendor user if no role specified
 */
export function getDemoUser(req?: Request): User {
  const role = req?.query?.role as string | undefined;

  switch (role) {
    case 'admin':
      return DEMO_USERS.admin;
    case 'agent':
      return DEMO_USERS.agent;
    case 'buyer':
    case 'public':
      return DEMO_USERS.buyer;
    case 'vendor':
      return DEMO_USERS.vendor;
    default:
      // Default to vendor
      return DEMO_USERS.vendor;
  }
}

/**
 * Log demo mode status
 */
export function initDemoMode(): void {
  if (DEMO_MODE) {
    console.log('[Demo Mode] Enabled - using mock data instead of database');
    console.log('[Demo Mode] Set DATABASE_URL environment variable to use real database');
  }
}
