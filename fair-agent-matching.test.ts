import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateMatchScore,
  matchAgentsForVendor,
  ensureFairRepresentation,
  generateMatchReasons,
  validateMatchingFairness,
  calculatePremiumAdvantage,
  canReachTopPlacementOnMerit,
  generateMatchingTransparencyReport,
  AgentForMatching,
} from './fair-agent-matching';
import {
  calculateFeedbackScore,
  calculateRealismScore,
  calculateMarketingScore,
  calculateConductScore,
  calculateLocalRelevanceScore,
  calculateTotalMeritScore,
  meetsQualityBaseline,
  AgentMeritScores,
} from './agent-merit-signals';

describe('Fair Agent Matching System', () => {
  let premiumAgent: AgentForMatching;
  let standardAgent: AgentForMatching;
  let strongStandardAgent: AgentForMatching;

  beforeEach(() => {
    const premiumMerit: AgentMeritScores = {
      feedbackScore: 15,
      realismScore: 14,
      marketingScore: 12,
      conductScore: 12,
      localRelevanceScore: 8,
      totalMeritScore: 61,
    };

    const standardMerit: AgentMeritScores = {
      feedbackScore: 12,
      realismScore: 11,
      marketingScore: 9,
      conductScore: 10,
      localRelevanceScore: 6,
      totalMeritScore: 48,
    };

    const strongStandardMerit: AgentMeritScores = {
      feedbackScore: 18,
      realismScore: 18,
      marketingScore: 14,
      conductScore: 14,
      localRelevanceScore: 9,
      totalMeritScore: 73,
    };

    premiumAgent = {
      id: 1,
      name: 'Premium Agent',
      tier: 'PREMIUM',
      postcode: 'SW1',
      meritScores: premiumMerit,
      hasEarlyInterest: false,
    };

    standardAgent = {
      id: 2,
      name: 'Standard Agent',
      tier: 'STANDARD',
      postcode: 'SW1',
      meritScores: standardMerit,
      hasEarlyInterest: false,
    };

    strongStandardAgent = {
      id: 3,
      name: 'Strong Standard Agent',
      tier: 'STANDARD',
      postcode: 'SW1',
      meritScores: strongStandardMerit,
      hasEarlyInterest: false,
    };
  });

  describe('Match Score Calculation', () => {
    it('should calculate match score for premium agent', () => {
      const result = calculateMatchScore(premiumAgent);
      expect(result.score).toBeGreaterThan(0);
      expect(result.tierBonus).toBeGreaterThan(0); // Premium gets boost
    });

    it('should calculate match score for standard agent', () => {
      const result = calculateMatchScore(standardAgent);
      expect(result.score).toBeGreaterThan(0);
      expect(result.tierBonus).toBe(0); // Standard gets no boost
    });

    it('should give premium agent higher score than standard with same merit', () => {
      const premiumScore = calculateMatchScore(premiumAgent).score;
      const standardScore = calculateMatchScore(standardAgent).score;
      expect(premiumScore).toBeGreaterThan(standardScore);
    });

    it('should allow strong standard agent to beat weak premium agent', () => {
      const weakPremium = {
        ...premiumAgent,
        meritScores: {
          feedbackScore: 8,
          realismScore: 8,
          marketingScore: 6,
          conductScore: 6,
          localRelevanceScore: 4,
          totalMeritScore: 32,
        },
      };

      const weakPremiumScore = calculateMatchScore(weakPremium).score;
      const strongStandardScore = calculateMatchScore(strongStandardAgent).score;

      expect(strongStandardScore).toBeGreaterThan(weakPremiumScore);
    });

    it('should apply early access bonus', () => {
      const agentWithInterest = { ...premiumAgent, hasEarlyInterest: true };
      const withoutInterest = { ...premiumAgent, hasEarlyInterest: false };

      const scoreWith = calculateMatchScore(agentWithInterest).score;
      const scoreWithout = calculateMatchScore(withoutInterest).score;

      expect(scoreWith).toBeGreaterThan(scoreWithout);
    });

    it('should return zero score for agents below quality threshold', () => {
      const poorAgent = {
        ...standardAgent,
        meritScores: {
          feedbackScore: 3,
          realismScore: 3,
          marketingScore: 2,
          conductScore: 2,
          localRelevanceScore: 1,
          totalMeritScore: 11,
        },
      };

      const result = calculateMatchScore(poorAgent);
      expect(result.score).toBe(0);
    });
  });

  describe('Fair Representation in Matching', () => {
    it('should not place all premium agents at top', () => {
      const agents = [
        premiumAgent,
        standardAgent,
        strongStandardAgent,
        { ...premiumAgent, id: 4, name: 'Premium 2' },
        { ...premiumAgent, id: 5, name: 'Premium 3' },
      ];

      const result = matchAgentsForVendor(agents, 'SW1', 5);

      const premiumCount = result.matchedAgents.filter((m) => {
        const agent = agents.find((a) => a.id === m.agentId);
        return agent?.tier === 'PREMIUM';
      }).length;

      const standardCount = result.matchedAgents.filter((m) => {
        const agent = agents.find((a) => a.id === m.agentId);
        return agent?.tier === 'STANDARD';
      }).length;

      // Should have mix, not all premium
      expect(premiumCount).toBeLessThan(result.matchedAgents.length);
      expect(standardCount).toBeGreaterThan(0);
    });

    it('should include strong standard agents in top results', () => {
      const agents = [
        premiumAgent,
        standardAgent,
        strongStandardAgent,
      ];

      const result = matchAgentsForVendor(agents, 'SW1', 3);
      const strongAgentMatched = result.matchedAgents.some((m) => m.agentId === 3);

      expect(strongAgentMatched).toBe(true);
    });

    it('should rank strong standard agent above weak premium agent', () => {
      const weakPremium = {
        ...premiumAgent,
        id: 4,
        meritScores: {
          feedbackScore: 8,
          realismScore: 8,
          marketingScore: 6,
          conductScore: 6,
          localRelevanceScore: 4,
          totalMeritScore: 32,
        },
      };

      const agents = [weakPremium, strongStandardAgent];
      const result = matchAgentsForVendor(agents, 'SW1', 2);

      expect(result.matchedAgents.length).toBe(2);

      const strongAgentMatch = result.matchedAgents.find((m) => m.agentId === 3);
      const weakPremiumMatch = result.matchedAgents.find((m) => m.agentId === 4);

      expect(strongAgentMatch).toBeDefined();
      expect(weakPremiumMatch).toBeDefined();
      expect(strongAgentMatch!.matchScore).toBeGreaterThan(weakPremiumMatch!.matchScore);
    });
  });

  describe('Fairness Validation', () => {
    it('should validate fair representation', () => {
      const agents = [
        premiumAgent,
        standardAgent,
        strongStandardAgent,
      ];

      const result = matchAgentsForVendor(agents, 'SW1', 3);
      const fairness = validateMatchingFairness(result.matchedAgents, agents);

      expect(fairness.fair).toBe(true);
      expect(fairness.stats.standardCount).toBeGreaterThan(0);
    });

    it('should detect all-premium matching as unfair', () => {
      const allPremium = [
        premiumAgent,
        { ...premiumAgent, id: 2 },
        { ...premiumAgent, id: 3 },
      ];

      const matchedAgents = allPremium.map((agent, index) => ({
        agentId: agent.id,
        name: agent.name,
        matchScore: 70,
        meritScore: 60,
        premiumBonus: 12,
        earlyAccessBonus: 0,
        matchReasons: [],
        hasEarlyInterest: false,
        rankPosition: index + 1,
      }));

      const fairness = validateMatchingFairness(matchedAgents, allPremium);

      expect(fairness.fair).toBe(false);
      expect(fairness.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Premium Advantage Calculation', () => {
    it('should calculate premium advantage correctly', () => {
      const advantage = calculatePremiumAdvantage(60);

      expect(advantage.premiumScore).toBeGreaterThan(advantage.standardScore);
      expect(advantage.advantagePercentage).toBeCloseTo(20, 1); // 20% boost
    });

    it('should show advantage is significant but not dominant', () => {
      const advantage = calculatePremiumAdvantage(50);

      // Premium gets 20% boost
      expect(advantage.advantagePercentage).toBe(20);

      // But strong standard agents can still compete
      const strongStandardScore = 70; // Strong agent
      const weakPremiumScore = advantage.premiumScore; // Weak premium with boost

      expect(strongStandardScore).toBeGreaterThan(weakPremiumScore);
    });
  });

  describe('Merit-Based Placement', () => {
    it('should allow strong agents to reach top placement on merit alone', () => {
      const allMeritScores = [73, 61, 48, 40, 35]; // Strong standard, premium, standard, others
      const canReach = canReachTopPlacementOnMerit(73, allMeritScores, 3);

      expect(canReach).toBe(true);
    });

    it('should prevent weak agents from top placement', () => {
      const allMeritScores = [73, 61, 48, 40, 35];
      const canReach = canReachTopPlacementOnMerit(35, allMeritScores, 3);

      expect(canReach).toBe(false);
    });
  });

  describe('Match Reasons Generation', () => {
    it('should generate reasons without mentioning tier', () => {
      const reasons = generateMatchReasons(premiumAgent, 61);

      for (const reason of reasons) {
        expect(reason).not.toContain('premium');
        expect(reason).not.toContain('Premium');
        expect(reason).not.toContain('standard');
        expect(reason).not.toContain('Standard');
        expect(reason).not.toContain('tier');
        expect(reason).not.toContain('subscription');
      }
    });

    it('should include early interest reason when applicable', () => {
      const agentWithInterest = { ...premiumAgent, hasEarlyInterest: true };
      const reasons = generateMatchReasons(agentWithInterest, 61);

      expect(reasons).toContain('Early interest shown');
    });

    it('should include merit-based reasons', () => {
      const reasons = generateMatchReasons(strongStandardAgent, 73);

      // Should have some quality reasons
      expect(reasons.length).toBeGreaterThan(0);
      expect(reasons.some((r) => r.includes('local') || r.includes('feedback') || r.includes('pricing'))).toBe(true);
    });
  });

  describe('Quality Baseline Enforcement', () => {
    it('should enforce minimum merit threshold for premium agents', () => {
      const poorPremium = {
        ...premiumAgent,
        meritScores: {
          feedbackScore: 5,
          realismScore: 5,
          marketingScore: 4,
          conductScore: 4,
          localRelevanceScore: 3,
          totalMeritScore: 21,
        },
      };

      const meetsThreshold = meetsQualityBaseline(21, 'PREMIUM');
      expect(meetsThreshold).toBe(false);
    });

    it('should enforce minimum merit threshold for standard agents', () => {
      const poorStandard = {
        ...standardAgent,
        meritScores: {
          feedbackScore: 4,
          realismScore: 4,
          marketingScore: 3,
          conductScore: 3,
          localRelevanceScore: 2,
          totalMeritScore: 16,
        },
      };

      const meetsThreshold = meetsQualityBaseline(16, 'STANDARD');
      expect(meetsThreshold).toBe(false);
    });

    it('should allow quality agents above threshold', () => {
      expect(meetsQualityBaseline(61, 'PREMIUM')).toBe(true);
      expect(meetsQualityBaseline(48, 'STANDARD')).toBe(true);
    });
  });

  describe('Matching Transparency', () => {
    it('should generate transparency report', () => {
      const agents = [premiumAgent, standardAgent, strongStandardAgent];
      const result = matchAgentsForVendor(agents, 'SW1', 3);
      const report = generateMatchingTransparencyReport(result, agents);

      expect(report.summary).toContain('Matched');
      expect(report.methodology).toContain('merit');
      expect(report.fairnessAnalysis).toContain('quality threshold');
    });
  });

  describe('Edge Cases', () => {
    it('should handle no agents in postcode', () => {
      const agents = [
        { ...premiumAgent, postcode: 'E1' },
        { ...standardAgent, postcode: 'E1' },
      ];

      const result = matchAgentsForVendor(agents, 'SW1', 5);
      expect(result.matchedAgents.length).toBe(0);
    });

    it('should handle all agents below quality threshold', () => {
      const poorAgents = [
        {
          ...premiumAgent,
          meritScores: {
            feedbackScore: 5,
            realismScore: 5,
            marketingScore: 4,
            conductScore: 4,
            localRelevanceScore: 3,
            totalMeritScore: 21,
          },
        },
        {
          ...standardAgent,
          meritScores: {
            feedbackScore: 4,
            realismScore: 4,
            marketingScore: 3,
            conductScore: 3,
            localRelevanceScore: 2,
            totalMeritScore: 16,
          },
        },
      ];

      const result = matchAgentsForVendor(poorAgents, 'SW1', 5);
      expect(result.matchedAgents.length).toBe(0);
    });

    it('should handle single agent', () => {
      const result = matchAgentsForVendor([premiumAgent], 'SW1', 5);
      expect(result.matchedAgents.length).toBe(1);
    });
  });
});
