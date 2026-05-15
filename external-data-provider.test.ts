import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ExternalValuationProvider,
  ExternalDataProviderRegistry,
  ValuationBracket,
  Comparable,
  MarketContext,
  LocationData,
  PropertyMarketIntelProvider,
  ZooplaProvider,
} from './external-data-provider';

/**
 * Mock provider for testing
 */
class MockProvider implements ExternalValuationProvider {
  name: string;
  available: boolean;
  valuationBracket: ValuationBracket | null;
  comparables: Comparable[];
  marketContext: MarketContext | null;
  locationData: LocationData | null;
  shouldThrow: boolean;

  constructor(name: string) {
    this.name = name;
    this.available = true;
    this.valuationBracket = null;
    this.comparables = [];
    this.marketContext = null;
    this.locationData = null;
    this.shouldThrow = false;
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  async getValuationBracket(
    postcode: string,
    propertyType: string,
    beds?: number,
    baths?: number
  ): Promise<ValuationBracket | null> {
    if (this.shouldThrow) throw new Error('Mock provider error');
    return this.valuationBracket;
  }

  async getComparables(
    postcode: string,
    propertyType: string,
    beds: number,
    baths?: number
  ): Promise<Comparable[]> {
    if (this.shouldThrow) throw new Error('Mock provider error');
    return this.comparables;
  }

  async getLocalMarketContext(postcode: string): Promise<MarketContext | null> {
    if (this.shouldThrow) throw new Error('Mock provider error');
    return this.marketContext;
  }

  async getLocationIntelligence(postcode: string): Promise<LocationData | null> {
    if (this.shouldThrow) throw new Error('Mock provider error');
    return this.locationData;
  }

  async getHealth() {
    return {
      name: this.name,
      available: this.available,
      lastChecked: new Date(),
    };
  }
}

describe('ExternalDataProviderRegistry', () => {
  let registry: ExternalDataProviderRegistry;
  let provider1: MockProvider;
  let provider2: MockProvider;

  beforeEach(() => {
    registry = new ExternalDataProviderRegistry();
    provider1 = new MockProvider('Provider1');
    provider2 = new MockProvider('Provider2');
    registry.clearCache();
  });

  describe('Provider Registration', () => {
    it('should register a provider', () => {
      registry.register(provider1);
      expect(registry.getProviders()).toHaveLength(1);
      expect(registry.getProviders()[0].name).toBe('Provider1');
    });

    it('should register multiple providers', () => {
      registry.register(provider1);
      registry.register(provider2);
      expect(registry.getProviders()).toHaveLength(2);
    });
  });

  describe('Valuation Bracket Retrieval', () => {
    it('should return valuation bracket from first available provider', async () => {
      const bracket: ValuationBracket = {
        low: 300000,
        mid: 350000,
        high: 400000,
        confidence: 'high',
        source: 'Provider1',
        timestamp: new Date(),
      };
      provider1.valuationBracket = bracket;

      registry.register(provider1);
      registry.register(provider2);

      const result = await registry.getValuationBracket('BS1 4QA', 'Detached', 4, 2);
      expect(result).toEqual(bracket);
    });

    it('should skip unavailable providers', async () => {
      const bracket: ValuationBracket = {
        low: 300000,
        mid: 350000,
        high: 400000,
        confidence: 'high',
        source: 'Provider2',
        timestamp: new Date(),
      };
      provider1.available = false;
      provider2.valuationBracket = bracket;

      registry.register(provider1);
      registry.register(provider2);

      const result = await registry.getValuationBracket('BS1 4QA', 'Detached', 4, 2);
      expect(result).toEqual(bracket);
    });

    it('should skip providers that throw errors', async () => {
      const bracket: ValuationBracket = {
        low: 300000,
        mid: 350000,
        high: 400000,
        confidence: 'high',
        source: 'Provider2',
        timestamp: new Date(),
      };
      provider1.shouldThrow = true;
      provider2.valuationBracket = bracket;

      registry.register(provider1);
      registry.register(provider2);

      const result = await registry.getValuationBracket('BS1 4QA', 'Detached', 4, 2);
      expect(result).toEqual(bracket);
    });

    it('should return null if no providers have data', async () => {
      provider1.valuationBracket = null;
      provider2.valuationBracket = null;

      registry.register(provider1);
      registry.register(provider2);

      const result = await registry.getValuationBracket('BS1 4QA', 'Detached', 4, 2);
      expect(result).toBeNull();
    });

    it('should return null if all providers are unavailable', async () => {
      provider1.available = false;
      provider2.available = false;

      registry.register(provider1);
      registry.register(provider2);

      const result = await registry.getValuationBracket('BS1 4QA', 'Detached', 4, 2);
      expect(result).toBeNull();
    });

    it('should cache valuation bracket results', async () => {
      const bracket: ValuationBracket = {
        low: 300000,
        mid: 350000,
        high: 400000,
        confidence: 'high',
        source: 'Provider1',
        timestamp: new Date(),
      };
      provider1.valuationBracket = bracket;

      registry.register(provider1);

      // First call
      const result1 = await registry.getValuationBracket('BS1 4QA', 'Detached', 4, 2);
      expect(result1).toEqual(bracket);

      // Make provider unavailable
      provider1.available = false;

      // Second call should return cached result
      const result2 = await registry.getValuationBracket('BS1 4QA', 'Detached', 4, 2);
      expect(result2).toEqual(bracket);
    });
  });

  describe('Comparables Retrieval', () => {
    it('should aggregate comparables from all providers', async () => {
      const comp1: Comparable = {
        id: '1',
        address: '10 High Street',
        price: 350000,
        soldDate: new Date('2025-01-01'),
        beds: 4,
        baths: 2,
        source: 'Provider1',
        similarity: 0.95,
      };
      const comp2: Comparable = {
        id: '2',
        address: '12 High Street',
        price: 360000,
        soldDate: new Date('2025-02-01'),
        beds: 4,
        baths: 2,
        source: 'Provider2',
        similarity: 0.92,
      };

      provider1.comparables = [comp1];
      provider2.comparables = [comp2];

      registry.register(provider1);
      registry.register(provider2);

      const result = await registry.getComparables('BS1 4QA', 'Detached', 4, 2);
      expect(result).toHaveLength(2);
      expect(result[0].similarity).toBeGreaterThanOrEqual(result[1].similarity);
    });

    it('should deduplicate comparables by address', async () => {
      const comp1: Comparable = {
        id: '1',
        address: '10 High Street',
        price: 350000,
        soldDate: new Date('2025-01-01'),
        beds: 4,
        baths: 2,
        source: 'Provider1',
        similarity: 0.95,
      };
      const comp2: Comparable = {
        id: '2',
        address: '10 HIGH STREET', // Same address, different case
        price: 350000,
        soldDate: new Date('2025-01-01'),
        beds: 4,
        baths: 2,
        source: 'Provider2',
        similarity: 0.95,
      };

      provider1.comparables = [comp1];
      provider2.comparables = [comp2];

      registry.register(provider1);
      registry.register(provider2);

      const result = await registry.getComparables('BS1 4QA', 'Detached', 4, 2);
      expect(result).toHaveLength(1);
    });

    it('should sort comparables by similarity then by sold date', async () => {
      const comp1: Comparable = {
        id: '1',
        address: '10 High Street',
        price: 350000,
        soldDate: new Date('2025-01-01'),
        beds: 4,
        baths: 2,
        source: 'Provider1',
        similarity: 0.90,
      };
      const comp2: Comparable = {
        id: '2',
        address: '12 High Street',
        price: 360000,
        soldDate: new Date('2025-02-01'),
        beds: 4,
        baths: 2,
        source: 'Provider2',
        similarity: 0.95,
      };

      provider1.comparables = [comp1];
      provider2.comparables = [comp2];

      registry.register(provider1);
      registry.register(provider2);

      const result = await registry.getComparables('BS1 4QA', 'Detached', 4, 2);
      expect(result[0].similarity).toBe(0.95);
      expect(result[1].similarity).toBe(0.90);
    });

    it('should return empty array if no comparables found', async () => {
      provider1.comparables = [];
      provider2.comparables = [];

      registry.register(provider1);
      registry.register(provider2);

      const result = await registry.getComparables('BS1 4QA', 'Detached', 4, 2);
      expect(result).toHaveLength(0);
    });

    it('should cache comparables results', async () => {
      const comp1: Comparable = {
        id: '1',
        address: '10 High Street',
        price: 350000,
        soldDate: new Date('2025-01-01'),
        beds: 4,
        baths: 2,
        source: 'Provider1',
        similarity: 0.95,
      };

      provider1.comparables = [comp1];

      registry.register(provider1);

      // First call
      const result1 = await registry.getComparables('BS1 4QA', 'Detached', 4, 2);
      expect(result1).toHaveLength(1);

      // Make provider throw
      provider1.shouldThrow = true;

      // Second call should return cached result
      const result2 = await registry.getComparables('BS1 4QA', 'Detached', 4, 2);
      expect(result2).toHaveLength(1);
    });
  });

  describe('Market Context Retrieval', () => {
    it('should return market context from first available provider', async () => {
      const context: MarketContext = {
        postcode: 'BS1 4QA',
        averagePricePerSqft: 450,
        priceChange12m: 5.2,
        priceChange3m: 1.1,
        daysOnMarket: 28,
        demandLevel: 'high',
        marketTrend: 'rising',
        source: 'Provider1',
        timestamp: new Date(),
      };
      provider1.marketContext = context;

      registry.register(provider1);
      registry.register(provider2);

      const result = await registry.getLocalMarketContext('BS1 4QA');
      expect(result).toEqual(context);
    });

    it('should cache market context results', async () => {
      const context: MarketContext = {
        postcode: 'BS1 4QA',
        averagePricePerSqft: 450,
        priceChange12m: 5.2,
        priceChange3m: 1.1,
        daysOnMarket: 28,
        demandLevel: 'high',
        marketTrend: 'rising',
        source: 'Provider1',
        timestamp: new Date(),
      };
      provider1.marketContext = context;

      registry.register(provider1);

      // First call
      const result1 = await registry.getLocalMarketContext('BS1 4QA');
      expect(result1).toEqual(context);

      // Make provider unavailable
      provider1.available = false;

      // Second call should return cached result
      const result2 = await registry.getLocalMarketContext('BS1 4QA');
      expect(result2).toEqual(context);
    });
  });

  describe('Location Intelligence Retrieval', () => {
    it('should return location data from first available provider', async () => {
      const location: LocationData = {
        postcode: 'BS1 4QA',
        nearbySchools: [
          {
            name: 'Primary School',
            type: 'primary',
            distance: 500,
            rating: 'Outstanding',
          },
        ],
        transportLinks: [
          { type: 'bus', name: 'Route 1', distance: 200 },
          { type: 'train', name: 'Bristol Temple Meads', distance: 1000 },
        ],
        amenities: [
          { type: 'supermarket', name: 'Tesco', distance: 300 },
          { type: 'park', name: 'Brandon Hill', distance: 400 },
        ],
        source: 'Provider1',
        timestamp: new Date(),
      };
      provider1.locationData = location;

      registry.register(provider1);
      registry.register(provider2);

      const result = await registry.getLocationIntelligence('BS1 4QA');
      expect(result).toEqual(location);
      expect(result?.nearbySchools).toHaveLength(1);
      expect(result?.transportLinks).toHaveLength(2);
      expect(result?.amenities).toHaveLength(2);
    });

    it('should cache location data results', async () => {
      const location: LocationData = {
        postcode: 'BS1 4QA',
        nearbySchools: [],
        transportLinks: [],
        amenities: [],
        source: 'Provider1',
        timestamp: new Date(),
      };
      provider1.locationData = location;

      registry.register(provider1);

      // First call
      const result1 = await registry.getLocationIntelligence('BS1 4QA');
      expect(result1).toEqual(location);

      // Make provider unavailable
      provider1.available = false;

      // Second call should return cached result
      const result2 = await registry.getLocationIntelligence('BS1 4QA');
      expect(result2).toEqual(location);
    });
  });

  describe('Provider Health', () => {
    it('should return health status of all providers', async () => {
      registry.register(provider1);
      registry.register(provider2);

      const health = await registry.getAllHealth();
      expect(health).toHaveLength(2);
      expect(health[0].name).toBe('Provider1');
      expect(health[1].name).toBe('Provider2');
    });

    it('should reflect provider availability in health status', async () => {
      provider1.available = true;
      provider2.available = false;

      registry.register(provider1);
      registry.register(provider2);

      const health = await registry.getAllHealth();
      expect(health[0].available).toBe(true);
      expect(health[1].available).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      const bracket: ValuationBracket = {
        low: 300000,
        mid: 350000,
        high: 400000,
        confidence: 'high',
        source: 'Provider1',
        timestamp: new Date(),
      };
      provider1.valuationBracket = bracket;

      registry.register(provider1);

      // First call caches result
      await registry.getValuationBracket('BS1 4QA', 'Detached', 4, 2);

      // Make provider throw
      provider1.shouldThrow = true;

      // Clear cache
      registry.clearCache();

      // Next call should fail because cache is cleared and provider throws
      const result = await registry.getValuationBracket('BS1 4QA', 'Detached', 4, 2);
      expect(result).toBeNull();
    });
  });
});

describe('PropertyMarketIntelProvider', () => {
  let provider: PropertyMarketIntelProvider;

  beforeEach(() => {
    provider = new PropertyMarketIntelProvider('test-api-key');
  });

  it('should have correct name', () => {
    expect(provider.name).toBe('Property Market Intel');
  });

  it('should be available with API key', async () => {
    const available = await provider.isAvailable();
    expect(available).toBe(true);
  });

  it('should not be available without API key', async () => {
    const emptyProvider = new PropertyMarketIntelProvider('');
    const available = await emptyProvider.isAvailable();
    expect(available).toBe(false);
  });

  it('should return null for valuation bracket (not yet implemented)', async () => {
    const result = await provider.getValuationBracket('BS1 4QA', 'Detached', 4, 2);
    expect(result).toBeNull();
  });

  it('should return empty array for comparables (not yet implemented)', async () => {
    const result = await provider.getComparables('BS1 4QA', 'Detached', 4, 2);
    expect(result).toEqual([]);
  });

  it('should return null for market context (not yet implemented)', async () => {
    const result = await provider.getLocalMarketContext('BS1 4QA');
    expect(result).toBeNull();
  });

  it('should return null for location intelligence (not yet implemented)', async () => {
    const result = await provider.getLocationIntelligence('BS1 4QA');
    expect(result).toBeNull();
  });
});

describe('ZooplaProvider', () => {
  let provider: ZooplaProvider;

  beforeEach(() => {
    provider = new ZooplaProvider('test-api-key');
  });

  it('should have correct name', () => {
    expect(provider.name).toBe('Zoopla');
  });

  it('should be available with API key', async () => {
    const available = await provider.isAvailable();
    expect(available).toBe(true);
  });

  it('should return null for all methods (not yet implemented)', async () => {
    const bracket = await provider.getValuationBracket('BS1 4QA', 'Detached', 4, 2);
    const comps = await provider.getComparables('BS1 4QA', 'Detached', 4, 2);
    const context = await provider.getLocalMarketContext('BS1 4QA');
    const location = await provider.getLocationIntelligence('BS1 4QA');

    expect(bracket).toBeNull();
    expect(comps).toEqual([]);
    expect(context).toBeNull();
    expect(location).toBeNull();
  });
});
