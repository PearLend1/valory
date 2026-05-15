import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "./schema";
import { ENV } from './_core/env';
import mysql from "mysql2/promise";
import { DEMO_MODE } from './demo-mode';
import { DEMO_USERS, DEMO_PROPERTIES, DEMO_VALUATIONS } from './mock-data';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = mysql.createPool(process.env.DATABASE_URL);
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function getPool() {
  if (!_pool && process.env.DATABASE_URL) {
    try {
      _pool = mysql.createPool(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to create pool:", error);
      _pool = null;
    }
  }
  return _pool;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  // In demo mode, skip database operations
  if (DEMO_MODE) {
    console.log("[Demo Mode] Skipping upsertUser:", user.openId);
    return;
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  // In demo mode, return mock user
  if (DEMO_MODE) {
    const demoUserId = Object.values(DEMO_USERS).find(u => u.openId === openId);
    if (demoUserId) {
      return demoUserId;
    }
    console.log("[Demo Mode] User not found in mock data:", openId);
    return undefined;
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get public properties with optional filters
 */
export async function getPublicProperties(filters?: {
  city?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}) {
  // In demo mode, return mock properties with filters applied
  if (DEMO_MODE) {
    let properties = [...DEMO_PROPERTIES];

    if (filters?.city) {
      properties = properties.filter(p => p.city === filters.city);
    }

    if (filters?.propertyType) {
      properties = properties.filter(p => p.propertyType === filters.propertyType);
    }

    if (filters?.minPrice !== undefined) {
      properties = properties.filter(p => p.price >= filters!.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
      properties = properties.filter(p => p.price <= filters!.maxPrice!);
    }

    // Apply pagination
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;
    properties = properties.slice(offset, offset + limit);

    return properties;
  }

  const pool = await getPool();
  if (!pool) {
    console.warn("[Database] Cannot get properties: database not available");
    return [];
  }

  try {
    const conn = await pool.getConnection();
    try {
      // Build SQL query with filters
      let sql = "SELECT * FROM properties WHERE status = 'active'";
      const params: any[] = [];

      if (filters?.city) {
        sql += " AND city = ?";
        params.push(filters.city);
      }

      if (filters?.propertyType) {
        sql += " AND propertyType = ?";
        params.push(filters.propertyType);
      }

      if (filters?.minPrice !== undefined) {
        sql += " AND price >= ?";
        params.push(filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        sql += " AND price <= ?";
        params.push(filters.maxPrice);
      }

      sql += " ORDER BY createdAt DESC LIMIT ? OFFSET ?";
      const limit = filters?.limit || 20;
      const offset = filters?.offset || 0;
      params.push(limit, offset);

      const [rows] = await conn.query(sql, params);
      return rows as any[];
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("[Database] Failed to get properties:", error);
    throw error;
  }
}

/**
 * Get property by ID
 */
export async function getPropertyById(id: number) {
  // In demo mode, return mock property
  if (DEMO_MODE) {
    const property = DEMO_PROPERTIES.find(p => p.id === id);
    return property || undefined;
  }

  const pool = await getPool();
  if (!pool) {
    console.warn("[Database] Cannot get property: database not available");
    return undefined;
  }

  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query("SELECT * FROM properties WHERE id = ?", [id]);
      const result = rows as any[];
      return result.length > 0 ? result[0] : undefined;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("[Database] Failed to get property:", error);
    throw error;
  }
}

/**
 * Get agent subscription
 */
export async function getAgentSubscription(agentId: number) {
  // In demo mode, return mock active subscription
  if (DEMO_MODE) {
    return {
      id: 1,
      agentId: agentId,
      tier: 'tier2',
      status: 'active',
      startDate: new Date('2024-01-01'),
      renewalDate: new Date('2024-12-31'),
      createdAt: new Date('2024-01-01'),
    };
  }

  const pool = await getPool();
  if (!pool) {
    console.warn("[Database] Cannot get subscription: database not available");
    return undefined;
  }

  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query("SELECT * FROM agentSubscriptions WHERE agentId = ?", [agentId]);
      const result = rows as any[];
      return result.length > 0 ? result[0] : undefined;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("[Database] Failed to get subscription:", error);
    throw error;
  }
}

/**
 * Get valuation by ID
 */
export async function getValuationById(id: number) {
  // In demo mode, return mock valuation
  if (DEMO_MODE) {
    const valuation = DEMO_VALUATIONS.find(v => v.id === id);
    return valuation || undefined;
  }

  const pool = await getPool();
  if (!pool) {
    console.warn("[Database] Cannot get valuation: database not available");
    return undefined;
  }

  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query("SELECT * FROM valuationRequests WHERE id = ?", [id]);
      const result = rows as any[];
      return result.length > 0 ? result[0] : undefined;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("[Database] Failed to get valuation:", error);
    throw error;
  }
}
