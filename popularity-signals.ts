/**
 * Privacy-Safe Popularity Signals (Shared Module)
 * 
 * Re-exports from the server module for client-side use.
 * These are pure functions with no database dependencies.
 */

export interface PopularityMetrics {
  saveCount: number;
  viewCount: number;
  recentSaveCount: number; // saves in last 7 days
  recentViewCount: number; // views in last 7 days
  inquiryCount: number;
}

export interface PopularitySignal {
  label: string;
  description: string;
  icon: string;
  urgency: 'high' | 'medium' | 'low';
  color: string;
}

/**
 * Calculate popularity tier based on aggregate metrics
 */
export function calculatePopularityTier(
  metrics: PopularityMetrics
): 'high' | 'medium' | 'low' {
  const { saveCount, viewCount, recentSaveCount, recentViewCount, inquiryCount } = metrics;
  
  // High: significant engagement
  if (saveCount >= 10 || recentSaveCount >= 5 || inquiryCount >= 3) {
    return 'high';
  }
  
  // Medium: moderate engagement
  if (saveCount >= 3 || recentSaveCount >= 2 || recentViewCount >= 20 || inquiryCount >= 1) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Get a consumer-friendly popularity signal
 */
export function getPopularitySignal(metrics: PopularityMetrics): PopularitySignal | null {
  const tier = calculatePopularityTier(metrics);
  
  switch (tier) {
    case 'high':
      return {
        label: 'Popular',
        description: 'This property is attracting strong interest from buyers',
        icon: '🔥',
        urgency: 'high',
        color: 'text-orange-600',
      };
    case 'medium':
      return {
        label: 'Growing Interest',
        description: 'This property is building buyer interest',
        icon: '📈',
        urgency: 'medium',
        color: 'text-blue-600',
      };
    case 'low':
    default:
      return null;
  }
}

/**
 * Determine if popularity badge should be shown
 */
export function shouldShowPopularityBadge(metrics: PopularityMetrics): boolean {
  return calculatePopularityTier(metrics) !== 'low';
}

/**
 * Get consumer-friendly save count display
 */
export function getSaveCountDisplay(saveCount: number): string {
  if (saveCount === 0) return '';
  if (saveCount === 1) return '1 buyer saved this';
  if (saveCount < 5) return `${saveCount} buyers saved this`;
  if (saveCount < 10) return `${saveCount}+ buyers watching`;
  if (saveCount < 50) return `${Math.floor(saveCount / 5) * 5}+ buyers watching`;
  return '50+ buyers watching';
}

/**
 * Get time-based popularity label
 */
export function getTimeBasedPopularityLabel(
  recentSaveCount: number,
  recentViewCount: number
): string {
  if (recentSaveCount >= 5) return 'Very active this week';
  if (recentSaveCount >= 2) return 'Active this week';
  if (recentViewCount >= 20) return 'Lots of views this week';
  if (recentViewCount >= 10) return 'Getting attention';
  return '';
}
