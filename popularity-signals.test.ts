/**
 * Tests for the privacy-safe popularity signals module.
 * Updated 2026-07-07 to match the current exported API
 * (older tests referenced a removed richer API).
 */
import { describe, it, expect } from 'vitest';
import {
  calculatePopularityTier,
  getPopularitySignal,
  shouldShowPopularityBadge,
  getSaveCountDisplay,
  getTimeBasedPopularityLabel,
  type PopularityMetrics,
} from './popularity-signals';

const baseMetrics: PopularityMetrics = {
  saveCount: 0,
  viewCount: 0,
  recentSaveCount: 0,
  recentViewCount: 0,
  inquiryCount: 0,
};

describe('Popularity Signals', () => {
  describe('calculatePopularityTier', () => {
    it('returns high tier for 10+ total saves', () => {
      expect(calculatePopularityTier({ ...baseMetrics, saveCount: 10 })).toBe('high');
    });

    it('returns high tier for 5+ recent saves', () => {
      expect(calculatePopularityTier({ ...baseMetrics, recentSaveCount: 5 })).toBe('high');
    });

    it('returns high tier for 3+ inquiries', () => {
      expect(calculatePopularityTier({ ...baseMetrics, inquiryCount: 3 })).toBe('high');
    });

    it('returns medium tier for 3-9 total saves', () => {
      expect(calculatePopularityTier({ ...baseMetrics, saveCount: 3 })).toBe('medium');
      expect(calculatePopularityTier({ ...baseMetrics, saveCount: 9 })).toBe('medium');
    });

    it('returns medium tier for 2-4 recent saves', () => {
      expect(calculatePopularityTier({ ...baseMetrics, recentSaveCount: 2 })).toBe('medium');
    });

    it('returns medium tier for 20+ recent views', () => {
      expect(calculatePopularityTier({ ...baseMetrics, recentViewCount: 20 })).toBe('medium');
    });

    it('returns medium tier for at least one inquiry', () => {
      expect(calculatePopularityTier({ ...baseMetrics, inquiryCount: 1 })).toBe('medium');
    });

    it('returns low tier below all thresholds', () => {
      expect(
        calculatePopularityTier({ ...baseMetrics, saveCount: 2, recentViewCount: 19 })
      ).toBe('low');
    });
  });

  describe('getPopularitySignal', () => {
    it('returns a "Popular" high-urgency signal for high tier', () => {
      const signal = getPopularitySignal({ ...baseMetrics, saveCount: 12 });
      expect(signal).not.toBeNull();
      expect(signal!.label).toBe('Popular');
      expect(signal!.urgency).toBe('high');
      expect(signal!.icon).toBe('🔥');
    });

    it('returns a "Growing Interest" medium-urgency signal for medium tier', () => {
      const signal = getPopularitySignal({ ...baseMetrics, saveCount: 4 });
      expect(signal).not.toBeNull();
      expect(signal!.label).toBe('Growing Interest');
      expect(signal!.urgency).toBe('medium');
    });

    it('returns null for low tier', () => {
      expect(getPopularitySignal(baseMetrics)).toBeNull();
    });

    it('describes buyer interest in consumer-friendly language', () => {
      const signal = getPopularitySignal({ ...baseMetrics, recentSaveCount: 6 });
      expect(signal!.description.toLowerCase()).toContain('interest');
    });
  });

  describe('shouldShowPopularityBadge', () => {
    it('shows a badge for high tier', () => {
      expect(shouldShowPopularityBadge({ ...baseMetrics, saveCount: 15 })).toBe(true);
    });

    it('shows a badge for medium tier', () => {
      expect(shouldShowPopularityBadge({ ...baseMetrics, inquiryCount: 1 })).toBe(true);
    });

    it('hides the badge for low tier', () => {
      expect(shouldShowPopularityBadge(baseMetrics)).toBe(false);
    });
  });

  describe('getSaveCountDisplay', () => {
    it('returns empty string for zero saves', () => {
      expect(getSaveCountDisplay(0)).toBe('');
    });

    it('uses singular phrasing for one save', () => {
      expect(getSaveCountDisplay(1)).toBe('1 buyer saved this');
    });

    it('uses plural phrasing below five saves', () => {
      expect(getSaveCountDisplay(4)).toBe('4 buyers saved this');
    });

    it('switches to "watching" phrasing from five saves', () => {
      expect(getSaveCountDisplay(7)).toBe('7+ buyers watching');
    });

    it('rounds down to nearest five between 10 and 49', () => {
      expect(getSaveCountDisplay(23)).toBe('20+ buyers watching');
    });

    it('caps at 50+ for large counts', () => {
      expect(getSaveCountDisplay(120)).toBe('50+ buyers watching');
    });
  });

  describe('getTimeBasedPopularityLabel', () => {
    it('returns "Very active this week" for 5+ recent saves', () => {
      expect(getTimeBasedPopularityLabel(5, 0)).toBe('Very active this week');
    });

    it('returns "Active this week" for 2-4 recent saves', () => {
      expect(getTimeBasedPopularityLabel(2, 0)).toBe('Active this week');
    });

    it('returns view-based label for 20+ recent views', () => {
      expect(getTimeBasedPopularityLabel(0, 20)).toBe('Lots of views this week');
    });

    it('returns "Getting attention" for 10-19 recent views', () => {
      expect(getTimeBasedPopularityLabel(0, 12)).toBe('Getting attention');
    });

    it('returns empty string below all thresholds', () => {
      expect(getTimeBasedPopularityLabel(1, 5)).toBe('');
    });
  });
});
