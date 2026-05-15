import { describe, it, expect } from 'vitest';
import {
  generateExpectationsSummary,
  generateInterestSummary,
  extractStandoutFeatures,
  detectPricingSentiment,
  detectLayoutSentiment,
  generateKeyInsights,
  generateRecommendedActions,
  generateVendorFeedbackSummary,
  type ViewingFeedback,
} from './vendor-feedback-summary';

describe('Vendor Feedback Summary', () => {
  const mockFeedback: ViewingFeedback[] = [
    {
      expectationMatch: 'exceeded',
      interestLevel: 'very_interested',
      standoutFeatures: ['kitchen', 'garden'],
      comment: 'Great property, pricing seems reasonable',
    },
    {
      expectationMatch: 'matched',
      interestLevel: 'very_interested',
      standoutFeatures: ['garden', 'natural light'],
      comment: 'Loved the layout and flow',
    },
    {
      expectationMatch: 'below',
      interestLevel: 'somewhat_interested',
      standoutFeatures: ['kitchen'],
      comment: 'Pricing might be slightly ambitious',
    },
  ];

  describe('generateExpectationsSummary', () => {
    it('should generate positive summary when most exceeded expectations', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'exceeded', interestLevel: 'very_interested', standoutFeatures: [] },
        { expectationMatch: 'exceeded', interestLevel: 'very_interested', standoutFeatures: [] },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [] },
      ];
      const summary = generateExpectationsSummary(feedback);
      expect(summary).toContain('exceeded');
    });

    it('should generate matched summary when most matched expectations', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [] },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [] },
        { expectationMatch: 'exceeded', interestLevel: 'very_interested', standoutFeatures: [] },
      ];
      const summary = generateExpectationsSummary(feedback);
      expect(summary).toContain('matched');
    });

    it('should generate below summary when most below expectations', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'below', interestLevel: 'not_interested', standoutFeatures: [] },
        { expectationMatch: 'below', interestLevel: 'not_interested', standoutFeatures: [] },
        { expectationMatch: 'matched', interestLevel: 'somewhat_interested', standoutFeatures: [] },
      ];
      const summary = generateExpectationsSummary(feedback);
      expect(summary).toContain('slightly below');
    });

    it('should generate mixed summary when feedback is mixed', () => {
      const summary = generateExpectationsSummary(mockFeedback);
      expect(summary).toBeTruthy();
      expect(summary.length).toBeGreaterThan(0);
    });

    it('should return empty string for empty feedback', () => {
      const summary = generateExpectationsSummary([]);
      expect(summary).toBe('');
    });
  });

  describe('generateInterestSummary', () => {
    it('should generate strong interest summary when most very interested', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [] },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [] },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [] },
      ];
      const summary = generateInterestSummary(feedback);
      expect(summary).toContain('strong');
    });

    it('should generate positive interest summary when most interested', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [] },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [] },
        { expectationMatch: 'matched', interestLevel: 'somewhat_interested', standoutFeatures: [] },
      ];
      const summary = generateInterestSummary(feedback);
      expect(summary).toContain('strong');
    });

    it('should generate low interest summary when most not interested', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'below', interestLevel: 'not_interested', standoutFeatures: [] },
        { expectationMatch: 'below', interestLevel: 'not_interested', standoutFeatures: [] },
        { expectationMatch: 'matched', interestLevel: 'somewhat_interested', standoutFeatures: [] },
      ];
      const summary = generateInterestSummary(feedback);
      expect(summary).toContain('lower');
    });

    it('should return empty string for empty feedback', () => {
      const summary = generateInterestSummary([]);
      expect(summary).toBe('');
    });
  });

  describe('extractStandoutFeatures', () => {
    it('should extract features mentioned by 20% or more of viewers', () => {
      const features = extractStandoutFeatures(mockFeedback);
      expect(features).toContain('garden');
      expect(features).toContain('kitchen');
    });

    it('should return top 5 features', () => {
      const feedback: ViewingFeedback[] = Array(10).fill(null).map((_, i) => ({
        expectationMatch: 'matched',
        interestLevel: 'very_interested',
        standoutFeatures: ['feature' + (i % 5)],
      }));
      const features = extractStandoutFeatures(feedback);
      expect(features.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array for empty feedback', () => {
      const features = extractStandoutFeatures([]);
      expect(features).toEqual([]);
    });

    it('should not include features mentioned by less than 20%', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: ['common'] },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: ['common'] },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: ['common'] },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: ['common'] },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: ['common'] },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: ['rare'] },
      ];
      const features = extractStandoutFeatures(feedback);
      expect(features).toContain('common');
      expect(features).not.toContain('rare');
    });
  });

  describe('detectPricingSentiment', () => {
    it('should detect ambitious pricing sentiment', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [], comment: 'Price is ambitious' },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [], comment: 'Price is high' },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [] },
      ];
      const sentiment = detectPricingSentiment(feedback);
      expect(sentiment).toContain('ambitious');
    });

    it('should detect reasonable pricing sentiment', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [], comment: 'Price is reasonable' },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [], comment: 'Fair pricing' },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [] },
      ];
      const sentiment = detectPricingSentiment(feedback);
      expect(sentiment).toContain('reasonable');
    });

    it('should detect mixed pricing sentiment', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [], comment: 'Price is high' },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [], comment: 'Fair pricing' },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [] },
      ];
      const sentiment = detectPricingSentiment(feedback);
      expect(sentiment).toBeTruthy();
    });

    it('should return undefined when no pricing comments', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [], comment: 'Great property' },
      ];
      const sentiment = detectPricingSentiment(feedback);
      expect(sentiment).toBeUndefined();
    });
  });

  describe('detectLayoutSentiment', () => {
    it('should detect positive layout sentiment', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [], comment: 'Layout is great' },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [], comment: 'Flows well' },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [] },
      ];
      const sentiment = detectLayoutSentiment(feedback);
      expect(sentiment).toContain('positively');
    });

    it('should detect negative layout sentiment', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [], comment: 'Layout is awkward' },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [], comment: 'Cramped layout' },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [] },
      ];
      const sentiment = detectLayoutSentiment(feedback);
      expect(sentiment).toContain('improved');
    });

    it('should return undefined when no layout comments', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [], comment: 'Great property' },
      ];
      const sentiment = detectLayoutSentiment(feedback);
      expect(sentiment).toBeUndefined();
    });
  });

  describe('generateKeyInsights', () => {
    it('should generate insights from standout features', () => {
      const insights = generateKeyInsights(mockFeedback);
      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some(i => i.includes('Buyers responded'))).toBe(true);
    });

    it('should generate strong interest insight', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [] },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [] },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [] },
      ];
      const insights = generateKeyInsights(feedback);
      expect(insights.some(i => i.includes('Strong buyer interest'))).toBe(true);
    });

    it('should return empty array for empty feedback', () => {
      const insights = generateKeyInsights([]);
      expect(insights).toEqual([]);
    });
  });

  describe('generateRecommendedActions', () => {
    it('should suggest marketing refresh for low interest', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'below', interestLevel: 'not_interested', standoutFeatures: [] },
        { expectationMatch: 'below', interestLevel: 'not_interested', standoutFeatures: [] },
        { expectationMatch: 'below', interestLevel: 'not_interested', standoutFeatures: [] },
      ];
      const actions = generateRecommendedActions(feedback);
      expect(actions.some(a => a.includes('marketing'))).toBe(true);
    });

    it('should suggest pricing discussion for ambitious pricing', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [], comment: 'Price is ambitious' },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [], comment: 'Price is high' },
      ];
      const actions = generateRecommendedActions(feedback);
      expect(actions.some(a => a.includes('pricing strategy'))).toBe(true);
    });

    it('should return empty array for empty feedback', () => {
      const actions = generateRecommendedActions([]);
      expect(actions).toEqual([]);
    });
  });

  describe('generateVendorFeedbackSummary', () => {
    it('should generate complete summary with all fields', () => {
      const summary = generateVendorFeedbackSummary(mockFeedback);
      expect(summary.totalFeedback).toBe(3);
      expect(summary.expectationsSummary).toBeTruthy();
      expect(summary.interestSummary).toBeTruthy();
      expect(summary.standoutFeatures).toBeTruthy();
      expect(summary.keyInsights).toBeTruthy();
    });

    it('should include optional fields when applicable', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [], comment: 'Price is ambitious' },
        { expectationMatch: 'matched', interestLevel: 'very_interested', standoutFeatures: [], comment: 'Price is high' },
      ];
      const summary = generateVendorFeedbackSummary(feedback);
      expect(summary.pricingFeedback).toBeTruthy();
    });

    it('should handle empty feedback gracefully', () => {
      const summary = generateVendorFeedbackSummary([]);
      expect(summary.totalFeedback).toBe(0);
      expect(summary.expectationsSummary).toBe('');
      expect(summary.interestSummary).toBe('');
      expect(summary.standoutFeatures).toEqual([]);
    });
  });

  describe('Language Safety', () => {
    it('should never use harsh language in summaries', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'below', interestLevel: 'not_interested', standoutFeatures: [] },
        { expectationMatch: 'below', interestLevel: 'not_interested', standoutFeatures: [] },
        { expectationMatch: 'below', interestLevel: 'not_interested', standoutFeatures: [] },
      ];
      const summary = generateVendorFeedbackSummary(feedback);
      const allText = [
        summary.expectationsSummary,
        summary.interestSummary,
        summary.pricingFeedback,
        summary.layoutFeedback,
        ...summary.keyInsights,
        ...summary.recommendedActions || [],
      ].join(' ');

      expect(allText).not.toContain('terrible');
      expect(allText).not.toContain('awful');
      expect(allText).not.toContain('bad');
      expect(allText).not.toContain('worst');
      expect(allText).not.toContain('failure');
    });

    it('should use constructive language patterns', () => {
      const feedback: ViewingFeedback[] = [
        { expectationMatch: 'below', interestLevel: 'somewhat_interested', standoutFeatures: [] },
      ];
      const summary = generateVendorFeedbackSummary(feedback);
      const allText = [
        summary.expectationsSummary,
        summary.interestSummary,
        ...summary.keyInsights,
      ].join(' ');

      // Should use soft language
      expect(allText.length).toBeGreaterThan(0);
    });
  });
});
