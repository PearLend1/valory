/**
 * Agent Merit Signal Calculation
 * Calculates reputation scores based on feedback, realism, marketing, conduct, and local relevance
 * Ensures fair matching where quality agents can compete regardless of subscription tier
 */

export interface AgentMeritScores {
  feedbackScore: number; // 0-20
  realismScore: number; // 0-20
  marketingScore: number; // 0-15
  conductScore: number; // 0-15
  localRelevanceScore: number; // 0-10
  totalMeritScore: number; // 0-90
}

export interface FeedbackData {
  rating: number; // 1-5
  comment?: string;
  feedbackType: 'COMMUNICATION' | 'PROFESSIONALISM' | 'ACCURACY' | 'MARKETING' | 'OVERALL';
  timestamp: Date;
}

export interface ValuationAccuracyData {
  estimatedPrice: number;
  actualPrice: number;
  timestamp: Date;
}

/**
 * Calculate feedback score from vendor ratings
 * Converts average rating (1-5) to score (0-20)
 */
export function calculateFeedbackScore(
  feedbackRecords: FeedbackData[],
  feedbackCount: number,
  averageRating: number
): number {
  if (feedbackCount === 0) return 0;

  // Convert 1-5 rating to 0-20 scale
  // 5.0 = 20, 4.0 = 16, 3.0 = 12, 2.0 = 8, 1.0 = 4
  const baseScore = (averageRating - 1) * 5;

  // Apply volume bonus: more feedback = higher confidence
  const volumeBonus = Math.min(feedbackCount * 0.5, 5);

  // Recency bonus: recent feedback weighted more
  const now = Date.now();
  let recencyBonus = 0;

  for (const feedback of feedbackRecords) {
    const daysSince = (now - feedback.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) recencyBonus += 2; // Recent feedback
    else if (daysSince < 90) recencyBonus += 1; // Moderately recent
  }

  recencyBonus = Math.min(recencyBonus / feedbackRecords.length, 3);

  return Math.min(baseScore + volumeBonus + recencyBonus, 20);
}

/**
 * Calculate realism score from valuation accuracy
 * Measures how closely agent estimates match actual sale prices
 */
export function calculateRealismScore(valuationRecords: ValuationAccuracyData[]): number {
  if (valuationRecords.length === 0) return 10; // Default score for no data

  let totalAccuracy = 0;
  let validRecords = 0;

  for (const record of valuationRecords) {
    if (record.actualPrice && record.actualPrice > 0) {
      // Calculate percentage error
      const error = Math.abs(record.estimatedPrice - record.actualPrice) / record.actualPrice;
      // Convert error to accuracy (1.0 = perfect, 0.0 = way off)
      const accuracy = Math.max(0, 1 - error);
      totalAccuracy += accuracy;
      validRecords++;
    }
  }

  if (validRecords === 0) return 10; // Default for no completed sales

  const averageAccuracy = totalAccuracy / validRecords;

  // Convert accuracy to 0-20 scale
  // 0.95+ accuracy = 20 (within 5%)
  // 0.90 accuracy = 18 (within 10%)
  // 0.85 accuracy = 16 (within 15%)
  // 0.75 accuracy = 12 (within 25%)
  // Below 0.75 = lower scores
  return Math.min(averageAccuracy * 21, 20);
}

/**
 * Calculate marketing quality score
 * Based on profile completeness, presentation, and personality signals
 */
export function calculateMarketingScore(agentProfile: {
  bio?: string;
  profilePhoto?: string;
  specializations?: string[];
  marketingMaterials?: number;
  videoPresence?: boolean;
  socialMediaPresence?: boolean;
  testimonials?: number;
  profileCompleteness?: number; // 0-100
}): number {
  let score = 0;

  // Profile completeness (0-5 points)
  if (agentProfile.profileCompleteness) {
    score += (agentProfile.profileCompleteness / 100) * 5;
  }

  // Bio quality (0-3 points)
  if (agentProfile.bio && agentProfile.bio.length > 100) {
    score += 3;
  } else if (agentProfile.bio && agentProfile.bio.length > 50) {
    score += 1.5;
  }

  // Professional photo (0-2 points)
  if (agentProfile.profilePhoto) {
    score += 2;
  }

  // Specializations (0-2 points)
  if (agentProfile.specializations && agentProfile.specializations.length > 0) {
    score += Math.min(agentProfile.specializations.length * 0.5, 2);
  }

  // Marketing materials (0-2 points)
  if (agentProfile.marketingMaterials && agentProfile.marketingMaterials > 0) {
    score += Math.min(agentProfile.marketingMaterials * 0.5, 2);
  }

  // Video presence (0-2 points)
  if (agentProfile.videoPresence) {
    score += 2;
  }

  // Social media presence (0-1 point)
  if (agentProfile.socialMediaPresence) {
    score += 1;
  }

  // Testimonials (0-1 point)
  if (agentProfile.testimonials && agentProfile.testimonials > 0) {
    score += 1;
  }

  return Math.min(score, 15);
}

