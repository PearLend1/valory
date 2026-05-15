/**
 * Fair Agent Ranking Engine
 * Prioritizes quality, expertise, and engagement over raw response speed
 * Enables independents and corporates to compete fairly on quality
 */

export interface AgentRankingFactors {
  accuracyScore: number; // 0-100: pricing realism vs valuation engine
  marketingScore: number; // 0-100: profile quality, presentation, personality
  engagementScore: number; // 0-100: response quality, thoughtfulness, relevance
  expertiseScore: number; // 0-100: local market knowledge, specializations
  responsivenessScore: number; // 0-100: fair response time (light signal only)
}

export interface AgentRankingResult {
  agentId: number;
  totalScore: number;
  rankPosition: number;
  factors: AgentRankingFactors;
  explanation: string;
}

// Weighting: Quality-first model
const RANKING_WEIGHTS = {
  accuracy: 0.25, // Pricing realism - prevent inflated estimates
  marketing: 0.25, // Profile quality and presentation
  engagement: 0.2, // Response quality and thoughtfulness
  expertise: 0.2, // Local knowledge and specialization
  responsiveness: 0.1, // Light signal only - not dominant
};

/**
 * Calculate accuracy score based on pricing realism
 * Compares agent estimates against valuation engine and market data
 */
export function calculateAccuracyScore(
  agentEstimate: number,
  valuationEngineEstimate: number,
  marketMedian: number
): number {
  // Calculate percentage difference from valuation engine
  const engineDifference = Math.abs(agentEstimate - valuationEngineEstimate) / valuationEngineEstimate;
  const marketDifference = Math.abs(agentEstimate - marketMedian) / marketMedian;

  // Average the two differences
  const avgDifference = (engineDifference + marketDifference) / 2;

  // Score: perfect alignment = 100, 5% off = 90, 10% off = 75, 20%+ off = 50
  if (avgDifference <= 0.02) return 100; // Within 2%
  if (avgDifference <= 0.05) return 95; // Within 5%
  if (avgDifference <= 0.08) return 85; // Within 8%
  if (avgDifference <= 0.12) return 75; // Within 12%
  if (avgDifference <= 0.2) return 60; // Within 20%
  return 50; // 20%+ difference - penalize inflated estimates

  // Note: Estimates consistently above market are penalized more heavily
  // This prevents agents from gaming the system with inflated pricing
}

/**
 * Calculate marketing quality score
 * Rewards strong presentation, personality, and modern marketing approach
 */
