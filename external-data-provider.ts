/**
 * Modular External Data Provider Interface
 * 
 * This module defines a pluggable architecture for external property data providers.
 * Valory can integrate multiple providers (Property Market Intel, Zoopla, Rightmove, etc.)
 * without hard-coding dependencies on any single vendor.
 * 
 * The provider registry implements a fallback pattern:
 * - Try each provider in order until one succeeds
 * - Aggregate results from multiple providers for comparables
 * - Gracefully degrade if all providers are unavailable
 */

/**
 * Valuation bracket with confidence level
 */
export interface ValuationBracket {
  low: number;
  mid: number;
  high: number;
  confidence: 'high' | 'medium' | 'low';
  source: string;
  timestamp: Date;
}

/**
 * Comparable property for reference
 */
export interface Comparable {
  id: string;
  address: string;
  price: number;
  soldDate: Date;
  beds: number;
  baths: number;
  sqft?: number;
  condition?: string;
  source: string;
  similarity: number; // 0-1, how similar to query property
}

/**
 * Local market context and trends
 */
export interface MarketContext {
  postcode: string;
  averagePricePerSqft: number;
  priceChange12m: number; // percentage, e.g., +5.2 or -2.1
  priceChange3m: number;
  daysOnMarket: number;
  demandLevel: 'high' | 'medium' | 'low';
  marketTrend: 'rising' | 'stable' | 'falling';
  source: string;
  timestamp: Date;
}

/**
 * Location intelligence (amenities, transport, schools)
 */
export interface LocationData {
  postcode: string;
  nearbySchools: Array<{
    name: string;
    type: string; // 'primary', 'secondary', 'independent'
    distance: number; // meters
    rating?: string;
  }>;
  transportLinks: Array<{
    type: string; // 'bus', 'train', 'tube', 'tram'
    name: string;
    distance: number; // meters
  }>;
  amenities: Array<{
    type: string; // 'supermarket', 'park', 'hospital', 'library'
    name: string;
    distance: number; // meters
  }>;
  source: string;
  timestamp: Date;
}

/**
 * Provider health status
 */
export interface ProviderHealth {
  name: string;
  available: boolean;
  lastChecked: Date;
  responseTime?: number; // milliseconds
  error?: string;
}

/**
 * External valuation provider interface
 * Implement this interface to add a new data provider to Valory
 */
export interface ExternalValuationProvider {
  /**
   * Human-readable name of the provider
   */
  name: string;

  /**
   * Check if the provider is currently available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get initial valuation bracket for a property
   * Returns null if provider cannot estimate
   */
  getValuationBracket(
    postcode: string,
    propertyType: string,
    beds?: number,
    baths?: number
  ): Promise<ValuationBracket | null>;

  /**
   * Get comparable properties
   * Returns empty array if no comparables found
   */
  getComparables(
    postcode: string,
    propertyType: string,
    beds: number,
    baths?: number
  ): Promise<Comparable[]>;

  /**
   * Get local market context
   * Returns null if data unavailable
   */
  getLocalMarketContext(postcode: string): Promise<MarketContext | null>;

  /**
   * Get location intelligence (schools, transport, amenities)
   * Returns null if data unavailable
   */
  getLocationIntelligence(postcode: string): Promise<LocationData | null>;

  /**
   * Get provider health status
   */
  getHealth(): Promise<ProviderHealth>;
}

/**
 * Provider registry with fallback pattern
 * Manages multiple providers and coordinates requests
 */
export class ExternalDataProviderRegistry {
  private providers: ExternalValuationProvider[] = [];
  private cache: Map<string, { data: any; timestamp: Date }> = new Map();
  private cacheMaxAge = 3600000; // 1 hour in milliseconds

  /**
   * Register a new provider
   */
  register(provider: ExternalValuationProvider): void {
    this.providers.push(provider);
  }

  /**
   * Get all registered providers
   */
  getProviders(): ExternalValuationProvider[] {
    return [...this.providers];
  }