/**
 * Calculate platform conduct score
 * Based on response quality, professionalism, and platform behavior
 */
export function calculateConductScore(conductData: {
  averageResponseTime?: number; // minutes
  responseQualityRating?: number; // 1-5
  professionalismRating?: number; // 1-5
  reliabilityRating?: number; // 1-5
  complaintsCount?: number;
  suspensionsCount?: number;
  completedTransactions?: number;
}): number {
  let score = 0;

  // Response time (0-4 points)
  // < 1 hour = 4, < 4 hours = 3, < 24 hours = 2, < 48 hours = 1
  if (conductData.averageResponseTime) {
    if (conductData.averageResponseTime < 60) score += 4;
    else if (conductData.averageResponseTime < 240) score += 3;
    else if (conductData.averageResponseTime < 1440) score += 2;
    else if (conductData.averageResponseTime < 2880) score += 1;
  }

  // Response quality (0-4 points)
  if (conductData.responseQualityRating) {
    score += (conductData.responseQualityRating / 5) * 4;
  }

  // Professionalism (0-4 points)
  if (conductData.professionalismRating) {
    score += (conductData.professionalismRating / 5) * 4;
  }

  // Reliability (0-3 points)
  if (conductData.reliabilityRating) {
    score += (conductData.reliabilityRating / 5) * 3;
  }

  // Penalties for complaints and suspensions (0-2 points)
  let penaltyScore = 2;
  if (conductData.complaintsCount && conductData.complaintsCount > 0) {
    penaltyScore -= Math.min(conductData.complaintsCount * 0.5, 1);
  }
  if (conductData.suspensionsCount && conductData.suspensionsCount > 0) {
    penaltyScore -= conductData.suspensionsCount;
  }
  score += Math.max(penaltyScore, 0);

  // Bonus for completed transactions (0-2 points)
  if (conductData.completedTransactions && conductData.completedTransactions > 0) {
    score += Math.min(conductData.completedTransactions * 0.1, 2);
  }

  return Math.min(score, 15);
}

/**
 * Calculate local relevance score
 * Based on postcode coverage and local expertise
 */
export function calculateLocalRelevanceScore(localData: {
  postcodesServed?: string[];
  yearsInArea?: number;
  localExpertiseRating?: number; // 1-5
  localTransactionCount?: number;
  communityInvolvement?: boolean;
}): number {
  let score = 0;

  // Postcode coverage (0-3 points)
  if (localData.postcodesServed && localData.postcodesServed.length > 0) {
    score += Math.min(localData.postcodesServed.length * 0.2, 3);
  }

  // Years in area (0-3 points)
  if (localData.yearsInArea) {
    if (localData.yearsInArea >= 10) score += 3;
    else if (localData.yearsInArea >= 5) score += 2;
    else if (localData.yearsInArea >= 2) score += 1;
  }

  // Local expertise rating (0-2 points)
  if (localData.localExpertiseRating) {
    score += (localData.localExpertiseRating / 5) * 2;
  }

  // Local transaction count (0-1 point)
  if (localData.localTransactionCount && localData.localTransactionCount > 0) {
    score += Math.min(localData.localTransactionCount * 0.05, 1);
  }

  // Community involvement (0-1 point)
  if (localData.communityInvolvement) {
    score += 1;
  }

  return Math.min(score, 10);
}

/**
 * Calculate total merit score
 * Sum of all merit signals (0-90)
 */
export function calculateTotalMeritScore(meritScores: AgentMeritScores): number {
  return (
    meritScores.feedbackScore +
    meritScores.realismScore +
    meritScores.marketingScore +
    meritScores.conductScore +
    meritScores.localRelevanceScore
  );
}

/**
 * Classify agent merit level
 */
