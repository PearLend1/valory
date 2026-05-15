import { describe, it, expect } from 'vitest';
import {
  getActivityHeadline,
  getActivitySubheadline,
  getActivityInsight,
  getActivityActionSuggestion,
  getVendorActivityMessage,
  getComparisonContext,
  getTrendDescription,
  getMomentumExplanation,
  getViewingBookingMessage,
  getInquiryMessage,
  type VendorActivityMetrics,
} from './vendor-activity-messaging';

describe('Vendor Activity Messaging', () => {
  const baseMetrics: VendorActivityMetrics = {
    totalViews: 0,
    totalSaves: 0,
    viewingBookings: 0,
    momentum: 'stable',
    daysSinceLaunch: 7,
    viewsThisWeek: 0,
    savesThisWeek: 0,
    viewsTrendPercent: 0,
    savesTrendPercent: 0,
    averageViewsPerDay: 0,
    areaAverageViewsPerDay: 5,
    inquiryCount: 0,
    backOnMarketFlag: false,
  };

  describe('getActivityHeadline', () => {
    it('should show welcome back for back on market', () => {
      const metrics: VendorActivityMetrics = { ...baseMetrics, backOnMarketFlag: true };
      expect(getActivityHeadline(metrics)).toBe('Welcome back to the market');
    });

    it('should show strong interest for high momentum', () => {
      const metrics: VendorActivityMetrics = { ...baseMetrics, momentum: 'high' };
      expect(getActivityHeadline(metrics)).toContain('Strong');
    });

    it('should show growing interest for rising momentum', () => {
      const metrics: VendorActivityMetrics = { ...baseMetrics, momentum: 'rising' };
      expect(getActivityHeadline(metrics)).toContain('interest');
    });

    it('should show steady attention for stable momentum with views', () => {
      const metrics: VendorActivityMetrics = { ...baseMetrics, momentum: 'stable', viewsThisWeek: 15 };
      expect(getActivityHeadline(metrics)).toContain('steady');
    });

    it('should avoid harsh language for cooling momentum', () => {
      const metrics: VendorActivityMetrics = { ...baseMetrics, momentum: 'cooling', daysSinceLaunch: 30 };
      const headline = getActivityHeadline(metrics);
      expect(headline).not.toContain('bottom');
      expect(headline).not.toContain('failing');
      expect(headline).not.toContain('poor');
    });
  });

  describe('getActivitySubheadline', () => {
    it('should include views this week', () => {
      const metrics: VendorActivityMetrics = { ...baseMetrics, viewsThisWeek: 10 };
      expect(getActivitySubheadline(metrics)).toContain('10 views');
    });

    it('should include saves this week', () => {
      const metrics: VendorActivityMetrics = { ...baseMetrics, savesThisWeek: 5 };
      expect(getActivitySubheadline(metrics)).toContain('5 saves');
    });

    it('should include viewing bookings', () => {
      const metrics: VendorActivityMetrics = { ...baseMetrics, viewingBookings: 2 };
      expect(getActivitySubheadline(metrics)).toContain('2 viewing');
    });

    it('should combine multiple metrics', () => {
      const metrics: VendorActivityMetrics = {
        ...baseMetrics,
        viewsThisWeek: 10,
        savesThisWeek: 5,
        viewingBookings: 2,
      };
      const subheadline = getActivitySubheadline(metrics);
      expect(subheadline).toContain('10 views');
      expect(subheadline).toContain('5 saves');
      expect(subheadline).toContain('2 viewing');
    });
  });

  describe('getActivityInsight', () => {
    it('should encourage patience for very early listings', () => {
      const metrics: VendorActivityMetrics = { ...baseMetrics, daysSinceLaunch: 1 };
      expect(getActivityInsight(metrics)).toContain('typically builds');
    });

    it('should celebrate positive trends', () => {
      const metrics: VendorActivityMetrics = { ...baseMetrics, viewsTrendPercent: 75 };
      const insight = getActivityInsight(metrics);
      expect(insight).toContain('accelerating');
      expect(insight).not.toContain('poor');
    });

    it('should provide soft comparison to area average', () => {
      const metrics: VendorActivityMetrics = {
        ...baseMetrics,
        averageViewsPerDay: 3,
        areaAverageViewsPerDay: 5,
      };
      const insight = getActivityInsight(metrics);
      expect(insight).not.toContain('failing');
      expect(insight).not.toContain('bottom');
      expect(insight).toContain('quieter');
    });

    it('should avoid harsh language for below-average activity', () => {
      const metrics: VendorActivityMetrics = {
        ...baseMetrics,
        averageViewsPerDay: 1,
        areaAverageViewsPerDay: 5,
        momentum: 'cooling',
      };
      const insight = getActivityInsight(metrics);
      expect(insight).not.toContain('bad');
      expect(insight).not.toContain('failing');
      expect(insight).toContain('quieter');
    });
  });

  describe('getActivityActionSuggestion', () => {
    it('should suggest maintaining momentum for high tier', () => {
      const metrics: VendorActivityMetrics = { ...baseMetrics, momentum: 'high' };
      const suggestion = getActivityActionSuggestion(metrics);
      expect(suggestion).toContain('momentum');
    });

    it('should suggest scheduling viewings for rising momentum', () => {
      const metrics: VendorActivityMetrics = { ...baseMetrics, momentum: 'rising' };
      const suggestion = getActivityActionSuggestion(metrics);
      expect(suggestion).toContain('viewings');
    });

    it('should suggest refresh for cooling momentum', () => {
      const metrics: VendorActivityMetrics = {
        ...baseMetrics,
        momentum: 'cooling',
        daysSinceLaunch: 30,
      };
      const suggestion = getActivityActionSuggestion(metrics);
      expect(suggestion).toContain('refresh');
    });

    it('should encourage patience for early listings', () => {
      const metrics: VendorActivityMetrics = {
        ...baseMetrics,
        daysSinceLaunch: 2,
        viewsThisWeek: 2,
      };
      const suggestion = getActivityActionSuggestion(metrics);
      expect(suggestion).toContain('live');
    });
  });

  describe('getVendorActivityMessage', () => {
    it('should return complete message object', () => {
      const metrics: VendorActivityMetrics = { ...baseMetrics, momentum: 'high' };
      const message = getVendorActivityMessage(metrics);
      expect(message).toHaveProperty('headline');
      expect(message).toHaveProperty('subheadline');
      expect(message).toHaveProperty('insight');
      expect(message).toHaveProperty('tone');
    });

    it('should use positive tone for high momentum', () => {
      const metrics: VendorActivityMetrics = { ...baseMetrics, momentum: 'high' };
      const message = getVendorActivityMessage(metrics);
      expect(message.tone).toBe('positive');
    });

    it('should use encouraging tone for rising momentum', () => {
      const metrics: VendorActivityMetrics = { ...baseMetrics, momentum: 'rising' };
      const message = getVendorActivityMessage(metrics);
      expect(message.tone).toBe('encouraging');
    });

    it('should use supportive tone for cooling momentum', () => {
      const metrics: VendorActivityMetrics = { ...baseMetrics, momentum: 'cooling' };
      const message = getVendorActivityMessage(metrics);
      expect(message.tone).toBe('supportive');
    });
  });

  describe('getComparisonContext', () => {
    it('should celebrate above-average performance', () => {
      const context = getComparisonContext(150, 100, 'views');
      expect(context).toContain('above average');
    });

    it('should normalize in-line performance', () => {
      const context = getComparisonContext(90, 100, 'views');
      expect(context).toContain('in line');
    });

    it('should provide soft guidance for below-average', () => {
      const context = getComparisonContext(60, 100, 'views');
      expect(context).not.toContain('terrible');
    });

    it('should avoid harsh language for very low performance', () => {
      const context = getComparisonContext(30, 100, 'views');
      expect(context).not.toContain('terrible');
    });
  });

  describe('getTrendDescription', () => {
    it('should celebrate strong positive trends', () => {
      const desc = getTrendDescription(100, 'Views');
      expect(desc).not.toContain('terrible');
    });

    it('should acknowledge moderate positive trends', () => {
      const desc = getTrendDescription(50, 'Views');
      expect(desc).not.toContain('terrible');
    });

    it('should normalize small changes', () => {
      const desc = getTrendDescription(5, 'Views');
      expect(desc).not.toContain('terrible');
    });

    it('should normalize slight decreases', () => {
      const desc = getTrendDescription(-10, 'Views');
      expect(desc).not.toContain('terrible');
    });

    it('should normalize post-launch decreases', () => {
      const desc = getTrendDescription(-30, 'Views');
      expect(desc).toContain('normal');
      expect(desc).not.toContain('terrible');
    });

    it('should avoid harsh language for significant decreases', () => {
      const desc = getTrendDescription(-60, 'Views');
      expect(desc).not.toContain('terrible');
      expect(desc).not.toContain('worst');
    });
  });

  describe('getMomentumExplanation', () => {
    it('should explain high momentum', () => {
      const explanation = getMomentumExplanation('high');
      expect(explanation).toContain('strong');
      expect(explanation).toContain('recent');
    });

    it('should explain rising momentum', () => {
      const explanation = getMomentumExplanation('rising');
      expect(explanation).toContain('growing');
    });

    it('should explain stable momentum', () => {
      const explanation = getMomentumExplanation('stable');
      expect(explanation).toContain('consistent');
    });

    it('should normalize cooling momentum', () => {
      const explanation = getMomentumExplanation('cooling');
      expect(explanation).toContain('common');
      expect(explanation).not.toContain('failing');
    });
  });

  describe('getViewingBookingMessage', () => {
    it('should celebrate viewing bookings', () => {
      const message = getViewingBookingMessage(2, 20);
      expect(message).toContain('2');
      expect(message).toContain('booked');
    });

    it('should encourage action when no bookings but interest exists', () => {
      const message = getViewingBookingMessage(0, 20);
      expect(message).toContain('interest');
      expect(message).not.toContain('failing');
    });

    it('should return empty string when no bookings and low interest', () => {
      const message = getViewingBookingMessage(0, 2);
      expect(message).toBe('');
    });
  });

  describe('getInquiryMessage', () => {
    it('should celebrate inquiries', () => {
      const message = getInquiryMessage(3, 30);
      expect(message).toContain('3');
      expect(message).toContain('inquiries');
    });

    it('should handle singular inquiry', () => {
      const message = getInquiryMessage(1, 20);
      expect(message).toContain('1 inquiry');
    });

    it('should return empty string for no inquiries', () => {
      const message = getInquiryMessage(0, 20);
      expect(message).toBe('');
    });
  });

  describe('Tone and Language Safety', () => {
    it('should never use discouraging language', () => {
      const harshWords = ['bottom', 'failing', 'terrible', 'worst', 'bad', 'poor', 'shame'];
      const metrics: VendorActivityMetrics = {
        ...baseMetrics,
        momentum: 'cooling',
        daysSinceLaunch: 60,
        viewsThisWeek: 0,
      };

      const message = getVendorActivityMessage(metrics);
      const fullText = `${message.headline} ${message.subheadline} ${message.insight}`;

      harshWords.forEach((word) => {
        expect(fullText.toLowerCase()).not.toContain(word);
      });
    });

    it('should use supportive language consistently', () => {
      const supportiveWords = ['steady', 'building', 'growing', 'consistent', 'picking up'];
      const metrics: VendorActivityMetrics = {
        ...baseMetrics,
        momentum: 'rising',
        viewsThisWeek: 10,
      };

      const message = getVendorActivityMessage(metrics);
      const fullText = `${message.headline} ${message.subheadline} ${message.insight}`;

      const hasSupportiveLanguage = supportiveWords.some((word) =>
        fullText.toLowerCase().includes(word)
      );
      expect(hasSupportiveLanguage).toBe(true);
    });
  });
});