  /**
   * Get health status of all providers
   */
  async getAllHealth(): Promise<ProviderHealth[]> {
    return Promise.all(this.providers.map((p) => p.getHealth()));
  }

  /**
   * Try each provider in order until one succeeds
   * Returns first successful result or null if all fail
   */
  async getValuationBracket(
    postcode: string,
    propertyType: string,
    beds?: number,
    baths?: number
  ): Promise<ValuationBracket | null> {
    const cacheKey = `bracket:${postcode}:${propertyType}:${beds}:${baths}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    for (const provider of this.providers) {
      try {
        if (!(await provider.isAvailable())) {
          console.debug(`Provider ${provider.name} is unavailable`);
          continue;
        }

        const result = await provider.getValuationBracket(
          postcode,
          propertyType,
          beds,
          baths
        );
        if (result) {
          this.setCache(cacheKey, result);
          return result;
        }
      } catch (error) {
        console.warn(
          `Provider ${provider.name} failed to get valuation bracket:`,
          error
        );
        continue;
      }
    }

    return null;
  }

  /**
   * Aggregate comparables from all available providers
   * Deduplicates and ranks by similarity
   */
  async getComparables(
    postcode: string,
    propertyType: string,
    beds: number,
    baths?: number
  ): Promise<Comparable[]> {
    const cacheKey = `comps:${postcode}:${propertyType}:${beds}:${baths}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const allComps: Comparable[] = [];

    for (const provider of this.providers) {
      try {
        if (!(await provider.isAvailable())) {
          continue;
        }

        const comps = await provider.getComparables(
          postcode,
          propertyType,
          beds,
          baths
        );
        allComps.push(...comps);
      } catch (error) {
        console.warn(
          `Provider ${provider.name} failed to get comparables:`,
          error
        );
        continue;
      }
    }

    // Deduplicate by address
    const deduplicated = this.deduplicateComparables(allComps);

    // Sort by similarity (descending) then by sold date (newest first)
    const sorted = deduplicated.sort((a, b) => {
      if (b.similarity !== a.similarity) {
        return b.similarity - a.similarity;
      }
      return b.soldDate.getTime() - a.soldDate.getTime();
    });

    this.setCache(cacheKey, sorted);
    return sorted;
  }

  /**
   * Get market context from first available provider
   */
  async getLocalMarketContext(postcode: string): Promise<MarketContext | null> {
    const cacheKey = `market:${postcode}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    for (const provider of this.providers) {
      try {
        if (!(await provider.isAvailable())) {
          continue;
        }

        const context = await provider.getLocalMarketContext(postcode);
        if (context) {
          this.setCache(cacheKey, context);
          return context;
        }
      } catch (error) {
        console.warn(
          `Provider ${provider.name} failed to get market context:`,
          error
        );
        continue;
      }
    }

    return null;
  }

  /**
   * Get location intelligence from first available provider
   */
  async getLocationIntelligence(postcode: string): Promise<LocationData | null> {
    const cacheKey = `location:${postcode}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    for (const provider of this.providers) {
      try {
        if (!(await provider.isAvailable())) {
          continue;
        }

        const location = await provider.getLocationIntelligence(postcode);
        if (location) {
          this.setCache(cacheKey, location);
          return location;
        }
      } catch (error) {
        console.warn(
          `Provider ${provider.name} failed to get location intelligence:`,
          error
        );
        continue;
      }
    }

    return null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Private helper: get from cache if not expired
   */
  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp.getTime();
    if (age > this.cacheMaxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Private helper: set cache entry
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: new Date() });
  }

  /**
   * Private helper: deduplicate comparables by address
   */
  private deduplicateComparables(comps: Comparable[]): Comparable[] {
    const seen = new Map<string, Comparable>();

    for (const comp of comps) {
      const key = comp.address.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, comp);
      }
    }

    return Array.from(seen.values());
  }
}

