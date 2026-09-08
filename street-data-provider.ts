/**
 * Production Street Data provider.
 *
 * This implementation deliberately requests only the fields Valory needs for
 * postcode-level comparable evidence. It avoids `tier=premium` on an endpoint
 * that bills per returned property, verifies the API key with a free dry-run,
 * and applies request timeouts so an upstream outage cannot stall the app.
 */

import type {
  Comparable,
  ExternalValuationProvider,
  LocationData,
  MarketContext,
  ProviderHealth,
  ValuationBracket,
} from './external-data-provider';

const STREET_DATA_BASE_URL =
  'https://api.data.street.co.uk/street-data-api/v2';
const REQUEST_TIMEOUT_MS = 8_000;
const HEALTH_CACHE_MS = 5 * 60_000;
const MAX_PROPERTIES_PER_LOOKUP = 20;
const FULL_UK_POSTCODE = /^([A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}|GIR0AA)$/i;

interface StreetDataMetaValue<T> {
  value?: T | null;
}

interface StreetDataTransaction {
  transaction_id?: string;
  date?: string;
  price?: number;
}

interface StreetDataProperty {
  id?: string;
  attributes?: {
    address?: {
      royal_mail_format?: {
        sub_building_name?: string | null;
        building_name?: string | null;
        building_number?: string | null;
        dependent_thoroughfare?: string | null;
        thoroughfare?: string | null;
        dependent_locality?: string | null;
        post_town?: string | null;
        postcode?: string | null;
      };
    };
    property_type?: StreetDataMetaValue<string> | null;
    number_of_bedrooms?: StreetDataMetaValue<number> | null;
    number_of_bathrooms?: StreetDataMetaValue<number> | null;
    internal_area_square_metres?: number | null;
    transactions?: StreetDataTransaction[] | null;
  };
}

interface StreetDataAreaResponse {
  data?: StreetDataProperty[] | null;
  meta?: {
    request_cost_gbp?: number;
    balance_gbp?: number;
  };
}