export function classifyMeritLevel(totalMeritScore: number): 'EMERGING' | 'ESTABLISHED' | 'ELITE' {
  if (totalMeritScore >= 75) return 'ELITE';
  if (totalMeritScore >= 50) return 'ESTABLISHED';
  return 'EMERGING';
}

/**
 * Generate merit summary for transparency
 */
export function generateMeritSummary(meritScores: AgentMeritScores): {
  level: string;
  strengths: string[];
  weaknesses: string[];
} {
  const level = classifyMeritLevel(meritScores.totalMeritScore);
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Identify strengths (scores > 15)
  if (meritScores.feedbackScore > 15) strengths.push('Excellent vendor feedback');
  if (meritScores.realismScore > 15) strengths.push('Accurate valuations');
  if (meritScores.marketingScore > 12) strengths.push('Strong marketing presence');
  if (meritScores.conductScore > 12) strengths.push('Reliable and professional');
  if (meritScores.localRelevanceScore > 8) strengths.push('Deep local knowledge');

  // Identify weaknesses (scores < 8)
  if (meritScores.feedbackScore < 8) weaknesses.push('Limited feedback history');
  if (meritScores.realismScore < 8) weaknesses.push('Valuation accuracy needs improvement');
  if (meritScores.marketingScore < 6) weaknesses.push('Could improve marketing presence');
  if (meritScores.conductScore < 6) weaknesses.push('Responsiveness could improve');
  if (meritScores.localRelevanceScore < 4) weaknesses.push('Limited local coverage');

  return { level, strengths, weaknesses };
}

/**
 * Validate merit scores are within acceptable ranges
 */
export function validateMeritScores(meritScores: AgentMeritScores): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (meritScores.feedbackScore < 0 || meritScores.feedbackScore > 20) {
    errors.push('Feedback score out of range (0-20)');
  }
  if (meritScores.realismScore < 0 || meritScores.realismScore > 20) {
    errors.push('Realism score out of range (0-20)');
  }
  if (meritScores.marketingScore < 0 || meritScores.marketingScore > 15) {
    errors.push('Marketing score out of range (0-15)');
  }
  if (meritScores.conductScore < 0 || meritScores.conductScore > 15) {
    errors.push('Conduct score out of range (0-15)');
  }
  if (meritScores.localRelevanceScore < 0 || meritScores.localRelevanceScore > 10) {
    errors.push('Local relevance score out of range (0-10)');
  }
  if (meritScores.totalMeritScore < 0 || meritScores.totalMeritScore > 90) {
    errors.push('Total merit score out of range (0-90)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate minimum merit threshold for matching
 * Ensures quality baseline regardless of tier
 */
export function calculateMinimumMeritThreshold(agentTier: 'PREMIUM' | 'STANDARD'): number {
  // All agents must meet minimum quality threshold
  // Premium agents: 30 points minimum (33% of max)
  // Standard agents: 25 points minimum (28% of max)
  return agentTier === 'PREMIUM' ? 30 : 25;
}

/**
 * Determine if agent meets quality baseline
 */
export function meetsQualityBaseline(
  totalMeritScore: number,
  agentTier: 'PREMIUM' | 'STANDARD'
): boolean {
  const threshold = calculateMinimumMeritThreshold(agentTier);
  return totalMeritScore >= threshold;
}

/**
 * Calculate merit-based ranking position
 * Higher merit = better ranking
 */
export function calculateMeritRankPosition(
  agentMeritScore: number,
  allAgentMeritScores: number[]
): number {
  const sorted = [...allAgentMeritScores].sort((a, b) => b - a);
  const position = sorted.indexOf(agentMeritScore) + 1;
  return position;
}

/**
 * Generate merit-based match reasons
 */
export function generateMeritReasons(meritScores: AgentMeritScores): string[] {
  const reasons: string[] = [];

  if (meritScores.localRelevanceScore > 7) {
    reasons.push('Strong local knowledge');
  }

  if (meritScores.realismScore > 16) {
    reasons.push('Realistic pricing approach');
  }

  if (meritScores.marketingScore > 12) {
    reasons.push('Compelling marketing style');
  }

  if (meritScores.feedbackScore > 16) {
    reasons.push('Excellent vendor feedback');
  }

  if (meritScores.conductScore > 12) {
    reasons.push('Highly responsive and professional');
  }

  return reasons.slice(0, 3); // Return top 3 reasons
}