/**
 * Street Data API Provider
 * https://api.data.street.co.uk/street-data-api/v2
 *
 * Auth: x-api-key header
 * Set STREET_DATA_API_KEY in .env to enable.
 *
 * Powers:
 *   Layer 1 — nearby_completed_transactions (Land Registry comparables)
 *   Layer 2 — estimated_values (Street Data AVM) + market_statistics
 */
export class StreetDataProvider implements ExternalValuationProvider {
  name = 'Street Data API';
  private apiKey: string;
  private baseUrl = 'https://api.data.street.co.uk/street-data-api/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private get headers() {
    return {
      'x-api-key': this.apiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  /** Normalise postcode: uppercase, no spaces — API pattern ^[A-Z]{1,2}\d[A-Z\d]??\d[A-Z]{2}$ */
  private normalisePostcode(postcode: string): string {
    return postcode.toUpperCase().replace(/\s+/g, '');
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const res = await fetch(`${this.baseUrl}/version`, {
        headers: this.headers,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Layer 2: Use Street Data's estimated_values AVM for the valuation bracket.
   * Response shape: data[n].attributes.estimated_values[] (newest first),
   * each entry has estimated_market_value.
   */
  async getValuationBracket(
    postcode: string,
    propertyType: string,
    beds?: number,
    baths?: number
  ): Promise<ValuationBracket | null> {
    try {
      const pc = this.normalisePostcode(postcode);
      const url = `${this.baseUrl}/properties/areas/postcodes?postcode=${pc}&tier=premium`;

      const res = await fetch(url, { headers: this.headers });
      if (!res.ok) return null;

      const data = await res.json();
      const properties: any[] = data?.data ?? [];

      if (!properties.length) return null;

      // Filter to matching property type + bedrooms where available
      const matches = properties.filter((p: any) => {
        const attrs = p.attributes ?? {};
        const pBeds = attrs.number_of_bedrooms?.value ?? null;
        const pType = attrs.property_type?.value ?? '';
        const typeMatch = !propertyType || this.matchPropertyType(pType, propertyType);
        const bedsMatch = !beds || pBeds === null || Math.abs((pBeds ?? 0) - beds) <= 1;
        return typeMatch && bedsMatch;
      });

      const pool = matches.length >= 3 ? matches : properties;

      // Extract latest AVM estimate from each property (estimated_values[0] is most recent)
      const avmValues = pool
        .map((p: any) => p.attributes?.estimated_values?.[0]?.estimated_market_value ?? null)
        .filter((v: any): v is number => typeof v === 'number' && v > 0);

      if (avmValues.length === 0) return null;

      avmValues.sort((a, b) => a - b);
      const mid = avmValues[Math.floor(avmValues.length / 2)];
      const low = avmValues[Math.floor(avmValues.length * 0.25)];
      const high = avmValues[Math.floor(avmValues.length * 0.75)];
      const confidence = avmValues.length >= 10 ? 'high' : avmValues.length >= 5 ? 'medium' : 'low';

      return {
        low: Math.round(low ?? mid * 0.92),
        mid: Math.round(mid),
        high: Math.round(high ?? mid * 1.08),
        confidence,
        source: `Street Data AVM (${avmValues.length} properties)`,
        timestamp: new Date(),
      };
    } catch (err) {
      console.warn('[StreetData] getValuationBracket error:', err);
      return null;
    }
  }

  /**
   * Layer 1: Pull Land Registry transactions from the queried property.
   * Response shape: data[n].attributes.transactions[] with {transaction_id, date, price}.
   */
  async getComparables(
    postcode: string,
    propertyType: string,
    beds: number,
    baths?: number
  ): Promise<Comparable[]> {
    try {
      const pc = this.normalisePostcode(postcode);
      const url = `${this.baseUrl}/properties/areas/postcodes?postcode=${pc}&tier=premium`;

      const res = await fetch(url, { headers: this.headers });
      if (!res.ok) return [];

      const data = await res.json();
      const properties: any[] = data?.data ?? [];

      const comparables: Comparable[] = [];

      for (const prop of properties) {
        const attrs = prop.attributes ?? {};
        const transactions: any[] = attrs.transactions ?? [];
        const txBeds: number = attrs.number_of_bedrooms?.value ?? beds;
        const bedsMatch = Math.abs(txBeds - beds) <= 1;
        if (!bedsMatch) continue;

        const addr = attrs.address?.royal_mail_format ?? {};
        const addressStr = [
          addr.building_name || addr.building_number,
          addr.thoroughfare,
          addr.post_town,
          addr.postcode,
        ].filter(Boolean).join(', ');

        const similarity = this.calculateSimilarity(
          beds, txBeds,
          propertyType, attrs.property_type?.value ?? ''
        );

        for (const tx of transactions.slice(0, 5)) {
          if (!tx.price || !tx.date) continue;
          comparables.push({
            id: tx.transaction_id ?? `${addr.postcode}-${tx.date}`,
            address: addressStr,
            price: Math.round(typeof tx.price === 'string' ? parseFloat(tx.price) : tx.price),
            soldDate: new Date(tx.date),
            beds: txBeds,
            baths: attrs.number_of_bathrooms?.value ?? (baths ?? 0),
            sqft: attrs.internal_area_square_metres
              ? Math.round(attrs.internal_area_square_metres * 10.764)
              : undefined,
            source: 'Street Data / Land Registry',
            similarity,
          });
        }
      }

      return comparables
        .sort((a, b) => b.similarity - a.similarity || b.soldDate.getTime() - a.soldDate.getTime())
        .slice(0, 20);
    } catch (err) {
      console.warn('[StreetData] getComparables error:', err);
      return [];
    }
  }

  /**
   * Market context: derived from estimated_values trend (no dedicated market_statistics field).
   * Computes 12m and 3m price change from the AVM history array (newest-first).
   */
  async getLocalMarketContext(postcode: string): Promise<MarketContext | null> {
    try {
      const pc = this.normalisePostcode(postcode);
      const url = `${this.baseUrl}/properties/areas/postcodes?postcode=${pc}&tier=premium`;

      const res = await fetch(url, { headers: this.headers });
      if (!res.ok) return null;

      const data = await res.json();
      const attrs = data?.data?.[0]?.attributes;
      if (!attrs) return null;

      const avmHistory: any[] = attrs.estimated_values ?? [];
      // avmHistory is newest-first; index 0 = current month
      const current = avmHistory[0]?.estimated_market_value ?? 0;
      const minus3m = avmHistory[3]?.estimated_market_value ?? current;
      const minus12m = avmHistory[12]?.estimated_market_value ?? current;

      const priceChange12m = minus12m > 0 ? ((current - minus12m) / minus12m) * 100 : 0;
      const priceChange3m = minus3m > 0 ? ((current - minus3m) / minus3m) * 100 : 0;

      const areaSqm: number = attrs.internal_area_square_metres ?? 0;
      const avgPricePerSqm = areaSqm > 0 && current > 0 ? current / areaSqm : 0;

      const trend = priceChange12m > 2 ? 'rising' : priceChange12m < -2 ? 'falling' : 'stable';

      return {
        postcode,
        averagePricePerSqft: avgPricePerSqm ? Math.round(avgPricePerSqm / 10.764) : 0,
        priceChange12m: Math.round(priceChange12m * 10) / 10,
        priceChange3m: Math.round(priceChange3m * 10) / 10,
        daysOnMarket: 60,
        demandLevel: 'medium',
        marketTrend: trend as 'rising' | 'stable' | 'falling',
        source: 'Street Data estimated_values trend',
        timestamp: new Date(),
      };
    } catch (err) {
      console.warn('[StreetData] getLocalMarketContext error:', err);
      return null;
    }
  }

  /**
   * Location intelligence: transport + education from attributes.
   */
  async getLocationIntelligence(postcode: string): Promise<LocationData | null> {
    try {
      const pc = this.normalisePostcode(postcode);
      const url = `${this.baseUrl}/properties/areas/postcodes?postcode=${pc}&tier=premium`;

      const res = await fetch(url, { headers: this.headers });
      if (!res.ok) return null;

      const data = await res.json();
      const attrs = data?.data?.[0]?.attributes;
      if (!attrs) return null;

      const schools = (attrs.education?.schools ?? []).map((s: any) => ({
        name: s.name ?? 'Unknown school',
        type: s.phase?.toLowerCase() ?? 'primary',
        distance: Math.round(s.distance_metres ?? 0),
        rating: s.ofsted_rating ?? undefined,
      }));

      const transport = (attrs.transport?.stations ?? []).map((t: any) => ({
        type: t.type ?? 'train',
        name: t.name ?? 'Station',
        distance: Math.round(t.distance_metres ?? 0),
      }));

      return {
        postcode,
        nearbySchools: schools.slice(0, 5),
        transportLinks: transport.slice(0, 5),
        amenities: [],
        source: 'Street Data transport+education',
        timestamp: new Date(),
      };
    } catch (err) {
      console.warn('[StreetData] getLocationIntelligence error:', err);
      return null;
    }
  }

  async getHealth(): Promise<ProviderHealth> {
    const available = await this.isAvailable();
    return {
      name: this.name,
      available,
      lastChecked: new Date(),
      error: available ? undefined : 'API unavailable or key not set',
    };
  }

  // ── Helpers ────────────────────────────────────────────────

  private matchPropertyType(apiType: string, valoryType: string): boolean {
    const t = apiType.toLowerCase();
    const v = valoryType.toLowerCase();
    if (v === 'flat' || v === 'apartment') return t.includes('flat') || t.includes('apartment');
    if (v === 'house') return t.includes('house') || t.includes('terraced') || t.includes('semi') || t.includes('detached');
    if (v === 'bungalow') return t.includes('bungalow');
    return true;
  }

  private calculateSimilarity(beds1: number, beds2: number, type1: string, type2: string): number {
    const bedsDiff = Math.abs(beds1 - beds2);
    const bedsScore = bedsDiff === 0 ? 1.0 : bedsDiff === 1 ? 0.7 : 0.3;
    const typeMatch = this.matchPropertyType(type2, type1) ? 1.0 : 0.5;
    return (bedsScore * 0.6) + (typeMatch * 0.4);
  }
}

/**
 * Stub provider for Zoopla (alternative provider)
 * Can be implemented in the future
 */
export class ZooplaProvider implements ExternalValuationProvider {
  name = 'Zoopla';
  private apiKey: string;
  private baseUrl = 'https://api.zoopla.co.uk/v1'; // Placeholder

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getValuationBracket(
    postcode: string,
    propertyType: string,
    beds?: number,
    baths?: number
  ): Promise<ValuationBracket | null> {
    // TODO: Implement Zoopla integration
    return null;
  }

  async getComparables(
    postcode: string,
    propertyType: string,
    beds: number,
    baths?: number
  ): Promise<Comparable[]> {
    // TODO: Implement Zoopla integration
    return [];
  }

  async getLocalMarketContext(postcode: string): Promise<MarketContext | null> {
    // TODO: Implement Zoopla integration
    return null;
  }

  async getLocationIntelligence(postcode: string): Promise<LocationData | null> {
    // TODO: Implement Zoopla integration
    return null;
  }

  async getHealth() {
    return {
      name: this.name,
      available: false,
      lastChecked: new Date(),
      error: 'Not implemented yet',
    };
  }
}

/**
 * Singleton instance of the provider registry
 * Initialize with providers in server startup
 */
export const externalDataRegistry = new ExternalDataProviderRegistry();
