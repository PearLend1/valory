/**
 * Comparable Selection Algorithm
 * Sophisticated comp selection with scoring, outlier detection, and confidence calculation
 * Based on production valuation best practices
 */

import { getPool } from '../db';
import { externalDataRegistry, type Comparable } from '../external-data-provider';
import { COVERAGE_SECTORS, isWithinCoverage } from '../coverage-config';

export interface Subject {
  lat?: number;
  lng?: number;
  typeBucket: 'house' | 'flat' | 'other';
  ppdTypePreferred?: ('D' | 'S' | 'T' | 'F')[];
  beds?: number;
  areaSqm?: number;
  postcodeOutcode?: string;
  postcode?: string;
}

export interface Comp {
  id: number;
  price: number;
  date: Date;
  lat?: number;
  lng?: number;
  ppdType: 'D' | 'S' | 'T' | 'F' | 'O';
  beds?: number;
  areaSqm?: number;
  distance?: number;
  score?: number;
}

export interface ScoredComp extends Comp {
  score: number;
  distanceScore: number;
  recencyScore: number;
  typeScore: number;
  sizeScore: number;
}

export interface ValuationResult {
  estimate: number;
  lowBand: number;
  highBand: number;
  confidence: 'High' | 'Medium' | 'Low';
  compsUsed: number;
  medianPrice: number;
  ppsqm?: number;
  signals: ValuationSignal[];
}

export interface ValuationSignal {
  name: string;
  value: string | number;
  impact: 'positive' | 'negative' | 'neutral';
}

const HAVERSINE_RADIUS_M = 6371000; // Earth radius in meters

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return HAVERSINE_RADIUS_M * c;
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate median of array
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Calculate median absolute deviation
 */
function medianAbsoluteDeviation(values: number[], med: number): number {
  if (values.length === 0) return 0;
  const deviations = values.map(v => Math.abs(v - med));
  return median(deviations);
}

/**
 * Calculate weighted median
 */
function weightedMedian(items: Array<{ v: number; w: number }>): number {
  if (items.length === 0) return 0;

  const sorted = [...items].sort((a, b) => a.v - b.v);
  const totalWeight = sorted.reduce((sum, item) => sum + item.w, 0);
  let cumulativeWeight = 0;
  const halfWeight = totalWeight / 2;

  for (const item of sorted) {
    cumulativeWeight += item.w;
    if (cumulativeWeight >= halfWeight) {
      return item.v;
    }
  }

  return sorted[sorted.length - 1].v;
}

/**
 * Score a single comparable against the subject property
 */
export function scoreComp(subject: Subject, comp: Comp, radiusM: number): number {
  // Distance score
  let distanceM = radiusM * 0.8; // Default degraded score if no coords
  if (subject.lat != null && subject.lng != null && comp.lat != null && comp.lng != null) {
    distanceM = haversineMeters(subject.lat, subject.lng, comp.lat, comp.lng);
  }
  const distanceScore = clamp(1 - distanceM / radiusM, 0, 1);

  // Recency score (exponential decay)
  const days = Math.max(1, (Date.now() - comp.date.getTime()) / (1000 * 60 * 60 * 24));
  const recencyScore = Math.exp(-days / 365);

  // Type score
  let typeScore = 0.2; // Default mismatch
  if (subject.ppdTypePreferred?.includes(comp.ppdType as 'D' | 'S' | 'T' | 'F')) {
    typeScore = 1.0; // Exact match
  } else if (subject.typeBucket === 'flat' && comp.ppdType === 'F') {
    typeScore = 0.7; // Good match
  } else if (subject.typeBucket === 'house' && ['D', 'S', 'T'].includes(comp.ppdType as string)) {
    typeScore = 0.7; // Good match
  }

  // Size/beds score
  let sizeScore = 0.5; // Default
  if (subject.areaSqm != null && comp.areaSqm != null) {
    sizeScore = clamp(
      1 - Math.abs(subject.areaSqm - comp.areaSqm) / Math.max(subject.areaSqm, comp.areaSqm),
      0,
      1
    );
  } else if (subject.beds != null && comp.beds != null) {
    sizeScore = clamp(1 - Math.abs(subject.beds - comp.beds) / 5, 0, 1);
  }

  // Weighted score
  const score = 0.35 * distanceScore + 0.25 * recencyScore + 0.25 * typeScore + 0.15 * sizeScore;

  return score;
}

/**
 * Deterministic demo comps used when there is no database connection (demo mode).
 * Prices are anchored to realistic UK regional medians and seeded by postcode/type/beds
 * so the same inputs always produce the same valuation.
 */
