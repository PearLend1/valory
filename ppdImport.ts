/**
 * HM Land Registry Price Paid Data Import Job
 * Imports monthly sold property price data
 * 
 * Data source: https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads
 * Alternative: Land Registry API for programmatic access
 * 
 * This job runs monthly to update historical price data for valuation comparables
 */

import { getPool } from '../db';

export interface SoldPrice {
  id: string; // Transaction ID
  price: number;
  date: Date;
  postcode: string;
  propertyType: string; // D=Detached, S=Semi-detached, T=Terraced, F=Flat, O=Other
  isNew: boolean;
  duration: string; // F=Freehold, L=Leasehold
  paon: string; // Primary Addressable Object Name
  saon: string; // Secondary Addressable Object Name
  street: string;
  locality: string;
  city: string;
  district: string;
  county: string;
  region: string;
  ppd: string; // PPD Category Type (A=Standard, B=Additional)
  recordStatus: string; // A=Add, C=Change, D=Delete
}

/**
 * Import Price Paid Data from CSV file or API
 * In production, this would:
 * 1. Download monthly dataset from Land Registry
 * 2. Parse CSV format
 * 3. Upsert into sold_prices table
 * 4. Update property valuation comparables
 */
export async function importPricesPaid(dataUrl: string): Promise<{
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
    console.log('[PPD Import] Starting import from:', dataUrl);

    // In production, fetch and parse CSV data
    // For now, this is a placeholder that shows the structure

    const conn = await pool.getConnection();
    try {
      // Create sold_prices table if not exists
      await conn.query(`
        CREATE TABLE IF NOT EXISTS sold_prices (
          id VARCHAR(50) PRIMARY KEY,
          price DECIMAL(12, 2) NOT NULL,
          date DATE NOT NULL,
          postcode VARCHAR(20) NOT NULL,
          propertyType CHAR(1),
          isNew BOOLEAN,
          duration CHAR(1),
          paon VARCHAR(255),
          saon VARCHAR(255),
          street VARCHAR(255),
          locality VARCHAR(255),
          city VARCHAR(255),
          district VARCHAR(255),
          county VARCHAR(255),
          region VARCHAR(255),
          ppd CHAR(1),
          recordStatus CHAR(1),
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_postcode (postcode),
          INDEX idx_date (date),
          INDEX idx_price (price)
        )
      `);

      console.log('[PPD Import] Table ready');

      // Example: Insert sample data (in production, parse from CSV)
      const sampleData: SoldPrice[] = [
        {
          id: 'PPD-2024-001',
          price: 350000,
          date: new Date('2024-01-15'),
          postcode: 'SW1A 1AA',
          propertyType: 'D',
          isNew: false,
          duration: 'F',
          paon: '123',
          saon: '',
          street: 'Example Street',
          locality: 'London',
          city: 'London',
          district: 'Westminster',
          county: 'Greater London',
          region: 'London',
          ppd: 'A',
          recordStatus: 'A',
        },
      ];

      for (const record of sampleData) {
        try {
          const result = await conn.query(
            `INSERT INTO sold_prices 
            (id, price, date, postcode, propertyType, isNew, duration, paon, saon, street, locality, city, district, county, region, ppd, recordStatus)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            price = VALUES(price),
            date = VALUES(date),
            updatedAt = CURRENT_TIMESTAMP`,
            [
              record.id,
              record.price,
              record.date,
              record.postcode,
              record.propertyType,
              record.isNew ? 1 : 0,
              record.duration,
              record.paon,
              record.saon,
              record.street,
              record.locality,
              record.city,
              record.district,
              record.county,
              record.region,
              record.ppd,
              record.recordStatus,
            ]
          );

          const affectedRows = (result as any)[0]?.affectedRows || 0;
          if (affectedRows > 1) {
            updated++;
          } else {
            imported++;
          }
        } catch (error) {
          console.error('[PPD Import] Error importing record:', record.id, error);
          errors++;
        }
      }
    } finally {
      conn.release();
    }

    console.log(`[PPD Import] Complete: ${imported} imported, ${updated} updated, ${errors} errors`);
    return { imported, updated, errors };
  } catch (error) {
    console.error('[PPD Import] Job failed:', error);
    throw error;
  }
}

/**
 * Get comparable sales for a property (for valuation)
 */
export async function getComparableSales(
  postcode: string,
  propertyType: string,
  maxResults: number = 10
): Promise<SoldPrice[]> {
  const pool = await getPool();
  if (!pool) {
    return [];
  }

  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT * FROM sold_prices 
        WHERE postcode = ? AND propertyType = ?
        ORDER BY date DESC
        LIMIT ?`,
        [postcode, propertyType, maxResults]
      );

      return rows as SoldPrice[];
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PPD] Failed to get comparable sales:', error);
    return [];
  }
}

/**
 * Calculate median price for comparable sales
 */
export function calculateMedianPrice(sales: SoldPrice[]): number | null {
  if (sales.length === 0) return null;

  const prices = sales.map(s => s.price).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);

  if (prices.length % 2 === 0) {
    return (prices[mid - 1] + prices[mid]) / 2;
  }
  return prices[mid];
}
