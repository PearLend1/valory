/**
 * Fair Agent Matching Engine
 * Combines premium tier advantage with merit-based visibility
 * Ensures quality agents can compete regardless of subscription tier
 */

import { AgentMeritScores, meetsQualityBaseline, generateMeritReasons } from './agent-merit-signals';

export interface AgentForMatching {
  id: number;
  name: string;
  tier: 'PREMIUM' | 'STANDARD';
  postcode?: string;
  meritScores: AgentMeritScores;
  hasEarlyInterest: boolean;
  responseTime?: number; // minutes
}

export interface MatchedAgent {
  agentId: number;
  name: string;
  matchScore: number;
  meritScore: number;
  premiumBonus: number;
  earlyAccessBonus: number;
  matchReasons: string[];
  hasEarlyInterest: boolean;
  rankPosition: number;
}

export interface MatchingResult {
  matchedAgents: MatchedAgent[];
  totalAgentsConsidered: number;
  matchingAlgorithmVersion: string;
  timestamp: Date;
}

// Matching constants
const PREMIUM_TIER_MULTIPLIER = 1.2; // Premium agents get 20% score boost
const STANDARD_TIER_MULTIPLIER = 1.0;
const EARLY_ACCESS_BONUS = 10; // Points for expressing early interest
const EARLY_ACCESS_MULTIPLIER = 1.1; // 10% additional boost for early interest
const MINIMUM_MERIT_THRESHOLD_PREMIUM = 30; // 33% of 90
const MINIMUM_MERIT_THRESHOLD_STANDARD = 25; // 28% of 90
const MAX_MATCHED_AGENTS = 5;
const ALGORITHM_VERSION = '1.0.0';

/**
 * Calculate match score for an agent
 * Combines merit score with tier advantage and early interest bonus
 */
export function calculateMatchScore(agent: AgentForMatching): {
  score: number;
  meritScore: number;
  tierBonus: number;
  earlyAccessBonus: number;
} {
  const meritScore = agent.meritScores.totalMeritScore;

  // Check minimum quality threshold
  if (!meetsQualityBaseline(meritScore, agent.tier)) {
    return {
      score: 0,
      meritScore,
      tierBonus: 0,
      earlyAccessBonus: 0,
    };
  }

  // Apply tier multiplier
  const tierMultiplier = agent.tier === 'PREMIUM' ? PREMIUM_TIER_MULTIPLIER : STANDARD_TIER_MULTIPLIER;
  const tierBoostedScore = meritScore * tierMultiplier;

  // Apply early access bonus
  let earlyAccessBonus = 0;
  let finalScore = tierBoostedScore;

  if (agent.hasEarlyInterest) {
    earlyAccessBonus = EARLY_ACCESS_BONUS;
    finalScore = tierBoostedScore * EARLY_ACCESS_MULTIPLIER + earlyAccessBonus;
  }

  return {
    score: finalScore,
    meritScore,
    tierBonus: tierBoostedScore - meritScore,
    earlyAccessBonus,
  };
}

/**
 * Match agents for a vendor property
 * Returns up to 5 best-fit agents with fair representation
 */
export function matchAgentsForVendor(
  agents: AgentForMatching[],
  vendorPostcode: string,
  maxResults: number = MAX_MATCHED_AGENTS
): MatchingResult {
  // Filter agents by postcode relevance
  const relevantAgents = agents.filter(
    (agent) => agent.postcode && vendorPostcode.startsWith(agent.postcode.substring(0, 2))
  );

  if (relevantAgents.length === 0) {
    return {
      matchedAgents: [],
      totalAgentsConsidered: agents.length,
      matchingAlgorithmVersion: ALGORITHM_VERSION,
      timestamp: new Date(),
    };
  }

  // Calculate match scores for all agents
  const agentsWithScores = relevantAgents.map((agent) => {
    const scoreData = calculateMatchScore(agent);
    return {
      agent,
      ...scoreData,
    };
  });

  // Filter out agents below quality threshold
  const qualifiedAgents = agentsWithScores.filter((a) => a.score > 0);

  if (qualifiedAgents.length === 0) {
    return {
      matchedAgents: [],
      totalAgentsConsidered: agents.length,
      matchingAlgorithmVersion: ALGORITHM_VERSION,
      timestamp: new Date(),
    };
  }

  // Sort by match score descending
  const sorted = qualifiedAgents.sort((a, b) => b.score - a.score);

  // Ensure fair representation: avoid all premium agents at top
  const matched = ensureFairRepresentation(sorted, maxResults);

  // Generate match reasons and build final results
  const matchedAgents: MatchedAgent[] = matched.map((item, index) => ({
    agentId: item.agent.id,
    name: item.agent.name,
    matchScore: Math.round(item.score * 100) / 100,
    meritScore: Math.round(item.meritScore * 100) / 100,
    premiumBonus: Math.round(item.tierBonus * 100) / 100,
    earlyAccessBonus: item.earlyAccessBonus,
    matchReasons: generateMatchReasons(item.agent, item.meritScore),
    hasEarlyInterest: item.agent.hasEarlyInterest,
    rankPosition: index + 1,
  }));

  return {
    matchedAgents,
    totalAgentsConsidered: agents.length,
    matchingAlgorithmVersion: ALGORITHM_VERSION,
    timestamp: new Date(),
  };
}

