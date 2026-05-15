import { describe, it, expect } from 'vitest';
import {
  calculateDataQualityScores,
  selectWeightingStrategy,
  applyQualityAdjustments,
  calculateWeightedValuation,
  calculateConfidenceScore,
  identifyMissingDataSources,
  calculatePotentialConfidenceScore,
  CONSERVATIVE_WEIGHTING,
  BALANCED_WEIGHTING,
} from './valuation-weighting';

describe('Valuation Weighting System', () => {
  describe('calculateDataQualityScores', () => {
    it('should calculate quality scores for all data layers', () => {
      const scores = calculateDataQualityScores(25, 15, 3, 50);
      expect(scores.publicData).toBe(50);
      expect(scores.apiData).toBe(50);
      expect(scores.agentIntelligence).toBe(60);
      expect(scores.platformNative).toBe(50);
    });

    it('should cap scores at 100', () => {
      const scores = calculateDataQualityScores(100, 100, 100, 200);
      expect(scores.publicData).toBe(100);
      expect(scores.apiData).toBe(100);
      expect(scores.agentIntelligence).toBe(100);
      expect(scores.platformNative).toBe(100);
    });

    it('should return 0 for no data', () => {
      const scores = calculateDataQualityScores(0, 0, 0, 0);
      expect(scores.publicData).toBe(0);
      expect(scores.apiData).toBe(0);
      expect(scores.agentIntelligence).toBe(0);
      expect(scores.platformNative).toBe(0);
    });
  });

  describe('selectWeightingStrategy', () => {
    it('should use conservative weighting when data quality is mixed', () => {
      const qualityScores = {
        publicData: 60,
        apiData: 50,
        agentIntelligence: 40,
        platformNative: 30,
      };
      const strategy = selectWeightingStrategy(qualityScores);
      expect(strategy).toEqual(CONSERVATIVE_WEIGHTING);
    });

    it('should use balanced weighting when all data quality is high', () => {
      const qualityScores = {
        publicData: 80,
        apiData: 80,
        agentIntelligence: 80,
        platformNative: 80,
      };
      const strategy = selectWeightingStrategy(qualityScores);
      expect(strategy).toEqual(BALANCED_WEIGHTING);
    });

    it('should use conservative weighting when one source is low quality', () => {
      const qualityScores = {
        publicData: 80,
        apiData: 80,
        agentIntelligence: 80,
        platformNative: 30, // Below 70%
      };
      const strategy = selectWeightingStrategy(qualityScores);
      expect(strategy).toEqual(CONSERVATIVE_WEIGHTING);
    });
  });

  describe('applyQualityAdjustments', () => {
    it('should reduce weight of low-quality data sources', () => {
      const qualityScores = {
        publicData: 30, // Low quality
        apiData: 80,
        agentIntelligence: 80,
        platformNative: 80,
      };
      const adjusted = applyQualityAdjustments(CONSERVATIVE_WEIGHTING, qualityScores);
      // Public data weight should be reduced
      expect(adjusted.publicData).toBeLessThan(CONSERVATIVE_WEIGHTING.publicData);
      // Weights should still sum to 1
      const sum = adjusted.publicData + adjusted.apiData + adjusted.agentIntelligence + adjusted.platformNative;
      expect(sum).toBeCloseTo(1, 5);
    });

    it('should maintain weight distribution when all quality is high', () => {
      const qualityScores = {
        publicData: 100,
        apiData: 100,
        agentIntelligence: 100,
        platformNative: 100,
      };
      const adjusted = applyQualityAdjustments(CONSERVATIVE_WEIGHTING, qualityScores);
      expect(adjusted).toEqual(CONSERVATIVE_WEIGHTING);
    });

    it('should renormalize weights to sum to 1', () => {
      const qualityScores = {
        publicData: 20,
        apiData: 20,
        agentIntelligence: 20,
        platformNative: 20,
      };
      const adjusted = applyQualityAdjustments(CONSERVATIVE_WEIGHTING, qualityScores);
      const sum = adjusted.publicData + adjusted.apiData + adjusted.agentIntelligence + adjusted.platformNative;
      expect(sum).toBeCloseTo(1, 5);
    });
  });

  describe('calculateWeightedValuation', () => {
    it('should calculate weighted average correctly', () => {
      const result = calculateWeightedValuation(
        300000, // publicValue
        310000, // apiValue
        320000, // agentValue
        330000, // platformValue
        CONSERVATIVE_WEIGHTING
      );
      // Expected: 300000*0.45 + 310000*0.35 + 320000*0.15 + 330000*0.05
      // = 135000 + 108500 + 48000 + 16500 = 308000
      expect(result).toBeCloseTo(308000, 0);
    });

    it('should give more weight to public data in conservative mode', () => {
      const conservativeResult = calculateWeightedValuation(
        300000,
        300000,
        300000,
        300000,
        CONSERVATIVE_WEIGHTING
      );
      const balancedResult = calculateWeightedValuation(
        300000,
        300000,
        300000,
        300000,
        BALANCED_WEIGHTING
      );
      // Both should equal 300000 since all inputs are equal
      expect(conservativeResult).toBeCloseTo(300000, 0);
      expect(balancedResult).toBeCloseTo(300000, 0);
    });

    it('should handle different valuations with proper weighting', () => {
      const result = calculateWeightedValuation(
        250000, // public (lower)
        350000, // api (higher)
        300000, // agent
        300000, // platform
        CONSERVATIVE_WEIGHTING
      );
      // Public data dominates, so result should be closer to 250000
      expect(result).toBeLessThan(300000);
      expect(result).toBeGreaterThan(250000);
    });
  });

  describe('calculateConfidenceScore', () => {
    it('should calculate confidence score based on data quality', () => {
      const qualityScores = {
        publicData: 80,
        apiData: 80,
        agentIntelligence: 0,
        platformNative: 0,
      };
      const confidence = calculateConfidenceScore(qualityScores, false, false);
      expect(confidence).toBeGreaterThan(50);
      expect(confidence).toBeLessThanOrEqual(100);
    });

    it('should increase confidence with agent intelligence', () => {
      const qualityScores = {
        publicData: 80,
        apiData: 80,
        agentIntelligence: 80,
        platformNative: 0,
      };
      const confidenceWithAgent = calculateConfidenceScore(qualityScores, true, false);
      const confidenceWithoutAgent = calculateConfidenceScore(
        { ...qualityScores, agentIntelligence: 0 },
        false,
        false
      );
      expect(confidenceWithAgent).toBeGreaterThan(confidenceWithoutAgent);
    });

    it('should increase confidence with engagement data', () => {
      const qualityScores = {
        publicData: 80,
        apiData: 80,
        agentIntelligence: 0,
        platformNative: 80,
      };
      const confidenceWithEngagement = calculateConfidenceScore(qualityScores, false, true);
      const confidenceWithoutEngagement = calculateConfidenceScore(
        { ...qualityScores, platformNative: 0 },
        false,
        false
      );
      expect(confidenceWithEngagement).toBeGreaterThan(confidenceWithoutEngagement);
    });

    it('should cap confidence at 100', () => {
      const qualityScores = {
        publicData: 100,
        apiData: 100,
        agentIntelligence: 100,
        platformNative: 100,
      };
      const confidence = calculateConfidenceScore(qualityScores, true, true);
      expect(confidence).toBeLessThanOrEqual(100);
    });

    it('should return low confidence with minimal data', () => {
      const qualityScores = {
        publicData: 10,
        apiData: 10,
        agentIntelligence: 0,
        platformNative: 0,
      };
      const confidence = calculateConfidenceScore(qualityScores, false, false);
      expect(confidence).toBeLessThan(30);
    });
  });

  describe('identifyMissingDataSources', () => {
    it('should identify missing public data', () => {
      const qualityScores = {
        publicData: 30,
        apiData: 80,
        agentIntelligence: 80,
        platformNative: 80,
      };
      const missing = identifyMissingDataSources(qualityScores, true, true);
      expect(missing).toContain('More comparable sales data');
    });

    it('should identify missing agent intelligence', () => {
      const qualityScores = {
        publicData: 80,
        apiData: 80,
        agentIntelligence: 0,
        platformNative: 80,
      };
      const missing = identifyMissingDataSources(qualityScores, false, true);
      expect(missing).toContain('Agent pricing insights');
    });

    it('should identify missing engagement data', () => {
      const qualityScores = {
        publicData: 80,
        apiData: 80,
        agentIntelligence: 80,
        platformNative: 0,
      };
      const missing = identifyMissingDataSources(qualityScores, true, false);
      expect(missing).toContain('Property engagement data');
    });

    it('should return empty array when all data is high quality', () => {
      const qualityScores = {
        publicData: 80,
        apiData: 80,
        agentIntelligence: 80,
        platformNative: 80,
      };
      const missing = identifyMissingDataSources(qualityScores, true, true);
      expect(missing).toHaveLength(0);
    });
  });

  describe('calculatePotentialConfidenceScore', () => {
    it('should increase score based on missing data sources', () => {
      const currentScore = 60;
      const missingDataSources = ['Agent pricing insights', 'Property engagement data'];
      const potential = calculatePotentialConfidenceScore(currentScore, missingDataSources);
      expect(potential).toBeGreaterThan(currentScore);
      expect(potential).toBeLessThanOrEqual(100);
    });

    it('should cap potential score at 100', () => {
      const currentScore = 95;
      const missingDataSources = ['Agent pricing insights', 'Property engagement data', 'More comparable sales data'];
      const potential = calculatePotentialConfidenceScore(currentScore, missingDataSources);
      expect(potential).toBeLessThanOrEqual(100);
    });

    it('should return same score when no missing data', () => {
      const currentScore = 85;
      const missingDataSources: string[] = [];
      const potential = calculatePotentialConfidenceScore(currentScore, missingDataSources);
      expect(potential).toBe(currentScore);
    });

    it('should add ~7% per missing data source', () => {
      const currentScore = 60;
      const missingDataSources = ['Source 1', 'Source 2'];
      const potential = calculatePotentialConfidenceScore(currentScore, missingDataSources);
      expect(potential).toBeCloseTo(currentScore + 14, 0);
    });
  });

  describe('Conservative Weighting Constraints', () => {
    it('should ensure public data is at least 40%', () => {
      expect(CONSERVATIVE_WEIGHTING.publicData).toBeGreaterThanOrEqual(0.4);
    });

    it('should ensure agent intelligence is at most 20%', () => {
      expect(CONSERVATIVE_WEIGHTING.agentIntelligence).toBeLessThanOrEqual(0.2);
    });

    it('should ensure platform-native data is at most 10%', () => {
      expect(CONSERVATIVE_WEIGHTING.platformNative).toBeLessThanOrEqual(0.1);
    });

    it('should sum to 1', () => {
      const sum =
        CONSERVATIVE_WEIGHTING.publicData +
        CONSERVATIVE_WEIGHTING.apiData +
        CONSERVATIVE_WEIGHTING.agentIntelligence +
        CONSERVATIVE_WEIGHTING.platformNative;
      expect(sum).toBeCloseTo(1, 5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero valuations', () => {
      const result = calculateWeightedValuation(0, 0, 0, 0, CONSERVATIVE_WEIGHTING);
      expect(result).toBe(0);
    });

    it('should handle very large valuations', () => {
      const result = calculateWeightedValuation(
        10000000,
        10000000,
        10000000,
        10000000,
        CONSERVATIVE_WEIGHTING
      );
      expect(result).toBeCloseTo(10000000, 0);
    });

    it('should handle negative adjustments from agent intelligence', () => {
      const result = calculateWeightedValuation(
        300000,
        300000,
        250000, // Lower agent valuation
        300000,
        CONSERVATIVE_WEIGHTING
      );
      expect(result).toBeLessThan(300000);
    });
  });
});
