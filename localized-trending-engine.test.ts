import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateTrendingScore,
  propertyMatchesPreferences,
  calculateViewingVelocity,
  hasRecentOfferActivity,
  isFreshLaunch,
  isBackOnMarket,
  countRecentActivity,
  rankLocalizedTrending,
  LocalizedTrendingConfig,
} from './localized-trending-engine';

describe('Localized Trending Engine', () => {
  const mockConfig: LocalizedTrendingConfig = {
    userAreas: ['SW1A', 'SW1B'],
    priceRangeMin: 200000,
    priceRangeMax: 800000,
    propertyTypes: ['house', 'apartment'],
    bedsMin: 2,
    bedsMax: 5,
    bathsMin: 1,
    bathsMax: 3,
  };

  describe('calculateTrendingScore', () => {
    it('should calculate high trending score for active properties', () => {
      const score = calculateTrendingScore(
        6, // 6 recent events
        3.5, // high viewing velocity
        true, // has offer activity
        true, // fresh launch
        false, // not back on market
        1 // 1 day since launch
      );
      expect(score).toBeGreaterThan(80);
    });

    it('should calculate low trending score for inactive properties', () => {
      const score = calculateTrendingScore(
        0, // no recent events
        0, // no viewing velocity
        false, // no offer activity
        false, // not fresh
        false, // not back on market
        30 // 30 days old
      );
      expect(score).toBeLessThan(10);
    });

    it('should cap score at 100', () => {
      const score = calculateTrendingScore(10, 10, true, true, true, 0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should weight recent activity heavily', () => {
      const scoreWithActivity = calculateTrendingScore(7, 0, false, false, false, 7);
      const scoreWithoutActivity = calculateTrendingScore(0, 0, false, false, false, 7);
      expect(scoreWithActivity).toBeGreaterThan(scoreWithoutActivity);
    });

    it('should weight viewing velocity appropriately', () => {
      const scoreHighVelocity = calculateTrendingScore(0, 5, false, false, false, 7);
      const scoreLowVelocity = calculateTrendingScore(0, 1, false, false, false, 7);
      expect(scoreHighVelocity).toBeGreaterThan(scoreLowVelocity);
    });

    it('should give bonus for offer activity', () => {
      const scoreWithOffer = calculateTrendingScore(0, 0, true, false, false, 7);
      const scoreWithoutOffer = calculateTrendingScore(0, 0, false, false, false, 7);
      expect(scoreWithOffer).toBeGreaterThan(scoreWithoutOffer);
    });

    it('should give bonus for fresh launches', () => {
      const scoreFresh = calculateTrendingScore(0, 0, false, true, false, 1);
      const scoreOld = calculateTrendingScore(0, 0, false, false, false, 30);
      expect(scoreFresh).toBeGreaterThan(scoreOld);
    });

    it('should give bonus for back-on-market properties', () => {
      const scoreBackOnMarket = calculateTrendingScore(0, 0, false, false, true, 7);
      const scoreNormal = calculateTrendingScore(0, 0, false, false, false, 7);
      expect(scoreBackOnMarket).toBeGreaterThan(scoreNormal);
    });
  });

  describe('propertyMatchesPreferences', () => {
    const mockProperty = {
      id: 1,
      address: '123 Main St',
      postcode: 'SW1A 1AA',
      location: 'London',
      price: 500000,
      propertyType: 'house',
      beds: 3,
      baths: 2,
    };

    it('should match property within preferences', () => {
      const matches = propertyMatchesPreferences(mockProperty, mockConfig);
      expect(matches).toBe(true);
    });

    it('should reject property outside area', () => {
      const config = { ...mockConfig, userAreas: ['E1', 'E2'] };
      const matches = propertyMatchesPreferences(mockProperty, config);
      expect(matches).toBe(false);
    });

    it('should reject property outside price range', () => {
      const config = { ...mockConfig, priceRangeMax: 400000 };
      const matches = propertyMatchesPreferences(mockProperty, config);
      expect(matches).toBe(false);
    });

    it('should reject property with wrong type', () => {
      const config = { ...mockConfig, propertyTypes: ['apartment', 'townhouse'] };
      const matches = propertyMatchesPreferences(mockProperty, config);
      expect(matches).toBe(false);
    });

    it('should reject property with too many beds', () => {
      const config = { ...mockConfig, bedsMax: 2 };
      const matches = propertyMatchesPreferences(mockProperty, config);
      expect(matches).toBe(false);
    });

    it('should reject property with too few beds', () => {
      const config = { ...mockConfig, bedsMin: 4 };
      const matches = propertyMatchesPreferences(mockProperty, config);
      expect(matches).toBe(false);
    });
  });

  describe('calculateViewingVelocity', () => {
    it('should calculate velocity correctly', () => {
      const velocity = calculateViewingVelocity(21, 7); // 21 views in 7 days
      expect(velocity).toBe(3); // 3 views per day
    });

    it('should return 0 for day 0', () => {
      const velocity = calculateViewingVelocity(10, 0);
      expect(velocity).toBe(0);
    });

    it('should cap at 7 days', () => {
      const velocity = calculateViewingVelocity(70, 14); // 70 views in 14 days
      expect(velocity).toBe(10); // 70 / 7 = 10
    });
  });

  describe('hasRecentOfferActivity', () => {
    it('should detect recent offer received', () => {
      const events = [
        {
          eventType: 'OFFER_RECEIVED',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ];
      expect(hasRecentOfferActivity(events)).toBe(true);
    });

    it('should detect recent offer fell through', () => {
      const events = [
        {
          eventType: 'OFFER_FELL_THROUGH',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      ];
      expect(hasRecentOfferActivity(events)).toBe(true);
    });

    it('should ignore old offer activity', () => {
      const events = [
        {
          eventType: 'OFFER_RECEIVED',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      ];
      expect(hasRecentOfferActivity(events)).toBe(false);
    });

    it('should return false for empty events', () => {
      expect(hasRecentOfferActivity([])).toBe(false);
    });
  });

  describe('isFreshLaunch', () => {
    it('should detect launch within 3 days', () => {
      const events = [
        {
          eventType: 'LAUNCHED',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ];
      expect(isFreshLaunch(events)).toBe(true);
    });

    it('should reject launch older than 3 days', () => {
      const events = [
        {
          eventType: 'LAUNCHED',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ];
      expect(isFreshLaunch(events)).toBe(false);
    });

    it('should return false for empty events', () => {
      expect(isFreshLaunch([])).toBe(false);
    });
  });

  describe('isBackOnMarket', () => {
    it('should detect back on market within 7 days', () => {
      const events = [
        {
          eventType: 'BACK_ON_MARKET',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      ];
      expect(isBackOnMarket(events)).toBe(true);
    });

    it('should reject back on market older than 7 days', () => {
      const events = [
        {
          eventType: 'BACK_ON_MARKET',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      ];
      expect(isBackOnMarket(events)).toBe(false);
    });
  });

  describe('countRecentActivity', () => {
    it('should count events in last 7 days', () => {
      const events = [
        { eventType: 'VIEWING_BOOKED', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { eventType: 'VIEWING_BOOKED', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { eventType: 'VIEWING_BOOKED', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
      ];
      expect(countRecentActivity(events)).toBe(2);
    });

    it('should return 0 for empty events', () => {
      expect(countRecentActivity([])).toBe(0);
    });
  });

  describe('rankLocalizedTrending', () => {
    const mockProperties = [
      {
        id: 1,
        address: '123 Main St',
        postcode: 'SW1A 1AA',
        location: 'London',
        price: 500000,
        propertyType: 'house',
        beds: 3,
        baths: 2,
        viewCount: 21,
        momentum: 'high',
        timelineEvents: [
          { eventType: 'LAUNCHED', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
          { eventType: 'VIEWING_BOOKED', timestamp: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000) },
          { eventType: 'VIEWING_BOOKED', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
          { eventType: 'OFFER_RECEIVED', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        ],
      },
      {
        id: 2,
        address: '456 Oak Ave',
        postcode: 'SW1B 2BB',
        location: 'London',
        price: 600000,
        propertyType: 'apartment',
        beds: 2,
        baths: 1,
        viewCount: 5,
        momentum: 'stable',
        timelineEvents: [
          { eventType: 'LAUNCHED', timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
        ],
      },
      {
        id: 3,
        address: '789 Pine Rd',
        postcode: 'E1 1AA',
        location: 'East London',
        price: 500000,
        propertyType: 'house',
        beds: 3,
        baths: 2,
        viewCount: 30,
        momentum: 'high',
        timelineEvents: [
          { eventType: 'LAUNCHED', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        ],
      },
    ];

    it('should filter by area preferences', () => {
      const ranked = rankLocalizedTrending(mockProperties, mockConfig, 50);
      expect(ranked.length).toBe(2); // Only properties in SW1A and SW1B
      expect(ranked.every((p) => p.postcode && ['SW1A', 'SW1B'].some((area) => p.postcode.startsWith(area)))).toBe(true);
    });

    it('should rank by trending score', () => {
      const ranked = rankLocalizedTrending(mockProperties, mockConfig, 50);
      expect(ranked.length).toBeGreaterThan(0);
      if (ranked.length > 1) {
        expect(ranked[0].trendingScore).toBeGreaterThanOrEqual(ranked[1].trendingScore);
      }
    });

    it('should prioritize fresh launches with activity', () => {
      const ranked = rankLocalizedTrending(mockProperties, mockConfig, 50);
      expect(ranked.length).toBe(2);
      // Property 1 should rank higher due to fresh launch and high activity
      const prop1 = ranked.find(p => p.propertyId === 1);
      expect(prop1).toBeDefined();
    });

    it('should respect limit', () => {
      const ranked = rankLocalizedTrending(mockProperties, mockConfig, 1);
      expect(ranked.length).toBeLessThanOrEqual(1);
    });

    it('should include trending metadata', () => {
      const ranked = rankLocalizedTrending(mockProperties, mockConfig, 50);
      expect(ranked.length).toBeGreaterThan(0);
      expect(ranked[0]).toHaveProperty('trendingScore');
      expect(ranked[0]).toHaveProperty('recentActivityCount');
      expect(ranked[0]).toHaveProperty('viewingVelocity');
      expect(ranked[0]).toHaveProperty('lastEventType');
      expect(ranked[0]).toHaveProperty('propertyId');
    });
  });
});
