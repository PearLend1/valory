/**
 * Four-Layer Valuation Engine
 *
 * Aggregates property valuations from four data sources:
 * 1. Public data  — Land Registry comparables via Street Data API
 * 2. API data     — Street Data AVM (estimated_values) + market_statistics
 * 3. Agent intelligence — local pricing insight, market adjustments
 * 4. Valory-native data — engagement, momentum, outcomes
 */
import { externalDataRegistry } from './external-data-provider';

export interface ValuationDataSource {
  type: 'public_data' | 'api_data' | 'agent_intelligence' | 'platform_native';
  sourceDetail: string;
  contribution: number; // Weight percentage
  dataPoints: number;
  confidence: 'low' | 'medium' | 'high';
  estimatedValue?: number;
}

export interface ValuationResult {
  estimatedPriceLow: number;
  estimatedPriceHigh: number;
  estimatedMidpoint: number;
  confidence: 'low' | 'medium' | 'high';
  confidenceScore: number; // 0-100
  dataSources: ValuationDataSource[];
  reasoning: string;
  lastUpdated: Date;
}

/**
 * Public Data Layer (Layer 1)
 * Uses Land Registry comparable transactions via Street Data API.
 * Falls back to heuristic if API is unavailable.
 */
export async function calculatePublicDataValuation(
  postcode: string,
  propertyType: string,
  bedrooms: number,
  squareFeet: number
): Promise<{ value: number; confidence: 'low' | 'medium' | 'high'; dataPoints: number }> {
  try {
    const comparables = await externalDataRegistry.getComparables(postcode, propertyType, bedrooms);
    if (comparables.length > 0) {
      const prices = comparables.map(c => c.price).sort((a, b) => a - b);
      const median = prices[Math.floor(prices.length / 2)];
      const confidence = prices.length >= 10 ? 'high' : prices.length >= 5 ? 'medium' : 'low';
      return { value: median, confidence, dataPoints: prices.length };
    }
  } catch (err) {
    console.warn('[ValuationEngine] Layer 1 API call failed, using heuristic:', err);
  }

  // Heuristic fallback
  const basePrice = 300000;
  const pricePerSqft = 150;
  const bedroomMultiplier = 1 + (bedrooms - 3) * 0.15;
  const estimatedValue = (basePrice + squareFeet * pricePerSqft) * bedroomMultiplier;
  return { value: estimatedValue, confidence: 'low', dataPoints: 0 };
}

/**
 * API Data Layer (Layer 2)
 * Uses Street Data AVM (estimated_values) and market_statistics.
 * Falls back to listing price heuristic if unavailable.
 */
export async function calculateAPIDataValuation(
  postcode: string,
  propertyType: string,
  price: number,
  bedrooms: number
): Promise<{ value: number; confidence: 'low' | 'medium' | 'high'; dataPoints: number; marketTrend: string }> {
  try {
    const [bracket, market] = await Promise.all([
      externalDataRegistry.getValuationBracket(postcode, propertyType, bedrooms),
      externalDataRegistry.getLocalMarketContext(postcode),
    ]);

    if (bracket) {
      return {
        value: bracket.mid,
        confidence: bracket.confidence,
        dataPoints: 1,
        marketTrend: market?.marketTrend ?? 'stable',
      };
    }
  } catch (err) {
    console.warn('[ValuationEngine] Layer 2 API call failed, using heuristic:', err);
  }

  // Heuristic fallback
  return { value: price * 1.02, confidence: 'low', dataPoints: 0, marketTrend: 'stable' };
}

/**
 * Agent Intelligence Layer
 * Uses agent-submitted pricing insights and market adjustments
 */
export function calculateAgentIntelligenceValuation(
  baseValue: number,
  agentAdjustments: { adjustmentPercentage: number; adjustmentType: string }[],
  agentPricingInsight?: { pricePerSqft: number; marketTrend: string }
): { value: number; confidence: 'low' | 'medium' | 'high'; adjustments: string[] } {
  let adjustedValue = baseValue;
  const adjustments: string[] = [];
  
  // Apply agent market adjustments
  agentAdjustments.forEach((adj) => {
    const adjustment = baseValue * (adj.adjustmentPercentage / 100);
    adjustedValue += adjustment;
    adjustments.push(`${adj.adjustmentType}: ${adj.adjustmentPercentage > 0 ? '+' : ''}${adj.adjustmentPercentage}%`);
  });
  
  // Apply agent pricing insight if available
  if (agentPricingInsight) {
    const insightConfidence = agentPricingInsight.marketTrend === 'rising' ? 1.05 : 
                              agentPricingInsight.marketTrend === 'falling' ? 0.95 : 1.0;
    adjustedValue *= insightConfidence;
    adjustments.push(`Market trend: ${agentPricingInsight.marketTrend}`);
  }
  
  return {
    value: adjustedValue,
    confidence: agentAdjustments.length > 0 ? 'high' : 'medium',
    adjustments,
  };
}