/**
 * Ensure fair representation in top matches
 * Prevents all premium agents from occupying top spots
 */
export function ensureFairRepresentation(
  sortedAgents: Array<{
    agent: AgentForMatching;
    score: number;
    meritScore: number;
    tierBonus: number;
    earlyAccessBonus: number;
  }>,
  maxResults: number
): typeof sortedAgents {
  const result = [];
  const premiumAgents = sortedAgents.filter((a) => a.agent.tier === 'PREMIUM');
  const standardAgents = sortedAgents.filter((a) => a.agent.tier === 'STANDARD');

  // Calculate fair distribution
  // For 5 results: up to 3 premium, at least 1-2 standard
  // For 3 results: up to 2 premium, at least 1 standard
  const maxPremium = Math.ceil(maxResults * 0.6);
  const minStandard = Math.max(1, maxResults - maxPremium);

  // Add top premium agents
  for (let i = 0; i < Math.min(maxPremium, premiumAgents.length) && result.length < maxResults; i++) {
    result.push(premiumAgents[i]);
  }

  // Add top standard agents
  for (let i = 0; i < Math.min(minStandard, standardAgents.length) && result.length < maxResults; i++) {
    result.push(standardAgents[i]);
  }

  // Fill remaining slots with next best agents (any tier)
  let premiumIdx = Math.min(maxPremium, premiumAgents.length);
  let standardIdx = Math.min(minStandard, standardAgents.length);

  while (result.length < maxResults) {
    const nextPremium = premiumAgents[premiumIdx];
    const nextStandard = standardAgents[standardIdx];

    if (nextPremium && (!nextStandard || nextPremium.score >= nextStandard.score)) {
      result.push(nextPremium);
      premiumIdx++;
    } else if (nextStandard) {
      result.push(nextStandard);
      standardIdx++;
    } else {
      break;
    }
  }

  return result;
}

/**
 * Generate human-readable match reasons
 * Do NOT mention subscription tier
 */
export function generateMatchReasons(agent: AgentForMatching, meritScore: number): string[] {
  const reasons: string[] = [];

  // Add merit-based reasons
  const meritReasons = generateMeritReasons(agent.meritScores);
  reasons.push(...meritReasons);

  // Add early interest reason if applicable
  if (agent.hasEarlyInterest) {
    reasons.push('Early interest shown');
  }

  // Add response time reason if available
  if (agent.responseTime && agent.responseTime < 120) {
    reasons.push('Quick response time');
  }

  return reasons.slice(0, 4); // Return up to 4 reasons
}

/**
 * Validate matching fairness
 * Ensures premium agents don't dominate results
 */
