/**
 * Valory Coverage Configuration
 * Defines the postcode sectors and outcodes covered by this Valory instance.
 * Used for agent matching, Street Data API fallback lookups, and availability checks.
 */

/** Full postcode sectors covered (with space, e.g. "TA19 0") */
export const COVERAGE_SECTORS: string[] = [
  'TA19 0',
  'TA20 1',
  'TA20 2',
  'TA20 4',
  'TA18 8',
  'TA16 5',
  'TA17 8',
  'TA19 9',
  'TA10 0',
  'TA13 5',
];

/** Unique outcodes derived from the covered sectors (e.g. "TA19") */
export const COVERAGE_OUTCODES: string[] = [
  ...new Set(COVERAGE_SECTORS.map(s => s.split(' ')[0])),
];

/**
 * Returns true if the given full postcode (e.g. "TA19 0AB") or outcode
 * falls within the configured coverage area.
 */
export function isWithinCoverage(postcode: string): boolean {
  const upper = postcode.toUpperCase().replace(/\s+/g, ' ').trim();
  // Check sector match (first 6–7 chars, e.g. "TA19 0")
  for (const sector of COVERAGE_SECTORS) {
    if (upper.startsWith(sector.replace(' ', ''))) return true;
    if (upper.startsWith(sector)) return true;
  }
  // Check outcode match
  const outcode = upper.split(' ')[0];
  return COVERAGE_OUTCODES.includes(outcode);
}

/**
 * For a given postcode, return the best matching coverage sector to use
 * when querying the Street Data API (returns the sector without space).
 */
export function getBestCoverageSector(postcode: string): string | null {
  const upper = postcode.toUpperCase().replace(/\s+/g, '');
  for (const sector of COVERAGE_SECTORS) {
    const sectorNoSpace = sector.replace(' ', '');
    if (upper.startsWith(sectorNoSpace)) return sectorNoSpace;
  }
  // Fall back to outcode
  const outcode = upper.match(/^[A-Z]{1,2}\d{1,2}/)?.[0] ?? null;
  if (outcode && COVERAGE_OUTCODES.includes(outcode)) return outcode;
  return null;
}
