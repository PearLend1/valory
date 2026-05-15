import { describe, it, expect } from 'vitest';
import {
  calculateAccuracyScore,
  calculateMarketingScore,
  calculateEngagementScore,
  calculateExpertiseScore,
  calculateResponsivenessScore,
  calculateFairRankingScore,
  rankAgentsFairly,
  validateRankingFairness,
  generateRankingExplanation,
} from './fair-agent-ranking';

describe('Fair Agent Ranking System', () => {
  describe('Accuracy Scoring', () => {
    it('should give perfect score for estimates within 2% of valuation', () => {
      const score = calculateAccuracyScore(250000, 250000, 250000);
      expect(score).toBe(100);
    });

    it('should give high score for estimates within 5% of valuation', () => {
      const score = calculateAccuracyScore(262500, 250000, 250000); // 5% above
      expect(score).toBeGreaterThanOrEqual(90);
    });

    it('should penalize inflated estimates', () => {
      const realisticScore = calculateAccuracyScore(250000, 250000, 250000);
      const inflatedScore = calculateAccuracyScore(300000, 250000, 250000); // 20% above
      expect(inflatedScore).toBeLessThan(realisticScore);
    });

    it('should give moderate score for estimates within 12%', () => {
      const score = calculateAccuracyScore(280000, 250000, 250000); // 12% above
      expect(score).toBeGreaterThanOrEqual(70);
      expect(score).toBeLessThan(90);
    });

    it('should heavily penalize estimates 20%+ above market', () => {
      const score = calculateAccuracyScore(300000, 250000, 250000); // 20% above
      expect(score).toBeLessThanOrEqual(60);
    });
  });

  describe('Marketing Quality Scoring', () => {
    it('should reward complete profiles with good presentation', () => {
      const score = calculateMarketingScore({
        profileCompleteness: 100,
        bioQuality: 100,
        photoQuality: 100,
        specializations: ['Residential', 'Investment'],
        certifications: ['NAEA', 'ARLA'],
        yearsExperience: 15,
        hasModernMarketing: true,
        uniquePositioning: true,
      });
      expect(score).toBeGreaterThan(90);
    });

    it('should penalize incomplete profiles', () => {
      const completeScore = calculateMarketingScore({
        profileCompleteness: 100,
        bioQuality: 100,
        photoQuality: 100,
        specializations: ['Residential'],
        certifications: ['NAEA'],
        yearsExperience: 15,
        hasModernMarketing: true,
        uniquePositioning: true,
      });

      const incompleteScore = calculateMarketingScore({
        profileCompleteness: 30,
        bioQuality: 30,
        photoQuality: 30,
        specializations: [],
        certifications: [],
        yearsExperience: 15,
        hasModernMarketing: false,
        uniquePositioning: false,
      });

      expect(completeScore).toBeGreaterThan(incompleteScore);
    });

    it('should cap score at 100', () => {
      const score = calculateMarketingScore({
        profileCompleteness: 100,
        bioQuality: 100,
        photoQuality: 100,
        specializations: ['A', 'B', 'C', 'D', 'E'],
        certifications: ['A', 'B', 'C', 'D', 'E'],
        yearsExperience: 30,
        hasModernMarketing: true,
        uniquePositioning: true,
      });
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Engagement Quality Scoring', () => {
    it('should reward thoughtful, personalized responses', () => {
      const score = calculateEngagementScore({
        responseQuality: 95,
        relevance: 95,
        thoughtfulness: 95,
        personalization: 95,
        responseDepth: 'deep',
        isGenericResponse: false,
      });
      expect(score).toBeGreaterThan(90);
    });

    it('should heavily penalize generic responses', () => {
      const thoughtfulScore = calculateEngagementScore({
        responseQuality: 90,
        relevance: 90,
        thoughtfulness: 90,
        personalization: 90,
        responseDepth: 'deep',
        isGenericResponse: false,
      });

      const genericScore = calculateEngagementScore({
        responseQuality: 90,
        relevance: 90,
        thoughtfulness: 90,
        personalization: 90,
        responseDepth: 'shallow',
        isGenericResponse: true,
      });

      expect(genericScore).toBeLessThan(thoughtfulScore);
      expect(genericScore).toBeLessThanOrEqual(40);
    });

    it('should reward deep responses with bonus', () => {
      const deepScore = calculateEngagementScore({
        responseQuality: 80,
        relevance: 80,
        thoughtfulness: 80,
        personalization: 80,
        responseDepth: 'deep',
        isGenericResponse: false,
      });

      const shallowScore = calculateEngagementScore({
        responseQuality: 80,
        relevance: 80,
        thoughtfulness: 80,
        personalization: 80,
        responseDepth: 'shallow',
        isGenericResponse: false,
      });

      expect(deepScore).toBeGreaterThan(shallowScore);
    });

    it('should ensure fast generic responses do not outrank quality responses', () => {
      const qualityScore = calculateEngagementScore({
        responseQuality: 85,
        relevance: 85,
        thoughtfulness: 85,
        personalization: 85,
        responseDepth: 'deep',
        isGenericResponse: false,
      });

      const genericScore = calculateEngagementScore({
        responseQuality: 95,
        relevance: 95,
        thoughtfulness: 95,
        personalization: 95,
        responseDepth: 'shallow',
        isGenericResponse: true,
      });

      expect(qualityScore).toBeGreaterThan(genericScore);
    });
  });

  describe('Expertise Scoring', () => {
    it('should reward local market knowledge', () => {
      const localScore = calculateExpertiseScore({
        yearsExperience: 15,
        yearsActiveInArea: 10,
        propertiesSoldInArea: 50,
        specializations: ['Residential', 'Investment'],
        localReputationScore: 85,
        propertyTypeMatch: true,
      });

      const nonLocalScore = calculateExpertiseScore({
        yearsExperience: 15,
        yearsActiveInArea: 1,
        propertiesSoldInArea: 5,
        specializations: [],
        localReputationScore: 50,
        propertyTypeMatch: false,
      });

      expect(localScore).toBeGreaterThan(nonLocalScore);
    });

    it('should reward property type specialization', () => {
      const specializedScore = calculateExpertiseScore({
        yearsExperience: 10,
        yearsActiveInArea: 5,
        propertiesSoldInArea: 30,
        specializations: ['Residential', 'Investment'],
        localReputationScore: 75,
        propertyTypeMatch: true,
      });

      const generalScore = calculateExpertiseScore({
        yearsExperience: 10,
        yearsActiveInArea: 5,
        propertiesSoldInArea: 30,
        specializations: ['Residential', 'Investment'],
        localReputationScore: 75,
        propertyTypeMatch: false,
      });

      expect(specializedScore).toBeGreaterThan(generalScore);
    });
  });

  describe('Responsiveness Scoring', () => {
    it('should reward responses within 24 hours', () => {
      const score = calculateResponsivenessScore({
        avgResponseTimeHours: 12,
        responseConsistency: 85,
        responsesWithin24h: 45,
        responsesWithin48h: 50,
        totalResponses: 50,
      });
      expect(score).toBeGreaterThanOrEqual(90);
    });

    it('should not heavily penalize responses within 48 hours', () => {
      const score = calculateResponsivenessScore({
        avgResponseTimeHours: 36,
        responseConsistency: 80,
        responsesWithin24h: 30,
        responsesWithin48h: 48,
        totalResponses: 50,
      });
      expect(score).toBeGreaterThanOrEqual(75);
    });

    it('should cap responsiveness at 100', () => {
      const score = calculateResponsivenessScore({
        avgResponseTimeHours: 1,
        responseConsistency: 100,
        responsesWithin24h: 100,
        responsesWithin48h: 100,
        totalResponses: 100,
      });
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Fair Ranking Algorithm', () => {
    it('should weight factors correctly', () => {
      const factors = {
        accuracyScore: 100,
        marketingScore: 100,
        engagementScore: 100,
        expertiseScore: 100,
        responsivenessScore: 100,
      };

      const score = calculateFairRankingScore(factors);
      expect(score).toBe(100); // All perfect = 100
    });

    it('should apply correct weights (accuracy 25%, marketing 25%, engagement 20%, expertise 20%, responsiveness 10%)', () => {
      const factors = {
        accuracyScore: 100,
        marketingScore: 0,
        engagementScore: 0,
        expertiseScore: 0,
        responsivenessScore: 0,
      };

      const score = calculateFairRankingScore(factors);
      expect(score).toBe(25); // 100 * 0.25 = 25
    });

    it('should ensure responsiveness is not dominant', () => {
      const fastButLowQuality = {
        accuracyScore: 30,
        marketingScore: 30,
        engagementScore: 30,
        expertiseScore: 30,
        responsivenessScore: 100, // Very fast
      };

      const slowButHighQuality = {
        accuracyScore: 90,
        marketingScore: 90,
        engagementScore: 90,
        expertiseScore: 90,
        responsivenessScore: 30, // Slower
      };

      const fastScore = calculateFairRankingScore(fastButLowQuality);
      const slowScore = calculateFairRankingScore(slowButHighQuality);

      expect(slowScore).toBeGreaterThan(fastScore);
    });

    it('should rank quality over speed', () => {
      const qualityScore = calculateFairRankingScore({
        accuracyScore: 85,
        marketingScore: 85,
        engagementScore: 85,
        expertiseScore: 85,
        responsivenessScore: 50,
      });

      const speedScore = calculateFairRankingScore({
        accuracyScore: 50,
        marketingScore: 50,
        engagementScore: 50,
        expertiseScore: 50,
        responsivenessScore: 100,
      });

      expect(qualityScore).toBeGreaterThan(speedScore);
    });
  });

  describe('Agent Ranking', () => {
    it('should rank agents by total score', () => {
      const agents = [
        {
          id: 1,
          name: 'Agent A',
          factors: {
            accuracyScore: 90,
            marketingScore: 90,
            engagementScore: 90,
            expertiseScore: 90,
            responsivenessScore: 90,
          },
        },
        {
          id: 2,
          name: 'Agent B',
          factors: {
            accuracyScore: 70,
            marketingScore: 70,
            engagementScore: 70,
            expertiseScore: 70,
            responsivenessScore: 70,
          },
        },
      ];

      const ranked = rankAgentsFairly(agents);
      expect(ranked[0].agentId).toBe(1);
      expect(ranked[1].agentId).toBe(2);
      expect(ranked[0].rankPosition).toBe(1);
      expect(ranked[1].rankPosition).toBe(2);
    });

    it('should generate explanations for rankings', () => {
      const agents = [
        {
          id: 1,
          name: 'Agent A',
          factors: {
            accuracyScore: 95,
            marketingScore: 95,
            engagementScore: 95,
            expertiseScore: 95,
            responsivenessScore: 95,
          },
        },
      ];

      const ranked = rankAgentsFairly(agents);
      expect(ranked[0].explanation).toContain('Agent A');
      expect(ranked[0].explanation).toContain('strength');
    });
  });

  describe('Fairness Validation', () => {
    it('should validate that independents and corporates compete fairly', () => {
      const independents = [
        {
          agentId: 1,
          totalScore: 82,
          rankPosition: 1,
          factors: {
            accuracyScore: 85,
            marketingScore: 80,
            engagementScore: 85,
            expertiseScore: 85,
            responsivenessScore: 75,
          },
          explanation: '',
        },
        {
          agentId: 2,
          totalScore: 78,
          rankPosition: 2,
          factors: {
            accuracyScore: 80,
            marketingScore: 75,
            engagementScore: 80,
            expertiseScore: 80,
            responsivenessScore: 70,
          },
          explanation: '',
        },
      ];

      const corporates = [
        {
          agentId: 3,
          totalScore: 80,
          rankPosition: 1,
          factors: {
            accuracyScore: 80,
            marketingScore: 85,
            engagementScore: 75,
            expertiseScore: 80,
            responsivenessScore: 95,
          },
          explanation: '',
        },
        {
          agentId: 4,
          totalScore: 76,
          rankPosition: 2,
          factors: {
            accuracyScore: 75,
            marketingScore: 80,
            engagementScore: 70,
            expertiseScore: 75,
            responsivenessScore: 90,
          },
          explanation: '',
        },
      ];

      const fairness = validateRankingFairness(independents, corporates);
      expect(fairness.isFair).toBe(true); // Scores within 10 points
    });

    it('should detect when speed is unfairly dominant', () => {
      const independents = [
        {
          agentId: 1,
          totalScore: 50,
          rankPosition: 1,
          factors: {
            accuracyScore: 50,
            marketingScore: 50,
            engagementScore: 50,
            expertiseScore: 50,
            responsivenessScore: 50,
          },
          explanation: '',
        },
      ];

      const corporates = [
        {
          agentId: 2,
          totalScore: 65,
          rankPosition: 1,
          factors: {
            accuracyScore: 40,
            marketingScore: 40,
            engagementScore: 40,
            expertiseScore: 40,
            responsivenessScore: 100, // Very fast
          },
          explanation: '',
        },
      ];

      const fairness = validateRankingFairness(independents, corporates);
      expect(fairness.speedNotDominant).toBe(false); // Speed is dominant
    });
  });

  describe('Ranking Explanation Generation', () => {
    it('should identify strengths in high-scoring factors', () => {
      const factors = {
        accuracyScore: 90,
        marketingScore: 90,
        engagementScore: 90,
        expertiseScore: 90,
        responsivenessScore: 50,
      };

      const explanation = generateRankingExplanation(factors, 'Test Agent');
      expect(explanation).toContain('Realistic pricing');
      expect(explanation).toContain('Strong professional profile');
      expect(explanation).toContain('Thoughtful');
      expect(explanation).toContain('Deep local');
    });

    it('should identify areas for improvement in low-scoring factors', () => {
      const factors = {
        accuracyScore: 40,
        marketingScore: 40,
        engagementScore: 40,
        expertiseScore: 40,
        responsivenessScore: 40,
      };

      const explanation = generateRankingExplanation(factors, 'Test Agent');
      expect(explanation).toContain('inflated');
      expect(explanation).toContain('Profile could be more complete');
      expect(explanation).toContain('personalized');
      expect(explanation).toContain('Limited local');
      expect(explanation).toContain('faster');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single agent ranking', () => {
      const agents = [
        {
          id: 1,
          name: 'Solo Agent',
          factors: {
            accuracyScore: 75,
            marketingScore: 75,
            engagementScore: 75,
            expertiseScore: 75,
            responsivenessScore: 75,
          },
        },
      ];

      const ranked = rankAgentsFairly(agents);
      expect(ranked.length).toBe(1);
      expect(ranked[0].rankPosition).toBe(1);
    });

    it('should handle ties in ranking', () => {
      const agents = [
        {
          id: 1,
          name: 'Agent A',
          factors: {
            accuracyScore: 80,
            marketingScore: 80,
            engagementScore: 80,
            expertiseScore: 80,
            responsivenessScore: 80,
          },
        },
        {
          id: 2,
          name: 'Agent B',
          factors: {
            accuracyScore: 80,
            marketingScore: 80,
            engagementScore: 80,
            expertiseScore: 80,
            responsivenessScore: 80,
          },
        },
      ];

      const ranked = rankAgentsFairly(agents);
      expect(ranked[0].totalScore).toBe(ranked[1].totalScore);
      expect(ranked[0].rankPosition).toBe(1);
      expect(ranked[1].rankPosition).toBe(2);
    });
  });
});
