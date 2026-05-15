import { describe, it, expect } from 'vitest';
import {
  calculatePopularityTier,
  getPopularityLabel,
  getPopularityDescription,
  getPopularitySignal,
  shouldShowPopularityBadge,
  getSaveCountDisplay,
  getViewCountDisplay,
  getTimeBasedPopularityLabel,
  getAreaPopularityLabel,
  calculatePopularityScore,
  getVendorEngagementSummary,
  type PopularityMetrics,
} from './popularity-signals';

describe('Popularity Signals', () => {
  const baseMetrics: PopularityMetrics = {
    saveCount: 0,
    viewCount: 0,
    recentSaveCount: 0,
    recentViewCount: 0,
    inquiryCount: 0,
  };

  describe('calculatePopularityTier', () => {
    it('should return high tier for 20+ recent saves', () => {
      const metrics: PopularityMetrics = { ...baseMetrics, recentSaveCount: 20 };
      expect(calculatePopularityTier(metrics)).toBe('high');
    });

    it('should return high tier for 50+ recent views', () => {
      const metrics: PopularityMetrics = { ...baseMetrics, recentViewCount: 50 };
      expect(calculatePopularityTier(metrics)).toBe('high');
    });

    it('should return medium tier for 10-19 recent saves', () => {
      const metrics: PopularityMetrics = { ...baseMetrics, recentSaveCount: 15 };
      expect(calculatePopularityTier(metrics)).toBe('medium');
    });

    it('should return medium tier for 30-49 recent views', () => {
      const metrics: PopularityMetrics = { ...baseMetrics, recentViewCount: 40 };
      expect(calculatePopularityTier(metrics)).toBe('medium');
    });

    it('should return low tier for below thresholds', () => {
      const metrics: PopularityMetrics = { ...baseMetrics, recentSaveCount: 5, recentViewCount: 10 };
      expect(calculatePopularityTier(metrics)).toBe('low');
    });
  });

  describe('getPopularityLabel', () => {
    it('should return "Popular" for high tier', () => {
      const metrics: PopularityMetrics = { ...baseMetrics, recentSaveCount: 20 };
      expect(getPopularityLabel(metrics)).toBe('Popular');
    });

    it('should return "Growing interest" for medium tier', () => {
      const metrics: PopularityMetrics = { ...baseMetrics, recentSaveCount: 15 };
      expect(getPopularityLabel(metrics)).toBe('Growing interest');
    });

    it('should return empty string for low tier', () => {
      const metrics: PopularityMetrics = { ...baseMetrics };
      expect(getPopularityLabel(metrics)).toBe('');
    });
  });

  describe('getPopularityDescription', () => {
    it('should show week saves for high tier', () => {
      const metrics: PopularityMetrics = {
        ...baseMetrics,
        saveCount: 50,
        recentSaveCount: 25,
      };
      const desc = getPopularityDescription(metrics);
      expect(desc).toContain('25 saves this week');
      expect(desc).toContain('high buyer interest');
    });

    it('should show total saves for medium tier', () => {
      const metrics: PopularityMetrics = { ...baseMetrics, saveCount: 15, recentSaveCount: 10 };
      const desc = getPopularityDescription(metrics);
      expect(desc).toContain('15 saves');
      expect(desc).toContain('growing interest');
    });

    it('should show save count for low tier with saves', () => {
      const metrics: PopularityMetrics = { ...baseMetrics, saveCount: 5 };
      const desc = getPopularityDescription(metrics);
      expect(desc).toBe('5 saves');
    });

    it('should return empty string for no saves', () => {
      const metrics: PopularityMetrics = { ...baseMetrics };
      expect(getPopularityDescription(metrics)).toBe('');
    });
  });

  describe('getPopularitySignal', () => {
    it('should return high signal for high tier', () => {
      const metrics: PopularityMetrics = { ...baseMetrics, recentSaveCount: 20 };
      const signal = getPopularitySignal(metrics);
      expect(signal).not.toBeNull();
      expect(signal?.label).toBe('Popular');
      expect(signal?.urgency).toBe('high');
      expect(signal?.icon).toBe('🔥');
    });

    it('should return medium signal for medium tier', () => {
      const metrics: PopularityMetrics = { ...baseMetrics, recentSaveCount: 15 };
      const signal = getPopularitySignal(metrics);
      expect(signal).not.toBeNull();
      expect(signal?.label).toBe('Growing interest');
      expect(signal?.urgency).toBe('medium');
      expect(signal?.icon).toBe('📈');
    });

    it('should return null for low tier', () => {
      const metrics: PopularityMetrics = { ...baseMetrics };
      expect(getPopularitySignal(metrics)).toBeNull();
    });
  });

  describe('shouldShowPopularityBadge', () => {
    it('should return true for high tier', () => {
      const metrics: PopularityMetrics = { ...baseMetrics, recentSaveCount: 20 };
      expect(shouldShowPopularityBadge(metrics)).toBe(true);
    });

    it('should return true for medium tier', () => {
      const metrics: PopularityMetrics = { ...baseMetrics, recentSaveCount: 15 };
      expect(shouldShowPopularityBadge(metrics)).toBe(true);
    });

    it('should return false for low tier', () => {
      const metrics: PopularityMetrics = { ...baseMetrics };
      expect(shouldShowPopularityBadge(metrics)).toBe(false);
    });
  });

  describe('getSaveCountDisplay', () => {
    it('should return empty string for 0 saves', () => {
      expect(getSaveCountDisplay(0)).toBe('');
    });

    it('should return "1 save" for 1 save', () => {
      expect(getSaveCountDisplay(1)).toBe('1 save');
    });

    it('should return "X saves" for 2-9 saves', () => {
      expect(getSaveCountDisplay(5)).toBe('5 saves');
    });

    it('should return "X saves" for 10-99 saves', () => {
      expect(getSaveCountDisplay(50)).toBe('50 saves');
    });

    it('should round to nearest 10 for 100+ saves', () => {
      expect(getSaveCountDisplay(150)).toContain('+');
    });
  });

  describe('getViewCountDisplay', () => {
    it('should return empty string for 0 views', () => {
      expect(getViewCountDisplay(0)).toBe('');
    });

    it('should return "X views" for 1-99 views', () => {
      expect(getViewCountDisplay(50)).toBe('50 views');
    });

    it('should round to hundreds for 100-999 views', () => {
      expect(getViewCountDisplay(550)).toContain('00+');
    });

    it('should show in thousands for 1000+ views', () => {
      expect(getViewCountDisplay(5500)).toContain('K+');
    });
  });

  describe('getTimeBasedPopularityLabel', () => {
    it('should return "Popular this week" for high recent activity', () => {
      const label = getTimeBasedPopularityLabel(15, 40);
      expect(label).toBe('Popular this week');
    });

    it('should return "Growing this week" for medium recent activity', () => {
      const label = getTimeBasedPopularityLabel(8, 20);
      expect(label).toBe('Growing this week');
    });

    it('should return empty string for low recent activity', () => {
      const label = getTimeBasedPopularityLabel(2, 5);
      expect(label).toBe('');
    });
  });

  describe('getAreaPopularityLabel', () => {
    it('should return "Top home nearby" for 1.5x area average', () => {
      const label = getAreaPopularityLabel(100, 50);
      expect(label).toBe('Top home nearby');
    });

    it('should return "Above average interest" for above area average', () => {
      const label = getAreaPopularityLabel(75, 50);
      expect(label).toBe('Above average interest');
    });

    it('should return empty string for below area average', () => {
      const label = getAreaPopularityLabel(40, 50);
      expect(label).toBe('');
    });
  });

  describe('calculatePopularityScore', () => {
    it('should calculate score between 0-100', () => {
      const metrics: PopularityMetrics = {
        ...baseMetrics,
        recentSaveCount: 20,
        recentViewCount: 50,
        saveCount: 100,
        inquiryCount: 5,
      };
      const score = calculatePopularityScore(metrics);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give higher score for high engagement', () => {
      const highMetrics: PopularityMetrics = {
        ...baseMetrics,
        recentSaveCount: 20,
        recentViewCount: 50,
        saveCount: 100,
        inquiryCount: 5,
      };
      const lowMetrics: PopularityMetrics = {
        ...baseMetrics,
        recentSaveCount: 2,
        recentViewCount: 5,
        saveCount: 10,
        inquiryCount: 0,
      };
      expect(calculatePopularityScore(highMetrics)).toBeGreaterThan(
        calculatePopularityScore(lowMetrics)
      );
    });

    it('should max out at 100', () => {
      const metrics: PopularityMetrics = {
        saveCount: 1000,
        viewCount: 5000,
        recentSaveCount: 100,
        recentViewCount: 500,
        inquiryCount: 50,
      };
      expect(calculatePopularityScore(metrics)).toBeLessThanOrEqual(100);
    });
  });

  describe('getVendorEngagementSummary', () => {
    it('should provide high engagement summary for high tier', () => {
      const metrics: PopularityMetrics = {
        ...baseMetrics,
        saveCount: 50,
        recentSaveCount: 20,
      };
      const summary = getVendorEngagementSummary(metrics);
      expect(summary.summary).toContain('strong buyer interest');
      expect(summary.insight).toContain('20 buyers saved');
    });

    it('should provide medium engagement summary for medium tier', () => {
      const metrics: PopularityMetrics = {
        ...baseMetrics,
        saveCount: 15,
        recentSaveCount: 10,
      };
      const summary = getVendorEngagementSummary(metrics);
      expect(summary.summary).toContain('moderate buyer interest');
    });

    it('should provide low engagement summary for low tier', () => {
      const metrics: PopularityMetrics = { ...baseMetrics };
      const summary = getVendorEngagementSummary(metrics);
      expect(summary.summary).toContain('listed and visible');
    });
  });

  describe('Privacy and Safety', () => {
    it('should never expose individual buyer identities', () => {
      const metrics: PopularityMetrics = {
        ...baseMetrics,
        saveCount: 100,
        recentSaveCount: 50,
      };
      const label = getPopularityLabel(metrics);
      const desc = getPopularityDescription(metrics);
      expect(label).not.toContain('buyer');
      expect(desc).not.toContain('name');
      expect(desc).not.toContain('email');
    });

    it('should aggregate data without exposing individuals', () => {
      const metrics: PopularityMetrics = {
        ...baseMetrics,
        saveCount: 25,
      };
      const display = getSaveCountDisplay(metrics.saveCount);
      expect(display).toBe('25 saves');
      // Should show aggregate count, not individual details
      expect(display).not.toContain('user');
      expect(display).not.toContain('buyer');
    });

    it('should round large numbers for privacy', () => {
      const display = getSaveCountDisplay(1234);
      expect(display).toContain('+');
      // Exact number is rounded/hidden
      expect(display).not.toBe('1234 saves');
    });
  });
});