function buildDemoComps(subject: Subject): Comp[] {
  // Regional base price by outcode prefix
  const outcode = (subject.postcodeOutcode ?? 'TA').toUpperCase();
  const regionBases: Record<string, number> = {
    SW: 450_000, SE: 520_000, E: 480_000, N: 400_000, W: 440_000, NW: 370_000,
    EC: 700_000, WC: 680_000, BS: 320_000, BA: 310_000, TA: 250_000, EX: 270_000,
    TQ: 260_000, PL: 220_000, TR: 290_000, GL: 300_000, HR: 240_000, SY: 230_000,
    WR: 280_000, CV: 260_000, B:  270_000, LE: 270_000, NG: 250_000, DE: 240_000,
    ST: 220_000, SK: 300_000, M:  290_000, WN: 200_000, BL: 210_000, OL: 200_000,
    HX: 210_000, HD: 220_000, WF: 210_000, LS: 260_000, BD: 220_000, HG: 310_000,
    YO: 280_000, HU: 190_000, DN: 190_000, S:  220_000, LN: 200_000, PE: 230_000,
    CB: 380_000, IP: 280_000, NR: 260_000, CO: 290_000, CM: 350_000, SS: 330_000,
    ME: 310_000, CT: 280_000, TN: 370_000, BN: 380_000, PO: 300_000, SO: 310_000,
    RG: 420_000, GU: 450_000, KT: 520_000, CR: 420_000, SM: 430_000, BR: 400_000,
    DA: 370_000, RM: 360_000, IG: 360_000, EN: 440_000, WD: 500_000, AL: 480_000,
    SG: 400_000, HP: 460_000, MK: 330_000, NN: 270_000, OX: 430_000, SN: 280_000,
    SP: 290_000, DT: 310_000, BH: 330_000, CF: 220_000, SA: 180_000,
    NP: 210_000, LD: 190_000, SL: 450_000, RH: 400_000, UB: 430_000, HA: 460_000,
    TW: 490_000,
  };

  // Find matching prefix (longest match first)
  let base = 270_000;
  for (let len = Math.min(outcode.length, 4); len >= 1; len--) {
    const prefix = outcode.slice(0, len);
    if (regionBases[prefix] !== undefined) { base = regionBases[prefix]; break; }
  }

  // Adjust for property type
  const typeMultiplier = subject.typeBucket === 'flat' ? 0.72 : 1.0;

  // Adjust for beds
  const bedsMultiplier = subject.beds == null ? 1.0 : [0, 0.55, 0.75, 1.0, 1.28, 1.55, 1.80][Math.min(subject.beds, 6)];

  const anchorPrice = Math.round(base * typeMultiplier * bedsMultiplier);

  const ppdType = subject.typeBucket === 'flat' ? 'F'
    : subject.typeBucket === 'house' ? 'S'
    : 'T';

  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  // Generate 18 synthetic comps with ±15% price scatter
  const comps: Comp[] = Array.from({ length: 18 }, (_, i) => {
    // Deterministic pseudo-random using index
    const seed = (i * 7 + 13) % 17;
    const priceFactor = 1 + (seed / 17 - 0.5) * 0.30; // ±15%
    const daysAgo = Math.round(30 + (seed * 19) % 300);
    const bedDelta = (seed % 3) - 1; // -1, 0, +1 from subject beds

    return {
      id:      1000 + i,
      price:   Math.round(anchorPrice * priceFactor / 1000) * 1000,
      date:    new Date(now - daysAgo * 24 * 60 * 60 * 1000),
      ppdType: ([ppdType, ppdType, ppdType === 'S' ? 'T' : ppdType, 'T'] as const)[seed % 4] as Comp['ppdType'],
      beds:    subject.beds != null ? Math.max(1, subject.beds + bedDelta) : undefined,
      areaSqm: subject.areaSqm != null ? subject.areaSqm * (0.85 + (seed / 17) * 0.30) : undefined,
      distance: 200 + seed * 80,
    };
  });

  return comps;
}

/**
 * Build candidate set from database with intelligent fallback logic
 */