export function calculateMarketingScore(profileData: {
  profileCompleteness: number; // 0-100: photo, bio, specializations filled
  bioQuality: number; // 0-100: depth and personality of bio
  photoQuality: number; // 0-100: professional photo presence
  specializations: string[]; // List of specializations
  certifications: string[]; // Professional certifications
  yearsExperience: number;
  hasModernMarketing: boolean; // Website, social media, video
  uniquePositioning: boolean; // Clear differentiation
}): number {
  let score = 50; // Base score

  // Profile completeness (up to +20 points)
  score += (profileData.profileCompleteness / 100) * 20;

  // Bio quality (up to +15 points)
  score += (profileData.bioQuality / 100) * 15;

  // Photo quality (up to +10 points)
  score += (profileData.photoQuality / 100) * 10;

  // Specializations (up to +15 points)
  const specializationBonus = Math.min(profileData.specializations.length * 3, 15);
  score += specializationBonus;

  // Certifications (up to +10 points)
  const certificationBonus = Math.min(profileData.certifications.length * 2, 10);
  score += certificationBonus;

  // Modern marketing (up to +10 points)
  if (profileData.hasModernMarketing) score += 10;

  // Unique positioning (up to +10 points)
  if (profileData.uniquePositioning) score += 10;

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Calculate engagement quality score
 * Rewards thoughtful, personalized, relevant responses
 * Penalizes generic, low-effort responses
 */
export function calculateEngagementScore(engagementData: {
  responseQuality: number; // 0-100: depth and professionalism
  relevance: number; // 0-100: how relevant to property/vendor needs
  thoughtfulness: number; // 0-100: customization vs template
  personalization: number; // 0-100: agent's personal touch
  responseDepth: 'shallow' | 'moderate' | 'deep'; // Categorization
  isGenericResponse: boolean;
}): number {
  // Penalize generic responses heavily
  if (engagementData.isGenericResponse) {
    return Math.min(
      (engagementData.responseQuality +
        engagementData.relevance +
        engagementData.thoughtfulness +
        engagementData.personalization) /
        4,
      40
    ); // Cap at 40 for generic responses
  }

  // Calculate weighted engagement score
  const baseScore =
    engagementData.responseQuality * 0.3 +
    engagementData.relevance * 0.3 +
    engagementData.thoughtfulness * 0.2 +
    engagementData.personalization * 0.2;

  // Bonus for deep responses
  let depthBonus = 0;
  if (engagementData.responseDepth === 'deep') depthBonus = 10;
  else if (engagementData.responseDepth === 'moderate') depthBonus = 5;

  return Math.min(baseScore + depthBonus, 100);
}

/**
 * Calculate expertise score
 * Rewards local market knowledge and relevant specializations
 */
export function calculateExpertiseScore(expertiseData: {
  yearsExperience: number;
  yearsActiveInArea: number;
  propertiesSoldInArea: number;
  specializations: string[];
  localReputationScore: number; // 0-100
  propertyTypeMatch: boolean; // Does agent specialize in this property type?
}): number {
  let score = 50; // Base score

  // Years of experience (up to +15 points)
  const experienceBonus = Math.min((expertiseData.yearsExperience / 20) * 15, 15);
  score += experienceBonus;

  // Local market presence (up to +20 points)
  const localBonus = Math.min((expertiseData.yearsActiveInArea / 10) * 20, 20);
  score += localBonus;

  // Properties sold in area (up to +15 points)
  const volumeBonus = Math.min((expertiseData.propertiesSoldInArea / 50) * 15, 15);
  score += volumeBonus;

  // Specializations (up to +15 points)
  const specializationBonus = Math.min(expertiseData.specializations.length * 3, 15);
  score += specializationBonus;

  // Local reputation (up to +15 points)
  score += (expertiseData.localReputationScore / 100) * 15;

  // Property type match (up to +10 points)
  if (expertiseData.propertyTypeMatch) score += 10;

  return Math.min(score, 100);
}

/**
 * Calculate responsiveness score
 * Fair response time within reasonable window
 * NOT a dominant factor - capped at 10% of total ranking
 */
export function calculateResponsivenessScore(responsivenessData: {
  avgResponseTimeHours: number;
  responseConsistency: number; // 0-100: how consistently responsive
  responsesWithin24h: number;
  responsesWithin48h: number;
  totalResponses: number;
}): number {
  // Define fair response time windows
  // Excellent: within 24h
  // Good: within 48h
  // Fair: within 72h
  // Poor: beyond 72h

  let score = 50; // Base score

  // Average response time scoring
  if (responsivenessData.avgResponseTimeHours <= 24) {
    score = 90; // Excellent
  } else if (responsivenessData.avgResponseTimeHours <= 48) {
    score = 80; // Good
  } else if (responsivenessData.avgResponseTimeHours <= 72) {
    score = 70; // Fair
  } else if (responsivenessData.avgResponseTimeHours <= 120) {
    score = 60; // Acceptable
  } else {
    score = 50; // Slow
  }

  // Consistency bonus (up to +10 points)
  score += (responsivenessData.responseConsistency / 100) * 10;

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Calculate fair overall ranking score
 * Weights: Accuracy 25%, Marketing 25%, Engagement 20%, Expertise 20%, Responsiveness 10%
 */
export function calculateFairRankingScore(factors: AgentRankingFactors): number {
  return (
    factors.accuracyScore * RANKING_WEIGHTS.accuracy +
    factors.marketingScore * RANKING_WEIGHTS.marketing +
    factors.engagementScore * RANKING_WEIGHTS.engagement +
    factors.expertiseScore * RANKING_WEIGHTS.expertise +
    factors.responsivenessScore * RANKING_WEIGHTS.responsiveness
  );
}

/**
 * Generate human-readable explanation of ranking
 */
export function generateRankingExplanation(
  factors: AgentRankingFactors,
  agentName: string
): string {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Identify strengths
  if (factors.accuracyScore >= 85) strengths.push('Realistic pricing estimates');
  if (factors.marketingScore >= 85) strengths.push('Strong professional profile and marketing');
  if (factors.engagementScore >= 85) strengths.push('Thoughtful, personalized responses');
  if (factors.expertiseScore >= 85) strengths.push('Deep local market expertise');
  if (factors.responsivenessScore >= 85) strengths.push('Consistently responsive');

  // Identify areas for improvement
  if (factors.accuracyScore < 60) weaknesses.push('Pricing estimates may be inflated');
  if (factors.marketingScore < 60) weaknesses.push('Profile could be more complete');
  if (factors.engagementScore < 60) weaknesses.push('Responses could be more personalized');
  if (factors.expertiseScore < 60) weaknesses.push('Limited local market experience');
  if (factors.responsivenessScore < 60) weaknesses.push('Response times could be faster');

  let explanation = `${agentName} is ranked based on: `;

  if (strengths.length > 0) {
    explanation += `strengths in ${strengths.join(', ')}. `;
  }

  if (weaknesses.length > 0) {
    explanation += `Areas to note: ${weaknesses.join(', ')}.`;
  }

  return explanation;
}

/**
 * Rank agents fairly for a property
 * Returns sorted list with explanations
 */
export function rankAgentsFairly(
  agents: Array<{ id: number; factors: AgentRankingFactors; name: string }>
): AgentRankingResult[] {
  // Calculate scores
  const scored = agents.map((agent) => ({
    agentId: agent.id,
    totalScore: calculateFairRankingScore(agent.factors),
    factors: agent.factors,
    explanation: generateRankingExplanation(agent.factors, agent.name),
  }));

  // Sort by total score (descending)
  scored.sort((a, b) => b.totalScore - a.totalScore);

  // Add rank positions
  return scored.map((result, index) => ({
    ...result,
    rankPosition: index + 1,
  }));
}

/**
 * Validate that ranking system is fair
 * Checks that independents and corporates can compete equally
 */
export function validateRankingFairness(
  independentAgents: AgentRankingResult[],
  corporateAgents: AgentRankingResult[]
): {
  isFair: boolean;
  independentAvgScore: number;
  corporateAvgScore: number;
  speedNotDominant: boolean;
} {
  const independentAvg =
    independentAgents.reduce((sum, a) => sum + a.totalScore, 0) / independentAgents.length;
  const corporateAvg =
    corporateAgents.reduce((sum, a) => sum + a.totalScore, 0) / corporateAgents.length;

  // Check if responsiveness is not dominant
  const independentResponsiveness =
    independentAgents.reduce((sum, a) => sum + a.factors.responsivenessScore, 0) /
    independentAgents.length;
  const corporateResponsiveness =
    corporateAgents.reduce((sum, a) => sum + a.factors.responsivenessScore, 0) /
    corporateAgents.length;

  // Responsiveness should not be the primary differentiator
  const speedNotDominant =
    Math.abs(independentResponsiveness - corporateResponsiveness) <
    Math.abs(independentAvg - corporateAvg);

  return {
    isFair: Math.abs(independentAvg - corporateAvg) < 10, // Within 10 points is fair
    independentAvgScore: independentAvg,
    corporateAvgScore: corporateAvg,
    speedNotDominant,
  };
}
