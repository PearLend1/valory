/**
 * Demo Mode Configuration
 * Provides helper functions for running the app without a database.
 * Demo identities must never be enabled in a production deployment.
 */

import type { Request } from 'express';
import { DEMO_USERS } from './mock-data';
import type { User } from './schema';

const isProduction = process.env.NODE_ENV === 'production';
const explicitlyEnabled = process.env.ENABLE_DEMO_MODE === 'true';

// Preserve convenient local development while failing closed in production.
export const DEMO_MODE =
  !isProduction && (explicitlyEnabled || !process.env.DATABASE_URL);

/**
 * Get a local demo user based on the ?role query parameter.
 * Admin impersonation requires a second explicit non-production flag.
 */
export function getDemoUser(req?: Request): User {
  if (!DEMO_MODE) {
    throw new Error('Demo identities are disabled');
  }

  const role = req?.query?.role as string | undefined;

  switch (role) {
    case 'admin':
      return process.env.ENABLE_DEMO_ADMIN === 'true'
        ? DEMO_USERS.admin
        : DEMO_USERS.vendor;
    case 'agent':
      return DEMO_USERS.agent;
    case 'buyer':
    case 'public':
      return DEMO_USERS.buyer;
    case 'vendor':
    default:
      return DEMO_USERS.vendor;
  }
}

/**
 * Log demo mode status.
 */
export function initDemoMode(): void {
  if (DEMO_MODE) {
    console.warn('[Demo Mode] Enabled for local/non-production use');
    if (process.env.ENABLE_DEMO_ADMIN === 'true') {
      console.warn('[Demo Mode] Admin impersonation is enabled');
    }
    return;
  }

  if (isProduction && !process.env.DATABASE_URL) {
    console.warn(
      '[Valory] Production database is not configured; account and persistence features will be unavailable'
    );
  }
}
