/**
 * Comparable Selection & Valuation Tests
 * Tests for production-ready comparable selection algorithm
 */

import { describe, it, expect } from 'vitest';
import {
  scoreComp,
  buildValuation,
  type Subject,
  type Comp,
} from './services/comparableSelection';
import {
  generateExplanation,
  generateShortExplanation,
  generateDetailedExplanation,
} from './services/valuationExplainer';

describe('Comparable Selection Algorithm', () => {
  describe('scoreComp', () => {
    it('should score identical property highest', () => {
      const subject: Subject = {
        lat: 51.5,
        lng: -0.1,
        typeBucket: 'house',
        beds: 3,
        areaSqm: 100,
      };

      const comp: Comp = {
        id: 1,
        price: 300000,
        date: new Date(),
        lat: 51.5,
        lng: -0.1,
        ppdType: 'D',
        beds: 3,
        areaSqm: 100,
      };

      const score = scoreComp(subject, comp, 1609);
      expect(score).toBeGreaterThan(0.8);
    });

    it('should score distant property lower', () => {
      const subject: Subject = {
        lat: 51.5,
        lng: -0.1,
        typeBucket: 'house',
      };

      const comp: Comp = {
        id: 1,
        price: 300000,
        date: new Date(),
        lat: 51.6, // ~7 miles away
        lng: -0.1,
        ppdType: 'D',
      };

      const score = scoreComp(subject, comp, 1609);
      expect(score).toBeLessThan(0.5);
    });

    it('should score old property lower', () => {
      const subject: Subject = {
        lat: 51.5,
        lng: -0.1,
        typeBucket: 'house',
      };

      const comp: Comp = {
        id: 1,
        price: 300000,
        date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year old
        lat: 51.5,
        lng: -0.1,
        ppdType: 'D',
      };

      const score = scoreComp(subject, comp, 1609);
      expect(score).toBeLessThan(0.7);
    });

    it('should score type mismatch lower', () => {
      const subject: Subject = {
        lat: 51.5,
        lng: -0.1,
        typeBucket: 'flat',
      };

      const comp: Comp = {
        id: 1,
        price: 300000,
        date: new Date(),
        lat: 51.5,
        lng: -0.1,
        ppdType: 'D', // House, not flat
      };

      const score = scoreComp(subject, comp, 1609);
      expect(score).toBeLessThan(0.5);
    });

    it('should handle missing coordinates gracefully', () => {
      const subject: Subject = {
        typeBucket: 'house',
      };

      const comp: Comp = {
        id: 1,
        price: 300000,
        date: new Date(),
        ppdType: 'D',
      };

      const score = scoreComp(subject, comp, 1609);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });

  describe('buildValuation', () => {
    it('should return reasonable estimate from comps', () => {
      const subject: Subject = {
        lat: 51.5,
        lng: -0.1,
        typeBucket: 'house',
        beds: 3,
        areaSqm: 100,
      };

      const comps: Comp[] = [
        {
          id: 1,
          price: 300000,
          date: new Date(),
          lat: 51.5,
          lng: -0.1,
          ppdType: 'D',
          beds: 3,
          areaSqm: 100,
        },
        {
          id: 2,
          price: 310000,
          date: new Date(),
          lat: 51.5,
          lng: -0.1,
          ppdType: 'D',
          beds: 3,
          areaSqm: 102,
        },
        {
          id: 3,
          price: 290000,
          date: new Date(),
          lat: 51.5,
          lng: -0.1,
          ppdType: 'D',
          beds: 3,
          areaSqm: 98,
        },
      ];

      const valuation = buildValuation(subject, comps);

      expect(valuation.estimate).toBeGreaterThan(280000);
      expect(valuation.estimate).toBeLessThan(320000);
      expect(valuation.lowBand).toBeLessThan(valuation.estimate);
      expect(valuation.highBand).toBeGreaterThan(valuation.estimate);
      expect(valuation.compsUsed).toBe(3);
    });

    it('should have high confidence with many recent comps', () => {
      const subject: Subject = {
        lat: 51.5,
        lng: -0.1,
        typeBucket: 'house',
        beds: 3,
        areaSqm: 100,
      };

      const comps: Comp[] = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        price: 300000 + Math.random() * 20000,
        date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000), // Last 6 months
        lat: 51.5 + (Math.random() - 0.5) * 0.01,
        lng: -0.1 + (Math.random() - 0.5) * 0.01,
        ppdType: 'D',
        beds: 3,
        areaSqm: 100,
      }));

      const valuation = buildValuation(subject, comps);

      expect(valuation.confidence).toBe('High');
      expect(valuation.compsUsed).toBeGreaterThanOrEqual(10);
    });

    it('should have medium confidence with moderate comps', () => {
      const subject: Subject = {
        lat: 51.5,
        lng: -0.1,
        typeBucket: 'house',
        beds: 3,
      };

      const comps: Comp[] = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        price: 300000 + Math.random() * 30000,
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        lat: 51.5 + (Math.random() - 0.5) * 0.02,
        lng: -0.1 + (Math.random() - 0.5) * 0.02,
        ppdType: 'D',
        beds: 3,
      }));

      const valuation = buildValuation(subject, comps);

      expect(['Medium', 'Low']).toContain(valuation.confidence);
    });

    it('should filter outliers correctly', () => {
      const subject: Subject = {
        lat: 51.5,
        lng: -0.1,
        typeBucket: 'house',
      };

      const comps: Comp[] = [
        { id: 1, price: 300000, date: new Date(), lat: 51.5, lng: -0.1, ppdType: 'D' },
        { id: 2, price: 310000, date: new Date(), lat: 51.5, lng: -0.1, ppdType: 'D' },
        { id: 3, price: 305000, date: new Date(), lat: 51.5, lng: -0.1, ppdType: 'D' },
        { id: 4, price: 1000000, date: new Date(), lat: 51.5, lng: -0.1, ppdType: 'D' }, // Outlier
      ];

      const valuation = buildValuation(subject, comps);

      // Outlier should be filtered out
      expect(valuation.estimate).toBeGreaterThan(290000);
      expect(valuation.estimate).toBeLessThan(320000);
    });

    it('should use £/sqm when area available', () => {
      const subject: Subject = {
        lat: 51.5,
        lng: -0.1,
        typeBucket: 'house',
        areaSqm: 120,
      };

      const comps: Comp[] = [
        { id: 1, price: 300000, date: new Date(), lat: 51.5, lng: -0.1, ppdType: 'D', areaSqm: 100 },
        { id: 2, price: 360000, date: new Date(), lat: 51.5, lng: -0.1, ppdType: 'D', areaSqm: 120 },
      ];

      const valuation = buildValuation(subject, comps);

      expect(valuation.ppsqm).toBeDefined();
      expect(valuation.ppsqm).toBeGreaterThan(2000);
      expect(valuation.ppsqm).toBeLessThan(3500);
    });

    it('should generate signals', () => {
      const subject: Subject = {
        lat: 51.5,
        lng: -0.1,
        typeBucket: 'house',
        areaSqm: 100,
      };

      const comps: Comp[] = [
        { id: 1, price: 300000, date: new Date(), lat: 51.5, lng: -0.1, ppdType: 'D', areaSqm: 100 },
        { id: 2, price: 310000, date: new Date(), lat: 51.5, lng: -0.1, ppdType: 'D', areaSqm: 102 },
      ];

      const valuation = buildValuation(subject, comps);

      expect(valuation.signals.length).toBeGreaterThan(0);
      expect(valuation.signals[0]).toHaveProperty('name');
      expect(valuation.signals[0]).toHaveProperty('impact');
    });
  });

  describe('Valuation Explanations', () => {
    it('should generate vendor-friendly explanation', () => {
      const valuation = {
        estimate: 300000,
        lowBand: 285000,
        highBand: 315000,
        confidence: 'High' as const,
        compsUsed: 12,
        medianPrice: 305000,
        signals: [],
      };

      const explanation = generateExplanation(valuation, 'London');

      expect(explanation.headline).toContain('£285,000');
      expect(explanation.headline).toContain('£315,000');
      expect(explanation.headline).toContain('High');
      expect(explanation.howWeCalculated.length).toBeGreaterThan(0);
      expect(explanation.whatCouldMoveIt.length).toBeGreaterThan(0);
    });

    it('should generate short explanation', () => {
      const valuation = {
        estimate: 300000,
        lowBand: 285000,
        highBand: 315000,
        confidence: 'High' as const,
        compsUsed: 12,
        medianPrice: 305000,
        signals: [],
      };

      const short = generateShortExplanation(valuation);

      expect(short).toContain('£285,000');
      expect(short).toContain('£315,000');
      expect(short).toContain('High');
      expect(short).toContain('12');
    });

    it('should generate detailed explanation with signals', () => {
      const valuation = {
        estimate: 300000,
        lowBand: 285000,
        highBand: 315000,
        confidence: 'Medium' as const,
        compsUsed: 8,
        medianPrice: 305000,
        signals: [
          { name: 'Comparable Sales', value: '8 recent sales', impact: 'neutral' as const },
        ],
      };

      const detailed = generateDetailedExplanation(valuation, 'Manchester');

      expect(detailed).toContain('Comparable Sales');
      expect(detailed).toContain('8 recent sales');
    });

    it('should have appropriate confidence wording', () => {
      const high = generateExplanation(
        {
          estimate: 300000,
          lowBand: 285000,
          highBand: 315000,
          confidence: 'High',
          compsUsed: 15,
          medianPrice: 305000,
          signals: [],
        },
        'London'
      );

      const low = generateExplanation(
        {
          estimate: 300000,
          lowBand: 270000,
          highBand: 330000,
          confidence: 'Low',
          compsUsed: 3,
          medianPrice: 305000,
          signals: [],
        },
        'London'
      );

      expect(high.confidenceStatement).toContain('Strong evidence');
      expect(low.confidenceStatement).toContain('Limited evidence');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single comp', () => {
      const subject: Subject = {
        lat: 51.5,
        lng: -0.1,
        typeBucket: 'house',
      };

      const comps: Comp[] = [
        { id: 1, price: 300000, date: new Date(), lat: 51.5, lng: -0.1, ppdType: 'D' },
      ];

      const valuation = buildValuation(subject, comps);

      expect(valuation.estimate).toBe(300000);
      expect(valuation.confidence).toBe('Low');
    });

    it('should handle empty comps array', () => {
      const subject: Subject = {
        lat: 51.5,
        lng: -0.1,
        typeBucket: 'house',
      };

      const comps: Comp[] = [];

      const valuation = buildValuation(subject, comps);

      expect(valuation.estimate).toBe(0);
      expect(valuation.compsUsed).toBe(0);
    });

    it('should handle all identical prices', () => {
      const subject: Subject = {
        lat: 51.5,
        lng: -0.1,
        typeBucket: 'house',
      };

      const comps: Comp[] = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        price: 300000,
        date: new Date(),
        lat: 51.5,
        lng: -0.1,
        ppdType: 'D',
      }));

      const valuation = buildValuation(subject, comps);

      expect(valuation.estimate).toBe(300000);
      expect(valuation.lowBand).toBeLessThan(300000);
      expect(valuation.highBand).toBeGreaterThan(300000);
    });
  });
});