export async function buildCandidateSet(
  subject: Subject,
  radiusM: number = 1609 // 1 mile in meters
): Promise<Comp[]> {
  const pool = await getPool();
  if (!pool) return buildDemoComps(subject);

  const conn = await pool.getConnection();
  try {
    // Map subject type to PPD types
    let ppdTypes: string[] = ['D', 'S', 'T', 'F', 'O'];
    if (subject.typeBucket === 'flat') {
      ppdTypes = ['F', 'D', 'S', 'T']; // Flat first
    } else if (subject.typeBucket === 'house') {
      ppdTypes = ['D', 'S', 'T', 'F']; // House types first
    }

    // Step 1: Try radius-based search (last 12 months)
    let comps: Comp[] = [];

    if (subject.lat != null && subject.lng != null) {
      const [rows] = await conn.query(
        `SELECT id, price, date_of_transfer as date, lat, lng, property_type, beds, areaSqm
         FROM sold_prices
         WHERE property_type IN (?)
         AND date_of_transfer >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
         AND record_status != 'D'
         AND lat IS NOT NULL AND lng IS NOT NULL
         ORDER BY date_of_transfer DESC
         LIMIT 100`,
        [ppdTypes]
      );

      comps = (rows as any[]).map(r => ({
        id: r.id,
        price: r.price,
        date: r.date,
        lat: r.lat,
        lng: r.lng,
        ppdType: r.property_type,
        beds: r.beds,
        areaSqm: r.areaSqm,
      }));
    }

    // Step 2: If < 10 comps, widen to 24 months
    if (comps.length < 10) {
      const [rows] = await conn.query(
        `SELECT id, price, date_of_transfer as date, lat, lng, property_type, beds, areaSqm
         FROM sold_prices
         WHERE property_type IN (?)
         AND date_of_transfer >= DATE_SUB(NOW(), INTERVAL 24 MONTH)
         AND record_status != 'D'
         ORDER BY date_of_transfer DESC
         LIMIT 100`,
        [ppdTypes]
      );

      comps = (rows as any[]).map(r => ({
        id: r.id,
        price: r.price,
        date: r.date,
        lat: r.lat,
        lng: r.lng,
        ppdType: r.property_type,
        beds: r.beds,
        areaSqm: r.areaSqm,
      }));
    }

    // Step 3: If still < 10, fallback to postcode_outcode
    if (comps.length < 10 && subject.postcodeOutcode) {
      const [rows] = await conn.query(
        `SELECT id, price, date_of_transfer as date, lat, lng, property_type, beds, areaSqm
         FROM sold_prices
         WHERE postcode_outcode = ?
         AND property_type IN (?)
         AND date_of_transfer >= DATE_SUB(NOW(), INTERVAL 24 MONTH)
         AND record_status != 'D'
         ORDER BY date_of_transfer DESC
         LIMIT 100`,
        [subject.postcodeOutcode, ppdTypes]
      );

      comps = (rows as any[]).map(r => ({
        id: r.id,
        price: r.price,
        date: r.date,
        lat: r.lat,
        lng: r.lng,
        ppdType: r.property_type,
        beds: r.beds,
        areaSqm: r.areaSqm,
      }));
    }

    // Step 4: If still < 10, fall back to Street Data API comparables
    // This uses the registered StreetDataProvider (requires STREET_DATA_API_KEY)
    if (comps.length < 10) {
      try {
        // The Street Data API requires a full postcode (e.g. "TA19 0AB").
        // Prefer subject.postcode; outcode/sector strings are rejected with 422.
        const postcodesToTry: string[] = [];
        if (subject.postcode && isWithinCoverage(subject.postcode)) {
          postcodesToTry.push(subject.postcode);
        } else if (subject.postcodeOutcode && isWithinCoverage(subject.postcodeOutcode)) {
          // outcode is not a valid full postcode — skip the API call for this fallback
        }

        const propertyTypeStr =
          subject.typeBucket === 'flat' ? 'flat' :
          subject.typeBucket === 'house' ? 'house' : 'any';

        let apiComps: Comparable[] = [];
        for (const pc of postcodesToTry) {
          apiComps = await externalDataRegistry.getComparables(pc, propertyTypeStr, subject.beds ?? 3);
          if (apiComps.length > 0) break;
        }

        if (apiComps.length > 0) {
          // Map Comparable → Comp, using real sold dates and sqft where available
          const apiMapped: Comp[] = apiComps.map((c, idx) => ({
            id: -(idx + 1), // Negative IDs to distinguish from DB records
            price: c.price,
            date: c.soldDate,
            ppdType: (subject.typeBucket === 'flat' ? 'F'
              : subject.typeBucket === 'house' ? 'D' : 'O') as 'D' | 'S' | 'T' | 'F' | 'O',
            beds: c.beds ?? subject.beds,
            areaSqm: c.sqft ? Math.round(c.sqft / 10.764) : undefined,
          }));
          // Merge with any DB comps we did find, DB records take precedence
          comps = [...comps, ...apiMapped];
          console.log(`[ComparableSelection] Street Data API provided ${apiMapped.length} additional comparables`);
        }
      } catch (err) {
        console.warn('[ComparableSelection] Street Data API fallback failed:', err);
      }
    }

    return comps;
  } finally {
    conn.release();
  }
}