export function validateMatchingFairness(
  matchedAgents: MatchedAgent[],
  allAgents: AgentForMatching[]
): {
  fair: boolean;
  issues: string[];
  stats: {
    premiumCount: number;
    standardCount: number;
    averageMeritScore: number;
    premiumAverageMeritScore: number;
    standardAverageMeritScore: number;
  };
} {
  const issues: string[] = [];

  const premiumMatched = matchedAgents.filter((m) => {
    const agent = allAgents.find((a) => a.id === m.agentId);
    return agent?.tier === 'PREMIUM';
  });

  const standardMatched = matchedAgents.filter((m) => {
    const agent = allAgents.find((a) => a.id === m.agentId);
    return agent?.tier === 'STANDARD';
  });

  const premiumAverageMerit =
    premiumMatched.length > 0
      ? premiumMatched.reduce((sum, m) => sum + m.meritScore, 0) / premiumMatched.length
      : 0;

  const standardAverageMerit =
    standardMatched.length > 0
      ? standardMatched.reduce((sum, m) => sum + m.meritScore, 0) / standardMatched.length
      : 0;

  const averageMerit =
    matchedAgents.length > 0
      ? matchedAgents.reduce((sum, m) => sum + m.meritScore, 0) / matchedAgents.length
      : 0;

  // Check for fair representation
  if (matchedAgents.length >= 5 && premiumMatched.length === matchedAgents.length) {
    issues.push('All matched agents are premium tier');
  }

  if (matchedAgents.length >= 3 && standardMatched.length === 0) {
    issues.push('No standard tier agents in top matches');
  }

  // Check for merit-based fairness
  if (premiumAverageMerit < standardAverageMerit - 10) {
    issues.push('Premium agents have significantly lower merit scores than standard agents');
  }

  return {
    fair: issues.length === 0,
    issues,
    stats: {
      premiumCount: premiumMatched.length,
      standardCount: standardMatched.length,
      averageMeritScore: Math.round(averageMerit * 100) / 100,
      premiumAverageMeritScore: Math.round(premiumAverageMerit * 100) / 100,
      standardAverageMeritScore: Math.round(standardAverageMerit * 100) / 100,
    },
  };
}

/**
 * Calculate premium advantage
 * Shows how much premium tier boosts score
 */
export function calculatePremiumAdvantage(meritScore: number): {
  standardScore: number;
  premiumScore: number;
  advantagePoints: number;
  advantagePercentage: number;
} {
  const standardScore = meritScore * STANDARD_TIER_MULTIPLIER;
  const premiumScore = meritScore * PREMIUM_TIER_MULTIPLIER;
  const advantagePoints = premiumScore - standardScore;
  const advantagePercentage = ((premiumScore - standardScore) / standardScore) * 100;

  return {
    standardScore: Math.round(standardScore * 100) / 100,
    premiumScore: Math.round(premiumScore * 100) / 100,
    advantagePoints: Math.round(advantagePoints * 100) / 100,
    advantagePercentage: Math.round(advantagePercentage * 100) / 100,
  };
}

/**
 * Determine if an agent can reach top placement through merit alone
 */
export function canReachTopPlacementOnMerit(
  agentMeritScore: number,
  allAgentMeritScores: number[],
  targetPosition: number = 3
): boolean {
  // Sort all agents by merit score
  const sorted = [...allAgentMeritScores].sort((a, b) => b - a);

  // Check if this agent's merit score would place them in top positions
  const position = sorted.findIndex((score) => score === agentMeritScore) + 1;

  return position <= targetPosition;
}

/**
 * Generate matching transparency report
 */
export function generateMatchingTransparencyReport(
  matchingResult: MatchingResult,
  allAgents: AgentForMatching[]
): {
  summary: string;
  methodology: string;
  fairnessAnalysis: string;
} {
  const premiumCount = allAgents.filter((a) => a.tier === 'PREMIUM').length;
  const standardCount = allAgents.filter((a) => a.tier === 'STANDARD').length;

  const matchedPremium = matchingResult.matchedAgents.filter((m) => {
    const agent = allAgents.find((a) => a.id === m.agentId);
    return agent?.tier === 'PREMIUM';
  }).length;

  const matchedStandard = matchingResult.matchedAgents.length - matchedPremium;

  const summary = `Matched ${matchingResult.matchedAgents.length} agents from ${matchingResult.totalAgentsConsidered} considered (${premiumCount} premium, ${standardCount} standard)`;

  const methodology = `Matching uses merit-based scoring (feedback, realism, marketing, conduct, local knowledge) with fair tier representation. Premium agents receive 20% score boost and early interest bonus, but must meet quality baseline.`;

  const fairnessAnalysis = `Results include ${matchedPremium} premium and ${matchedStandard} standard agents. All matched agents exceed quality threshold. Ranking based on combined merit and tier factors.`;

  return { summary, methodology, fairnessAnalysis };
}