/**
 * Valory-Native Data Layer
 * Uses platform engagement metrics and historical outcomes
 */
export function calculatePlatformNativeValuation(
  baseValue: number,
  engagementMetrics: {
    viewingVelocity?: number;
    offerCount?: number;
    averageOfferPrice?: number;
    priceChangeCount?: number;
    timeOnMarket?: number;
  },
  historicalAccuracy?: number
): { value: number; confidence: 'low' | 'medium' | 'high'; signals: string[] } {
  let adjustedValue = baseValue;
  const signals: string[] = [];
  
  // High viewing velocity suggests strong demand
  if (engagementMetrics.viewingVelocity && engagementMetrics.viewingVelocity > 5) {
    adjustedValue *= 1.03;
    signals.push('High viewing velocity indicates strong demand');
  }
  
  // Offers received suggest market validation
  if (engagementMetrics.offerCount && engagementMetrics.offerCount > 0) {
    if (engagementMetrics.averageOfferPrice) {
      const offerRatio = engagementMetrics.averageOfferPrice / baseValue;
      adjustedValue = engagementMetrics.averageOfferPrice;
      signals.push(`${engagementMetrics.offerCount} offers received, average ${(offerRatio * 100).toFixed(1)}% of estimate`);
    }
  }
  
  // Multiple price changes suggest market testing
  if (engagementMetrics.priceChangeCount && engagementMetrics.priceChangeCount > 2) {
    signals.push(`${engagementMetrics.priceChangeCount} price adjustments indicate market positioning`);
  }
  
  // Time on market affects confidence
  if (engagementMetrics.timeOnMarket) {
    if (engagementMetrics.timeOnMarket < 14) {
      signals.push('Quick sale suggests strong market position');
    } else if (engagementMetrics.timeOnMarket > 60) {
      adjustedValue *= 0.97;
      signals.push('Extended time on market may indicate overpricing');
    }
  }
  
  const confidence = signals.length > 2 ? 'high' : signals.length > 0 ? 'medium' : 'low';
  
  return {
    value: adjustedValue,
    confidence,
    signals,
  };
}

/**
 * Aggregate all four layers into final valuation
 */
