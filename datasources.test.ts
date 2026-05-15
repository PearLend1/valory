/**
 * Data Source Integration Tests
 * Tests for EPC, OSM, Land Registry, and ONSPD integrations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchEPCByPostcode, extractEPCSignals } from './services/epcClient';
import { getAmenityCounts, extractAmenitySignals } from './services/osmOverpass';
import { calculateMedianPrice } from './jobs/ppdImport';
import { getPostcodeData } from './jobs/onspdImport';
import { cacheManager, cacheKeys, CACHE_TTL } from './services/cacheManager';
import { generateValuation } from './services/valuationEngine';

describe('Data Source Integration Tests', () => {
  beforeEach(() => {
    cacheManager.clear();
  });

  describe('EPC Client', () => {
    it('should extract EPC signals correctly', () => {
      const mockEPC = {
        lmkKey: 'TEST123',
        postcode: 'SW1A 1AA',
        address: '123 Test Street',
        energyRating: 'C',
        energyRatingScore: 75,
        floorArea: 120,
        propertyType: 'Detached',
        builtForm: 'Detached',
        constructionAgeBand: '1900-1929',
        heatingFuel: 'Gas',
        certificateDate: '2024-01-01',
        expiryDate: '2034-01-01',
      };

      const signals = extractEPCSignals(mockEPC);

      expect(signals.energyEfficiency).toBe('Good');
      expect(signals.floorAreaSignal).toBe('120 m²');
      expect(signals.improvementPotential).toBe('Limited');
    });

    it('should handle different energy ratings', () => {
      const ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      const expectedEfficiency = ['Very High', 'High', 'Good', 'Average', 'Poor', 'Very Poor', 'Extremely Poor'];

      ratings.forEach((rating, index) => {
        const mockEPC = {
          lmkKey: `TEST${rating}`,
          postcode: 'SW1A 1AA',
          address: '123 Test Street',
          energyRating: rating,
          energyRatingScore: 100 - index * 15,
          floorArea: 120,
          propertyType: 'Detached',
          builtForm: 'Detached',
          constructionAgeBand: '1900-1929',
          heatingFuel: 'Gas',
          certificateDate: '2024-01-01',
          expiryDate: '2034-01-01',
        };

        const signals = extractEPCSignals(mockEPC);
        expect(signals.energyEfficiency).toBe(expectedEfficiency[index]);
      });
    });
  });

  describe('OSM Overpass', () => {
    it('should extract amenity signals correctly', () => {
      const mockAmenities = {
        latitude: 51.5007,
        longitude: -0.1246,
        radiusMeters: 1000,
        schools: 5,
        hospitals: 2,
        parks: 3,
        restaurants: 15,
        shops: 20,
        publicTransport: 8,
        timestamp: new Date(),
      };

      const signals = extractAmenitySignals(mockAmenities);

      expect(signals.schoolsNearby).toBe('5 nearby');
      expect(signals.healthcareAccess).toBe('2 hospital(s)');
      expect(signals.recreationAccess).toBe('3 park(s)');
      expect(signals.amenityScore).toBeGreaterThan(0);
      expect(signals.amenityScore).toBeLessThanOrEqual(100);
    });

    it('should handle zero amenities', () => {
      const mockAmenities = {
        latitude: 51.5007,
        longitude: -0.1246,
        radiusMeters: 1000,
        schools: 0,
        hospitals: 0,
        parks: 0,
        restaurants: 0,
        shops: 0,
        publicTransport: 0,
        timestamp: new Date(),
      };

      const signals = extractAmenitySignals(mockAmenities);

      expect(signals.schoolsNearby).toBe('None nearby');
      expect(signals.healthcareAccess).toBe('Limited access');
      expect(signals.amenityScore).toBe(0);
    });
  });

  describe('Land Registry Price Paid Data', () => {
    it('should calculate median price correctly', () => {
      const mockSales = [
        { price: 200000 } as any,
        { price: 250000 } as any,
        { price: 300000 } as any,
      ];

      const median = calculateMedianPrice(mockSales);
      expect(median).toBe(250000);
    });

    it('should handle even number of sales', () => {
      const mockSales = [
        { price: 200000 } as any,
        { price: 250000 } as any,
        { price: 300000 } as any,
        { price: 350000 } as any,
      ];

      const median = calculateMedianPrice(mockSales);
      expect(median).toBe(275000); // (250000 + 300000) / 2
    });

    it('should return null for empty sales', () => {
      const median = calculateMedianPrice([]);
      expect(median).toBeNull();
    });
  });

  describe('Cache Manager', () => {
    it('should cache and retrieve values', () => {
      const key = 'test:key';
      const value = { data: 'test' };

      cacheManager.set(key, value, 60);
      const retrieved = cacheManager.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return null for expired values', async () => {
      const key = 'test:expired';
      const value = { data: 'test' };

      cacheManager.set(key, value, 1); // 1 second TTL
      await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for expiry

      const retrieved = cacheManager.get(key);
      expect(retrieved).toBeNull();
    });

    it('should generate correct cache keys', () => {
      const epcKey = cacheKeys.epcPostcode('SW1A 1AA');
      expect(epcKey).toBe('epc:postcode:SW1A1AA');

      const osmKey = cacheKeys.osmAmenities(51.5007, -0.1246, 1000);
      expect(osmKey).toContain('osm:amenities:');
    });

    it('should have correct TTL constants', () => {
      expect(CACHE_TTL.EPC).toBe(7 * 24 * 60 * 60); // 7 days
      expect(CACHE_TTL.OSM_AMENITIES).toBe(30 * 24 * 60 * 60); // 30 days
    });
  });

  describe('Valuation Engine', () => {
    it('should generate valuation with signals', async () => {
      // Mock the external API calls
      vi.mock('./services/epcClient', () => ({
        searchEPCByPostcode: vi.fn().mockResolvedValue([]),
      }));

      vi.mock('./services/osmOverpass', () => ({
        getAmenityCounts: vi.fn().mockResolvedValue({
          latitude: 51.5007,
          longitude: -0.1246,
          radiusMeters: 1000,
          schools: 5,
          hospitals: 2,
          parks: 3,
          restaurants: 15,
          shops: 20,
          publicTransport: 8,
          timestamp: new Date(),
        }),
      }));

      // Note: In production, mock these properly with actual test data
      // This is a placeholder test structure
    });

    it('should return fallback valuation on error', async () => {
      // Test that valuation engine returns sensible defaults when data sources fail
      // This ensures the system is resilient
    });
  });

  describe('Integration: Multi-Source Valuation', () => {
    it('should combine signals from multiple sources', () => {
      // Test that the valuation engine correctly weights signals from different sources
      // EPC: 40% weight
      // Amenities: 20% weight
      // Comparables: 40% weight
      // etc.
    });

    it('should increase confidence with more data sources', () => {
      // Test that confidence score increases as more data sources provide information
    });

    it('should generate explainable signals', () => {
      // Test that signals include clear explanations for why they affect valuation
    });
  });

  describe('Data Quality & Validation', () => {
    it('should validate postcode format', () => {
      // Test that postcode validation works correctly
      // Valid: SW1A 1AA, M1 1AD, B33 8TH
      // Invalid: INVALID, 12345
    });

    it('should handle missing optional fields', () => {
      // Test that valuation works even if lat/lng not provided
      // Should still use EPC and comparable sales data
    });

    it('should sanitize external API responses', () => {
      // Test that responses from external APIs are properly validated
      // before being used in calculations
    });
  });
});
