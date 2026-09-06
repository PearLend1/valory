/**
 * Production-safe valuation candidate selection.
 *
 * The original comparableSelection module returns synthetic demo comparables
 * immediately when DATABASE_URL is absent. That is useful locally, but it also
 * prevents a configured Street Data provider from ever being called on
 * database-free deployments such as the Manus beta.
 *
 * This wrapper makes the fallback order explicit:
 *   1. Stored Land Registry comparables, when a database is available.
 *   2. Street Data comparables, when a full covered postcode and API key exist.
 *   3. Synthetic comparables only when explicitly enabled for demo/development.
 */

import { getPool } from '../db';
import { isWithinCoverage } from '../coverage-config';
import { externalDataRegistry, type Comparable } from '../external-data-provider';
import {
  buildCandidateSet as buildStoredCandidateSet,
  buildValuation,
  scoreComp,
  type Comp,
  type ScoredComp,
  type Subject,
  type ValuationResult,
  type ValuationSignal,
} from './comparableSelection';

export { buildValuation, scoreComp };
export type { Comp, ScoredComp, Subject, ValuationResult, ValuationSignal };

export type ValuationDataSource =
  | 'database'
  | 'street-data'
  | 'blended'
  | 'synthetic'
  | 'unavailable';

export type SourcedComp = Comp & { dataSource?: ValuationDataSource };

function syntheticValuationsAllowed(): boolean {
  if (process.env.ALLOW_SYNTHETIC_VALUATIONS === 'true') return true;
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
}

function propertyTypeForStreet(subject: Subject): string {
  if (subject.typeBucket === 'flat') return 'flat';
  if (subject.typeBucket === 'house') return 'house';
  return 'any';
}

function mapStreetComparables(subject: Subject, comparables: Comparable[]): SourcedComp[] {
  const ppdType: Comp['ppdType'] =
    subject.typeBucket === 'flat' ? 'F' : subject.typeBucket === 'house' ? 'S' : 'O';

  return comparables
    .filter(comp => Number.isFinite(comp.price) && comp.price > 0 && !Number.isNaN(comp.soldDate.getTime()))
    .map((comp, index) => ({
      id: -(index + 1),
      price: Math.round(comp.price),
      date: comp.soldDate,
      ppdType,
      beds: comp.beds || subject.beds,
      areaSqm: comp.sqft ? Math.round(comp.sqft / 10.764) : undefined,
      dataSource: 'street-data' as const,
    }));
}

async function getStreetDataComparables(subject: Subject): Promise<SourcedComp[]> {
  const postcode = subject.postcode?.trim();

  // Street Data's postcode endpoint requires a complete postcode. Valory's
  // controlled beta is intentionally limited by coverage-config.ts.
  if (!postcode || postcode.length < 5 || !isWithinCoverage(postcode)) return [];

  try {
    const comparables = await externalDataRegistry.getComparables(
      postcode,
      propertyTypeForStreet(subject),
      subject.beds ?? 3
    );

    return mapStreetComparables(subject, comparables);
  } catch (error) {
    console.warn('[LiveComparableSelection] Street Data lookup failed:', error);
    return [];
  }
}

/**
 * Build a real-data candidate set wherever possible.
 *
 * In production this returns an empty array rather than invented prices when
 * neither the database nor Street Data can provide evidence. The calling
 * router already converts that into a user-friendly "valuation unavailable"
 * response.
 */
export async function buildCandidateSet(
  subject: Subject,
  radiusM: number = 1609
): Promise<Comp[]> {
  let hasDatabase = false;

  try {
    hasDatabase = Boolean(await getPool());
  } catch (error) {
    console.warn('[LiveComparableSelection] Database check failed:', error);
  }

  if (hasDatabase) {
    try {
      const stored = await buildStoredCandidateSet(subject, radiusM);
      if (stored.length > 0) {
        const hasStreetRows = stored.some(comp => comp.id < 0);
        const hasDatabaseRows = stored.some(comp => comp.id >= 0);
        const source: ValuationDataSource =
          hasStreetRows && hasDatabaseRows
            ? 'blended'
            : hasStreetRows
              ? 'street-data'
              : 'database';

        return stored.map(comp => ({ ...comp, dataSource: source } as SourcedComp));
      }
    } catch (error) {
      console.warn('[LiveComparableSelection] Stored comparable lookup failed:', error);
    }
  }

  // Critical fix: try Street Data before any database-free demo fallback.
  const streetComparables = await getStreetDataComparables(subject);
  if (streetComparables.length > 0) {
    console.info(
      `[LiveComparableSelection] Street Data supplied ${streetComparables.length} real comparables`
    );
    return streetComparables;
  }

  if (syntheticValuationsAllowed()) {
    try {
      const synthetic = await buildStoredCandidateSet(subject, radiusM);
      console.warn(
        '[LiveComparableSelection] Returning explicitly enabled synthetic demo comparables'
      );
      return synthetic.map(comp => ({ ...comp, dataSource: 'synthetic' } as SourcedComp));
    } catch (error) {
      console.warn('[LiveComparableSelection] Synthetic fallback failed:', error);
    }
  }

  console.warn(
    '[LiveComparableSelection] No real valuation evidence available; refusing to invent a production estimate'
  );
  return [];
}

export function getValuationDataSource(comps: Comp[]): ValuationDataSource {
  if (comps.length === 0) return 'unavailable';

  const sources = new Set(
    comps
      .map(comp => (comp as SourcedComp).dataSource)
      .filter((source): source is ValuationDataSource => Boolean(source))
  );

  if (sources.size === 0) return 'database';
  if (sources.size > 1 || sources.has('blended')) return 'blended';
  return [...sources][0];
}
