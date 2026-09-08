/**
 * Production-safe valuation candidate selection.
 *
 * The legacy comparableSelection module returns synthetic demo comparables
 * immediately when DATABASE_URL is absent. That is useful locally, but it also
 * prevents a configured Street Data provider from ever being called on a
 * database-free deployment such as the Manus beta.
 *
 * This wrapper makes the production fallback order explicit:
 *   1. Street Data comparables for a complete covered postcode.
 *   2. Stored Land Registry comparables when a database is available.
 *   3. Synthetic comparables only when explicitly enabled for a labelled demo.
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

const FULL_UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

function syntheticValuationsAllowed(): boolean {
  return process.env.ALLOW_SYNTHETIC_VALUATIONS === 'true';
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
    .filter(
      comp =>
        Number.isFinite(comp.price) &&
        comp.price > 0 &&
        comp.soldDate instanceof Date &&
        !Number.isNaN(comp.soldDate.getTime())
    )
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
  const postcode = subject.postcode?.trim().toUpperCase();

  // Street Data's postcode endpoint requires a complete postcode. Valory's
  // controlled beta is intentionally limited by coverage-config.ts.
  if (!postcode || !FULL_UK_POSTCODE.test(postcode) || !isWithinCoverage(postcode)) {
    return [];
  }

  // No provider means the deployment secret was not supplied. This test avoids
  // treating a missing key as a successful but empty lookup.
  if (externalDataRegistry.getProviders().length === 0) {
    console.warn('[LiveComparableSelection] No external data provider is registered');
    return [];
  }

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
 * neither Street Data nor the database can provide evidence. The calling
 * router converts that into a user-friendly "valuation unavailable" response.
 */
export async function buildCandidateSet(
  subject: Subject,
  radiusM: number = 1609
): Promise<Comp[]> {
  // Critical fix: Street Data is attempted before any database-free demo path.
  const streetComparables = await getStreetDataComparables(subject);
  if (streetComparables.length > 0) {
    console.info(
      `[LiveComparableSelection] Street Data supplied ${streetComparables.length} real comparables`
    );
    return streetComparables;
  }

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
