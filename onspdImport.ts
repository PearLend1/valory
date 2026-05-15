/**
 * ONS Postcode Directory (ONSPD) Import Job
 * Imports monthly postcode -> lat/lng + admin area mapping
 * 
 * Data source: https://www.ons.gov.uk/methodology/geography/geographicalproducts/postcodegeography/postcodedirectories
 * 
 * This job runs monthly to keep postcode geocoding data current
 */

import { getPool } from '../db';

export interface PostcodeRecord {
  postcode: string;
  latitude: number;
  longitude: number;
  adminArea: string; // Local Authority District
  region: string;
  country: string;
  inUse: boolean;
}

/**
 * Import ONSPD data from CSV file
 * In production, this would:
 * 1. Download monthly ONSPD dataset
 * 2. Parse CSV format
 * 3. Upsert into postcodes table
 */
export async function importONSPD(csvUrl: string): Promise<{
  imported: number;
  updated: number;
  errors: number;
}> {
  const pool = await getPool();
  if (!pool) {
    throw new Error('Database pool not available');
  }

  let imported = 0;
  let updated = 0;
  let errors = 0;

  try {
    console.log('[ONSPD Import] Starting import from:', csvUrl);

    const conn = await pool.getConnection();
    try {
      // Create postcodes table if not exists
      await conn.query(`
        CREATE TABLE IF NOT EXISTS postcodes (
          postcode VARCHAR(10) PRIMARY KEY,
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          adminArea VARCHAR(255),
          region VARCHAR(255),
          country VARCHAR(50),
          inUse BOOLEAN DEFAULT TRUE,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_lat_lng (latitude, longitude),
          INDEX idx_admin_area (adminArea)
        )
      `);

      console.log('[ONSPD Import] Table ready');

      // Example: Insert sample postcode data (in production, parse from CSV)
      const sampleData: PostcodeRecord[] = [
        {
          postcode: 'SW1A 1AA',
          latitude: 51.5007,
          longitude: -0.1246,
          adminArea: 'Westminster',
          region: 'London',
          country: 'England',
          inUse: true,
        },
        {
          postcode: 'M1 1AD',
          latitude: 53.4808,
          longitude: -2.2426,
          adminArea: 'Manchester',
          region: 'Greater Manchester',
          country: 'England',
          inUse: true,
        },
      ];

      for (const record of sampleData) {
        try {
          const result = await conn.query(
            `INSERT INTO postcodes 
            (postcode, latitude, longitude, adminArea, region, country, inUse)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            latitude = VALUES(latitude),
            longitude = VALUES(longitude),
            adminArea = VALUES(adminArea),
            region = VALUES(region),
            country = VALUES(country),
            inUse = VALUES(inUse),
            updatedAt = CURRENT_TIMESTAMP`,
            [
              record.postcode,
              record.latitude,
              record.longitude,
              record.adminArea,
              record.region,
              record.country,
              record.inUse ? 1 : 0,
            ]
          );

          const affectedRows = (result as any)[0]?.affectedRows || 0;
          if (affectedRows > 1) {
            updated++;
          } else {
            imported++;
          }
        } catch (error) {
          console.error('[ONSPD Import] Error importing postcode:', record.postcode, error);
          errors++;
        }
      }
    } finally {
      conn.release();
    }

    console.log(`[ONSPD Import] Complete: ${imported} imported, ${updated} updated, ${errors} errors`);
    return { imported, updated, errors };
  } catch (error) {
    console.error('[ONSPD Import] Job failed:', error);
    throw error;
  }
}

/**
 * Get postcode geocoding data
 */
export async function getPostcodeData(postcode: string): Promise<PostcodeRecord | null> {
  const pool = await getPool();
  if (!pool) {
    return null;
  }

  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT * FROM postcodes WHERE postcode = ?`,
        [postcode.replace(/\s+/g, '').toUpperCase()]
      );

      const result = rows as any[];
      return result.length > 0 ? result[0] : null;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[ONSPD] Failed to get postcode data:', error);
    return null;
  }
}

/**
 * Get postcodes in admin area
 */
export async function getPostcodesByAdminArea(adminArea: string): Promise<PostcodeRecord[]> {
  const pool = await getPool();
  if (!pool) {
    return [];
  }

  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT * FROM postcodes WHERE adminArea = ? AND inUse = TRUE`,
        [adminArea]
      );

      return rows as PostcodeRecord[];
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[ONSPD] Failed to get postcodes by admin area:', error);
    return [];
  }
}