export function aggregateValuation(
  publicData: { value: number; confidence: 'low' | 'medium' | 'high'; dataPoints: number },
  apiData: { value: number; confidence: 'low' | 'medium' | 'high'; dataPoints: number; marketTrend: string },
  agentIntelligence: { value: number; confidence: 'low' | 'medium' | 'high'; adjustments: string[] },
  platformNative: { value: number; confidence: 'low' | 'medium' | 'high'; signals: string[] }
): ValuationResult {
  // Calculate weighted average based on data availability and confidence
  const weights = {
    public: 0.30,
    api: 0.30,
    agent: 0.20,
    platform: 0.20,
  };
  
  // Adjust weights based on confidence levels
  const confidenceMultiplier = {
    low: 0.5,
    medium: 1.0,
    high: 1.5,
  };
  
  const publicWeight = weights.public * confidenceMultiplier[publicData.confidence];
  const apiWeight = weights.api * confidenceMultiplier[apiData.confidence];
  const agentWeight = weights.agent * confidenceMultiplier[agentIntelligence.confidence];
  const platformWeight = weights.platform * confidenceMultiplier[platformNative.confidence];
  
  const totalWeight = publicWeight + apiWeight + agentWeight + platformWeight;
  
  const normalizedPublicWeight = publicWeight / totalWeight;
  const normalizedApiWeight = apiWeight / totalWeight;
  const normalizedAgentWeight = agentWeight / totalWeight;
  const normalizedPlatformWeight = platformWeight / totalWeight;
  
  const midpoint =
    publicData.value * normalizedPublicWeight +
    apiData.value * normalizedApiWeight +
    agentIntelligence.value * normalizedAgentWeight +
    platformNative.value * normalizedPlatformWeight;
  
  // Calculate price range (±10% of midpoint)
  const priceLow = midpoint * 0.9;
  const priceHigh = midpoint * 1.1;
  
  // Determine overall confidence
  const avgConfidenceScore =
    (publicData.confidence === 'high' ? 3 : publicData.confidence === 'medium' ? 2 : 1) * normalizedPublicWeight +
    (apiData.confidence === 'high' ? 3 : apiData.confidence === 'medium' ? 2 : 1) * normalizedApiWeight +
    (agentIntelligence.confidence === 'high' ? 3 : agentIntelligence.confidence === 'medium' ? 2 : 1) * normalizedAgentWeight +
    (platformNative.confidence === 'high' ? 3 : platformNative.confidence === 'medium' ? 2 : 1) * normalizedPlatformWeight;
  
  const confidenceScore = (avgConfidenceScore / 3) * 100;
  const overallConfidence = confidenceScore > 75 ? 'high' : confidenceScore > 50 ? 'medium' : 'low';
  
  const dataSources: ValuationDataSource[] = [
    {
      type: 'public_data',
      sourceDetail: 'Land Registry & Postcode History',
      contribution: normalizedPublicWeight * 100,
      dataPoints: publicData.dataPoints,
      confidence: publicData.confidence,
      estimatedValue: publicData.value,
    },
    {
      type: 'api_data',
      sourceDetail: `Zoopla-style Comparables (${apiData.marketTrend} market)`,
      contribution: normalizedApiWeight * 100,
      dataPoints: apiData.dataPoints,
      confidence: apiData.confidence,
      estimatedValue: apiData.value,
    },
    {
      type: 'agent_intelligence',
      sourceDetail: 'Agent Pricing Insight & Market Adjustments',
      contribution: normalizedAgentWeight * 100,
      dataPoints: agentIntelligence.adjustments.length,
      confidence: agentIntelligence.confidence,
      estimatedValue: agentIntelligence.value,
    },
    {
      type: 'platform_native',
      sourceDetail: 'Valory Engagement & Momentum Data',
      contribution: normalizedPlatformWeight * 100,
      dataPoints: platformNative.signals.length,
      confidence: platformNative.confidence,
      estimatedValue: platformNative.value,
    },
  ];
  
  const reasoning = `
    Valuation based on four data layers:
    - Public data (${(normalizedPublicWeight * 100).toFixed(0)}%): Land Registry sold prices and postcode transaction history
    - API data (${(normalizedApiWeight * 100).toFixed(0)}%): Market comparables and trends (${apiData.marketTrend})
    - Agent intelligence (${(normalizedAgentWeight * 100).toFixed(0)}%): ${agentIntelligence.adjustments.join(', ') || 'No adjustments'}
    - Platform data (${(normalizedPlatformWeight * 100).toFixed(0)}%): ${platformNative.signals.join(', ') || 'Insufficient engagement data'}
    
    Confidence: ${overallConfidence.toUpperCase()} (${confidenceScore.toFixed(0)}%)
    This estimate becomes more accurate as more data is added by the vendor and as Valory learns from platform behavior.
  `.trim();
  
  return {
    estimatedPriceLow: Math.round(priceLow),
    estimatedPriceHigh: Math.round(priceHigh),
    estimatedMidpoint: Math.round(midpoint),
    confidence: overallConfidence,
    confidenceScore: Math.round(confidenceScore),
    dataSources,
    reasoning,
    lastUpdated: new Date(),
  };
}

/**
 * Calculate confidence improvement potential
 * Shows how confidence could improve with more data
 */
export function calculateConfidenceEvolution(
  currentConfidence: number,
  availableDataSources: {
    hasAgentIntelligence: boolean;
    hasEngagementData: boolean;
    hasPriceHistory: boolean;
    hasOfferData: boolean;
  }
): {
  currentScore: number;
  potentialScore: number;
  missingDataSources: string[];
  improvementPercentage: number;
} {
  const missingDataSources: string[] = [];
  let potentialScore = currentConfidence;
  
  if (!availableDataSources.hasAgentIntelligence) {
    missingDataSources.push('Agent pricing insights');
    potentialScore += 10;
  }
  
  if (!availableDataSources.hasEngagementData) {
    missingDataSources.push('Viewing and engagement data');
    potentialScore += 15;
  }
  
  if (!availableDataSources.hasPriceHistory) {
    missingDataSources.push('Historical price adjustments');
    potentialScore += 10;
  }
  
  if (!availableDataSources.hasOfferData) {
    missingDataSources.push('Offer history and outcomes');
    potentialScore += 15;
  }
  
  potentialScore = Math.min(potentialScore, 95); // Cap at 95%
  
  return {
    currentScore: currentConfidence,
    potentialScore,
    missingDataSources,
    improvementPercentage: ((potentialScore - currentConfidence) / currentConfidence) * 100,
  };
}