export class ProductionStreetDataProvider
  implements ExternalValuationProvider
{
  readonly name = 'Street Data API';
  private readonly apiKey: string;
  private healthCache?: { available: boolean; checkedAt: number; responseTime: number };

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  private normalisePostcode(postcode: string): string {
    return postcode.toUpperCase().replace(/\s+/g, '');
  }

  private async fetchWithTimeout(
    path: string,
    params: URLSearchParams,
    timeoutMs: number = REQUEST_TIMEOUT_MS
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(`${STREET_DATA_BASE_URL}${path}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Verify both upstream availability and the supplied key. `/version` is a
   * public endpoint, so it cannot be used as an authentication health check.
   * Street Data documents dry-run requests as non-billable.
   */
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    const now = Date.now();
    if (this.healthCache && now - this.healthCache.checkedAt < HEALTH_CACHE_MS) {
      return this.healthCache.available;
    }

    const startedAt = Date.now();
    let available = false;

    try {
      const params = new URLSearchParams({
        postcode: 'M11JU',
        'fields[property]': 'address',
        results: '1',
        dry_run: 'true',
      });
      const response = await this.fetchWithTimeout(
        '/properties/areas/postcodes',
        params,
        5_000
      );
      available = response.ok;
    } catch {
      available = false;
    }

    this.healthCache = {
      available,
      checkedAt: now,
      responseTime: Date.now() - startedAt,
    };
    return available;
  }

  /**
   * Derive a postcode-level bracket from verified previous-sale comparables.
   * A Street Data single-property AVM should only be requested once Valory has
   * an exact address/UPRN; using a postcode median as that home's AVM would be
   * misleading.
   */
  async getValuationBracket(
    postcode: string,
    propertyType: string,
    beds: number = 3,
    baths?: number
  ): Promise<ValuationBracket | null> {
    const comparables = await this.getComparables(
      postcode,
      propertyType,
      beds,
      baths
    );
    if (comparables.length < 3) return null;

    const prices = comparables.map(comp => comp.price).sort((a, b) => a - b);
    const percentile = (fraction: number) =>
      prices[Math.min(prices.length - 1, Math.floor((prices.length - 1) * fraction))];

    return {
      low: percentile(0.25),
      mid: percentile(0.5),
      high: percentile(0.75),
      confidence:
        prices.length >= 10 ? 'high' : prices.length >= 5 ? 'medium' : 'low',
      source: `Street Data previous sales (${prices.length} comparables)`,
      timestamp: new Date(),
    };
  }

  async getComparables(
    postcode: string,
    propertyType: string,
    beds: number,
    baths?: number
  ): Promise<Comparable[]> {
    const normalisedPostcode = this.normalisePostcode(postcode);
    if (!FULL_UK_POSTCODE.test(normalisedPostcode)) return [];

    const params = new URLSearchParams({
      postcode: normalisedPostcode,
      'fields[property]': [
        'address',
        'property_type',
        'number_of_bedrooms',
        'number_of_bathrooms',
        'internal_area_square_metres',
        'transactions',
      ].join('|'),
      results: String(MAX_PROPERTIES_PER_LOOKUP),
      sort: '-latest_transaction_date',
    });

    for (const apiType of this.apiPropertyTypes(propertyType)) {
      params.append('filter[property_type]', apiType);
    }

    if (Number.isInteger(beds) && beds > 0) {
      for (const bedroomCount of new Set([
        Math.max(1, beds - 1),
        beds,
        beds + 1,
      ])) {
        params.append('filter[number_of_bedrooms]', String(bedroomCount));
      }
    }

    try {
      const response = await this.fetchWithTimeout(
        '/properties/areas/postcodes',
        params
      );
      if (response.status === 404) return [];
      if (!response.ok) {
        console.warn(
          `[StreetData] Comparable lookup failed with HTTP ${response.status}`
        );
        return [];
      }

      const payload = (await response.json()) as StreetDataAreaResponse;
      const properties = Array.isArray(payload.data) ? payload.data : [];
      const comparables: Comparable[] = [];

      for (const property of properties) {
        const attrs = property.attributes ?? {};
        const propertyBeds = attrs.number_of_bedrooms?.value ?? beds;
        const propertyBaths = attrs.number_of_bathrooms?.value ?? baths ?? 0;
        const apiPropertyType = attrs.property_type?.value ?? '';

        if (Math.abs(propertyBeds - beds) > 1) continue;
        if (!this.propertyTypeMatches(apiPropertyType, propertyType)) continue;

        const address = this.formatAddress(property);
        const latestTransaction = Array.isArray(attrs.transactions)
          ? [...attrs.transactions]
              .sort((a, b) =>
                String(b.date ?? '').localeCompare(String(a.date ?? ''))
              )
              .find(transaction => {
                const soldDate = transaction.date
                  ? new Date(transaction.date)
                  : null;
                return Boolean(
                  transaction.price &&
                    transaction.price > 0 &&
                    soldDate &&
                    !Number.isNaN(soldDate.getTime())
                );
              })
          : undefined;

        if (!latestTransaction?.date || !latestTransaction.price) continue;
        const soldDate = new Date(latestTransaction.date);

        // One latest sale per property prevents a repeatedly sold address from
        // receiving disproportionate weight in the postcode valuation.
        comparables.push({
          id:
            latestTransaction.transaction_id ??
            `${property.id ?? address}-${latestTransaction.date}`,
          address,
          price: Math.round(latestTransaction.price),
          soldDate,
          beds: propertyBeds,
          baths: propertyBaths,
          sqft: attrs.internal_area_square_metres
            ? Math.round(attrs.internal_area_square_metres * 10.7639)
            : undefined,
          source: 'Street Data / HM Land Registry',
          similarity: this.calculateSimilarity(
            beds,
            propertyBeds,
            propertyType,
            apiPropertyType
          ),
        });
      }

      return comparables
        .sort(
          (a, b) =>
            b.similarity - a.similarity ||
            b.soldDate.getTime() - a.soldDate.getTime()
        )
        .slice(0, 20);
    } catch (error) {
      const reason =
        error instanceof Error && error.name === 'AbortError'
          ? 'request timed out'
          : 'request failed';
      console.warn(`[StreetData] Comparable lookup ${reason}`);
      return [];
    }
  }

  /**
   * These postcode-only methods intentionally return null. Market statistics,
   * schools and transport should be fetched for the user-selected property by
   * Street Group ID or UPRN, not repeatedly for every address in a postcode.
   */
  async getLocalMarketContext(_postcode: string): Promise<MarketContext | null> {
    return null;
  }

  async getLocationIntelligence(_postcode: string): Promise<LocationData | null> {
    return null;
  }

  async getHealth(): Promise<ProviderHealth> {
    const available = await this.isAvailable();
    return {
      name: this.name,
      available,
      lastChecked: new Date(this.healthCache?.checkedAt ?? Date.now()),
      responseTime: this.healthCache?.responseTime,
      error: available
        ? undefined
        : 'Authentication failed, the upstream service is unavailable, or the request timed out',
    };
  }

  private apiPropertyTypes(propertyType: string): string[] {
    const normalised = propertyType.toLowerCase();
    if (normalised === 'flat' || normalised === 'apartment') {
      return ['Flats/Maisonettes'];
    }
    if (normalised === 'house') {
      return ['Detached', 'Semi-Detached', 'Terraced'];
    }
    return [];
  }

  private propertyTypeMatches(apiType: string, requestedType: string): boolean {
    const api = apiType.toLowerCase();
    const requested = requestedType.toLowerCase();
    if (!requested || requested === 'any' || requested === 'other') return true;
    if (requested === 'flat' || requested === 'apartment') {
      return api.includes('flat') || api.includes('maisonette');
    }
    if (requested === 'house') {
      return (
        api.includes('detached') ||
        api.includes('semi') ||
        api.includes('terraced') ||
        api.includes('house')
      );
    }
    return api.includes(requested);
  }

  private calculateSimilarity(
    requestedBeds: number,
    actualBeds: number,
    requestedType: string,
    actualType: string
  ): number {
    const bedroomDifference = Math.abs(requestedBeds - actualBeds);
    const bedroomScore =
      bedroomDifference === 0 ? 1 : bedroomDifference === 1 ? 0.7 : 0.3;
    const typeScore = this.propertyTypeMatches(actualType, requestedType)
      ? 1
      : 0.5;
    return bedroomScore * 0.6 + typeScore * 0.4;
  }

  private formatAddress(property: StreetDataProperty): string {
    const address = property.attributes?.address?.royal_mail_format;
    const parts = [
      address?.sub_building_name,
      address?.building_name || address?.building_number,
      address?.dependent_thoroughfare,
      address?.thoroughfare,
      address?.dependent_locality,
      address?.post_town,
      address?.postcode,
    ].filter((part): part is string => Boolean(part));

    return parts.join(', ') || property.id || 'Address unavailable';
  }
}
