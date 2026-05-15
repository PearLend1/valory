/**
 * Conservative Weighting System for Four-Layer Valuation
 * Ensures public/API data dominates in early versions
 * Agent intelligence and platform-native data are conservative additions
 */

export interface WeightingConfig {
  publicData: number;
  apiData: number;
  agentIntelligence: number;
  platformNative: number;
}

export interface DataQualityScore {
  publicData: number; // 0-100
  apiData: number; // 0-100
  agentIntelligence: number; // 0-100
  platformNative: number; // 0-100
}

/**
 * Conservative weighting: Public and API data dominate (80%)
 * Agent intelligence capped at 15%, platform-native at 5%
 */
export const CONSERVATIVE_WEIGHTING: WeightingConfig = {
  publicData: 0.45,
  apiData: 0.35,
  agentIntelligence: 0.15,
  platformNative: 0.05,
};

/**
 * Balanced weighting: All sources contribute equally
 * Used when all data layers have high quality
 */
export const BALANCED_WEIGHTING: WeightingConfig = {
  publicData: 0.30,
  apiData: 0.30,
  agentIntelligence: 0.25,
  platformNative: 0.15,
};

/**
 * Calculate quality score for each data layer
 * Returns 0-100 score based on data availability and consistency
 */
export function calculateDataQualityScores(
  publicDataPoints: number,
  apiDataPoints: number,
  agentSubmissions: number,
  engagementDataPoints: number
): DataQualityScore {
  // Public data: 0-100 based on number of comparable sales (max 50 = 100%)
  const publicScore = Math.min(100, (publicDataPoints / 50) * 100);

  // API data: 0-100 based on number of comparable listings (max 30 = 100%)
  const apiScore = Math.min(100, (apiDataPoints / 30) * 100);

  // Agent intelligence: 0-100 based on submission count and consistency
  // Conservative: requires multiple submissions from different agents for high score
  const agentScore = Math.min(100, (agentSubmissions / 5) * 100);

  // Platform-native: 0-100 based on engagement data points
  // Conservative: requires 100+ data points for 100% confidence
  const platformScore = Math.min(100, (engagementDataPoints / 100) * 100);

  return {
    publicData: publicScore,
    apiData: apiScore,
    agentIntelligence: agentScore,
    platformNative: platformScore,
  };
}

/**
 * Select weighting strategy based on data quality
 * Conservative approach: only use balanced weighting if all sources have high quality
 */
export function selectWeightingStrategy(qualityScores: DataQualityScore): WeightingConfig {
  // If all data sources have >70% quality, use balanced weighting
  const allHighQuality =
    qualityScores.publicData > 70 &&
    qualityScores.apiData > 70 &&
    qualityScores.agentIntelligence > 70 &&
    qualityScores.platformNative > 70;

  if (allHighQuality) {
    return BALANCED_WEIGHTING;
  }

  // Otherwise, use conservative weighting (default)
  return CONSERVATIVE_WEIGHTING;
}

/**
 * Apply quality-based adjustments to weights
 * Reduces weight of low-quality data sources
 */
export function applyQualityAdjustments(
  weights: WeightingConfig,
  qualityScores: DataQualityScore
): WeightingConfig {
  // If a data source has <40% quality, reduce its weight by 50%
  const adjustedWeights = { ...weights };

  if (qualityScores.publicData < 40) {
    adjustedWeights.publicData *= 0.5;
  }
  if (qualityScores.apiData < 40) {
    adjustedWeights.apiData *= 0.5;
  }
  if (qualityScores.agentIntelligence < 40) {
    adjustedWeights.agentIntelligence *= 0.5;
  }
  if (qualityScores.platformNative < 40) {
    adjustedWeights.platformNative *= 0.5;
  }

  // Renormalize weights to sum to 1
  const total =
    adjustedWeights.publicData +
    adjustedWeights.apiData +
    adjustedWeights.agentIntelligence +
    adjustedWeights.platformNative;

  return {
    publicData: adjustedWeights.publicData / total,
    apiData: adjustedWeights.apiData / total,
    agentIntelligence: adjustedWeights.agentIntelligence / total,
    platformNative: adjustedWeights.platformNative / total,
  };
}

/**
 * Calculate weighted valuation from four layers
 */
export function calculateWeightedValuation(
  publicValue: number,
  apiValue: number,
  agentValue: number,
  platformValue: number,
  weights: WeightingConfig
): number {
  return (
    publicValue * weights.publicData +
    apiValue * weights.apiData +
    agentValue * weights.agentIntelligence +
    platformValue * weights.platformNative
  );
}

/**
 * Calculate confidence score based on data availability and quality
 * Returns 0-100 score
 */
export function calculateConfidenceScore(
  qualityScores: DataQualityScore,
  hasAgentIntelligence: boolean,
  hasEngagementData: boolean
): number {
  // Base confidence from public and API data (max 70%)
  const baseConfidence = (qualityScores.publicData * 0.4 + qualityScores.apiData * 0.3) / 0.7;

  // Bonus for agent intelligence (max +15%)
  const agentBonus = hasAgentIntelligence ? Math.min(15, qualityScores.agentIntelligence * 0.15) : 0;

  // Bonus for engagement data (max +15%)
  const engagementBonus = hasEngagementData ? Math.min(15, qualityScores.platformNative * 0.15) : 0;

  return Math.min(100, Math.round(baseConfidence + agentBonus + engagementBonus));
}

/**
 * Identify missing data sources that would improve confidence
 */
export function identifyMissingDataSources(
  qualityScores: DataQualityScore,
  hasAgentIntelligence: boolean,
  hasEngagementData: boolean
): string[] {
  const missing: string[] = [];

  if (qualityScores.publicData < 60) {
    missing.push('More comparable sales data');
  }
  if (qualityScores.apiData < 60) {
    missing.push('Current market listings');
  }
  if (!hasAgentIntelligence || qualityScores.agentIntelligence < 60) {
    missing.push('Agent pricing insights');
  }
  if (!hasEngagementData || qualityScores.platformNative < 60) {
    missing.push('Property engagement data');
  }

  return missing;
}

/**
 * Calculate potential confidence score if all data were available
 */
export function calculatePotentialConfidenceScore(
  currentScore: number,
  missingDataSources: string[]
): number {
  // Each missing data source could add ~5-10% to confidence
  const potentialGain = missingDataSources.length * 7;
  return Math.min(100, currentScore + potentialGain);
}
