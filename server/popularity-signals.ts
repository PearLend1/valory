/**
 * Privacy-Safe Popularity Signals
 * 
 * Shows aggregate engagement metrics without exposing individual user data.
 * Focuses on property-level popularity, not buyer-level details.
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
 * Tiers: high (popular), medium (moderate interest), low (standard)
 */
export function calculatePopularityTier(
  metrics: PopularityMetrics
): 'high' | 'medium' | 'low' {
  // High popularity: 20+ saves OR 50+ views in last 7 days
  if (metrics.recentSaveCount >= 20 || metrics.recentViewCount >= 50) {
    return 'high';
  }

  // Medium popularity: 10-19 saves OR 30-49 views in last 7 days
  if (metrics.recentSaveCount >= 10 || metrics.recentViewCount >= 30) {
    return 'medium';
  }

  // Low popularity: below thresholds
  return 'low';
}

/**
 * Generate consumer-friendly popularity label
 */
export function getPopularityLabel(metrics: PopularityMetrics): string {
  const tier = calculatePopularityTier(metrics);

  if (tier === 'high') {
    return 'Popular';
  }

  if (tier === 'medium') {
    return 'Growing interest';
  }

  return ''; // Don't show label for low popularity
}

/**
 * Generate popularity description for detail pages
 */
export function getPopularityDescription(metrics: PopularityMetrics): string {
  const tier = calculatePopularityTier(metrics);
  const saveCount = metrics.saveCount;
  const weekSaves = metrics.recentSaveCount;

  if (tier === 'high') {
    if (weekSaves >= 20) {
      return `${weekSaves} saves this week — high buyer interest`;
    }
    if (metrics.recentViewCount >= 50) {
      return `${metrics.recentViewCount} views this week — popular in your area`;
    }
    return 'Popular with buyers';
  }

  if (tier === 'medium') {
    return `${saveCount} saves — growing interest`;
  }

  if (saveCount > 0) {
    return `${saveCount} saves`;
  }

  return '';
}

/**
 * Generate popularity signal for UI display
 */
export function getPopularitySignal(metrics: PopularityMetrics): PopularitySignal | null {
  const tier = calculatePopularityTier(metrics);

  if (tier === 'high') {
    return {
      label: 'Popular',
      description: 'High buyer interest',
      icon: '🔥',
      urgency: 'high',
      color: 'text-red-600',
    };
  }

  if (tier === 'medium') {
    return {
      label: 'Growing interest',
      description: 'Moderate buyer interest',
      icon: '📈',
      urgency: 'medium',
      color: 'text-orange-600',
    };
  }

  return null;
}

/**
 * Check if property should show popularity badge on card
 */
export function shouldShowPopularityBadge(metrics: PopularityMetrics): boolean {
  const tier = calculatePopularityTier(metrics);
  return tier === 'high' || tier === 'medium';
}

/**
 * Get save count display text (privacy-safe)
 */
export function getSaveCountDisplay(saveCount: number): string {
  if (saveCount === 0) {
    return '';
  }

  if (saveCount === 1) {
    return '1 save';
  }

  if (saveCount < 10) {
    return `${saveCount} saves`;
  }

  if (saveCount < 100) {
    return `${saveCount} saves`;
  }

  // For very high counts, round to nearest 10
  const rounded = Math.round(saveCount / 10) * 10;
  return `${rounded}+ saves`;
}

/**
 * Get view count display text (privacy-safe, aggregated)
 */
export function getViewCountDisplay(viewCount: number): string {
  if (viewCount === 0) {
    return '';
  }

  if (viewCount < 100) {
    return `${viewCount} views`;
  }

  if (viewCount < 1000) {
    const hundreds = Math.round(viewCount / 100);
    return `${hundreds}00+ views`;
  }

  // For very high counts, show in thousands
  const thousands = Math.round(viewCount / 1000);
  return `${thousands}K+ views`;
}

/**
 * Get time-based popularity label
 */
export function getTimeBasedPopularityLabel(
  recentSaveCount: number,
  recentViewCount: number
): string {
  if (recentSaveCount >= 15 || recentViewCount >= 40) {
    return 'Popular this week';
  }

  if (recentSaveCount >= 8 || recentViewCount >= 20) {
    return 'Growing this week';
  }

  return '';
}

/**
 * Get area-based popularity label
 */
export function getAreaPopularityLabel(
  saveCount: number,
  areaAverageSaves: number
): string {
  if (saveCount > areaAverageSaves * 1.5) {
    return 'Top home nearby';
  }

  if (saveCount > areaAverageSaves) {
    return 'Above average interest';
  }

  return '';
}

/**
 * Calculate popularity score for ranking (0-100)
 */
export function calculatePopularityScore(metrics: PopularityMetrics): number {
  let score = 0;

  // Recent saves (40% weight)
  // 20+ saves = 40 points
  score += Math.min(40, (metrics.recentSaveCount / 20) * 40);

  // Recent views (30% weight)
  // 50+ views = 30 points
  score += Math.min(30, (metrics.recentViewCount / 50) * 30);

  // Total saves (20% weight)
  // 100+ saves = 20 points
  score += Math.min(20, (metrics.saveCount / 100) * 20);

  // Inquiries (10% weight)
  // 5+ inquiries = 10 points
  score += Math.min(10, (metrics.inquiryCount / 5) * 10);

  return Math.round(score);
}

/**
 * Privacy-safe engagement summary for vendors
 */
export function getVendorEngagementSummary(metrics: PopularityMetrics): {
  summary: string;
  insight: string;
} {
  const tier = calculatePopularityTier(metrics);
  const saveCount = metrics.saveCount;
  const weekSaves = metrics.recentSaveCount;

  if (tier === 'high') {
    return {
      summary: `Your property is attracting strong buyer interest (${saveCount} total saves)`,
      insight: `${weekSaves} buyers saved this week — keep momentum with fresh updates`,
    };
  }

  if (tier === 'medium') {
    return {
      summary: `Your property has moderate buyer interest (${saveCount} saves)`,
      insight: 'Consider updating photos or features to increase engagement',
    };
  }

  return {
    summary: 'Your property is listed and visible to buyers',
    insight: 'Engagement metrics will appear as buyers interact with your property',
  };
}