/**
 * Build valuation from subject and comps using comparable selection algorithm
 */
export function buildValuation(subject: Subject, comps: Comp[]): ValuationResult {
  const radiusM = 1609; // 1 mile

  // Score all comps
  const scored: ScoredComp[] = comps.map(comp => {
    const distanceM =
      subject.lat != null && subject.lng != null && comp.lat != null && comp.lng != null
        ? haversineMeters(subject.lat, subject.lng, comp.lat, comp.lng)
        : radiusM * 0.8;

    const distanceScore = clamp(1 - distanceM / radiusM, 0, 1);
    const days = Math.max(1, (Date.now() - comp.date.getTime()) / (1000 * 60 * 60 * 24));
    const recencyScore = Math.exp(-days / 365);

    let typeScore = 0.2;
    if (subject.ppdTypePreferred?.includes(comp.ppdType as 'D' | 'S' | 'T' | 'F')) {
      typeScore = 1.0;
    } else if (subject.typeBucket === 'flat' && comp.ppdType === 'F') {
      typeScore = 0.7;
    } else if (subject.typeBucket === 'house' && ['D', 'S', 'T'].includes(comp.ppdType as string)) {
      typeScore = 0.7;
    }

    let sizeScore = 0.5;
    if (subject.areaSqm != null && comp.areaSqm != null) {
      sizeScore = clamp(
        1 - Math.abs(subject.areaSqm - comp.areaSqm) / Math.max(subject.areaSqm, comp.areaSqm),
        0,
        1
      );
    } else if (subject.beds != null && comp.beds != null) {
      sizeScore = clamp(1 - Math.abs(subject.beds - comp.beds) / 5, 0, 1);
    }

    const score = 0.35 * distanceScore + 0.25 * recencyScore + 0.25 * typeScore + 0.15 * sizeScore;

    return {
      ...comp,
      score,
      distanceScore,
      recencyScore,
      typeScore,
      sizeScore,
    };
  });

  // Sort by score and take top 25
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 25);

  // Outlier trimming using MAD
  const prices = top.map(x => x.price);
  const medianPrice = median(prices);
  const mad = medianAbsoluteDeviation(prices, medianPrice);

  const filtered = top.filter(
    x => Math.abs(x.price - medianPrice) <= 3 * mad || mad === 0
  );

  const usable = filtered.slice(0, 15);

  // Calculate estimate
  let estimate: number;
  let ppsqm: number | undefined;

  if (subject.areaSqm && usable.some(x => x.areaSqm)) {
    // Use £/sqm if area available
    const ppsqmItems = usable
      .filter(x => x.areaSqm)
      .map(x => ({ v: x.price / (x.areaSqm as number), w: x.score }));

    ppsqm = weightedMedian(ppsqmItems);
    estimate = ppsqm * subject.areaSqm;
  } else {
    // Use weighted median price
    estimate = weightedMedian(usable.map(x => ({ v: x.price, w: x.score })));
  }

  // Calculate confidence
  let confidence: 'High' | 'Medium' | 'Low' = 'Low';
  const recentComps = usable.filter(
    x => (Date.now() - x.date.getTime()) / (1000 * 60 * 60 * 24) <= 365
  ).length;

  if (usable.length >= 12 && recentComps >= 8 && subject.areaSqm) {
    confidence = 'High';
  } else if (usable.length >= 6 && recentComps >= 3) {
    confidence = 'Medium';
  }

  // Calculate band width
  const bandPercent =
    confidence === 'High' ? 0.05 : confidence === 'Medium' ? 0.08 : 0.15;
  const bandAmount = estimate * bandPercent;

  // Generate signals
  const signals: ValuationSignal[] = [
    {
      name: 'Comparable Sales',
      value: `${usable.length} recent sales used`,
      impact: usable.length >= 10 ? 'positive' : usable.length >= 6 ? 'neutral' : 'negative',
    },
    {
      name: 'Recency',
      value: `${recentComps} within 12 months`,
      impact: recentComps >= 8 ? 'positive' : recentComps >= 3 ? 'neutral' : 'negative',
    },
  ];

  if (subject.areaSqm) {
    signals.push({
      name: 'Floor Area',
      value: `${subject.areaSqm} m²`,
      impact: 'positive',
    });
  }

  return {
    estimate: Math.round(estimate),
    lowBand: Math.round(estimate - bandAmount),
    highBand: Math.round(estimate + bandAmount),
    confidence,
    compsUsed: usable.length,
    medianPrice: Math.round(medianPrice),
    ppsqm: ppsqm ? Math.round(ppsqm) : undefined,
    signals,
  };
}
