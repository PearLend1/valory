/**
 * Vendor-Friendly Activity Messaging
 * 
 * Provides supportive, confidence-safe language for vendor dashboards.
 * Focuses on progress and context rather than harsh rankings or comparisons.
 */

export interface VendorActivityMetrics {
  totalViews: number;
  totalSaves: number;
  viewingBookings: number;
  momentum: 'high' | 'rising' | 'stable' | 'cooling';
  daysSinceLaunch: number;
  viewsThisWeek: number;
  savesThisWeek: number;
  viewsTrendPercent: number; // -50 to +100, change from previous week
  savesTrendPercent: number;
  averageViewsPerDay: number;
  areaAverageViewsPerDay: number;
  inquiryCount: number;
  backOnMarketFlag: boolean;
}

export interface VendorActivityMessage {
  headline: string;
  subheadline: string;
  insight: string;
  tone: 'positive' | 'encouraging' | 'neutral' | 'supportive';
  actionSuggestion?: string;
}

/**
 * Generate supportive headline based on activity metrics
 */
export function getActivityHeadline(metrics: VendorActivityMetrics): string {
  const { momentum, viewsThisWeek, savesThisWeek, viewsTrendPercent, backOnMarketFlag, daysSinceLaunch } = metrics;

  if (backOnMarketFlag) {
    return 'Welcome back to the market';
  }

  if (momentum === 'high') {
    if (viewsTrendPercent > 50) {
      return 'Momentum is building fast';
    }
    return 'Strong buyer interest';
  }

  if (momentum === 'rising') {
    if (viewsTrendPercent > 30) {
      return 'Interest is picking up';
    }
    return 'Growing buyer interest';
  }

  if (momentum === 'stable') {
    if (viewsThisWeek > 10) {
      return 'Your home is getting steady attention';
    }
    return 'Your property is visible to buyers';
  }

  // Cooling momentum
  if (daysSinceLaunch < 7) {
    return 'Your property is now live';
  }

  return 'Activity is currently quieter';
}

/**
 * Generate supportive subheadline with specific metrics
 */
export function getActivitySubheadline(metrics: VendorActivityMetrics): string {
  const { totalViews, totalSaves, viewingBookings, viewsThisWeek, savesThisWeek } = metrics;

  const parts: string[] = [];

  if (viewsThisWeek > 0) {
    parts.push(`${viewsThisWeek} views this week`);
  }

  if (savesThisWeek > 0) {
    parts.push(`${savesThisWeek} saves this week`);
  }

  if (viewingBookings > 0) {
    parts.push(`${viewingBookings} viewing${viewingBookings === 1 ? '' : 's'} booked`);
  }

  if (parts.length > 0) {
    return parts.join(' • ');
  }

  if (totalViews > 0) {
    return `${totalViews} total views`;
  }

  return 'Your property is live and visible';
}

/**
 * Generate contextual insight about activity trends
 */
export function getActivityInsight(metrics: VendorActivityMetrics): string {
  const {
    momentum,
    viewsTrendPercent,
    savesTrendPercent,
    averageViewsPerDay,
    areaAverageViewsPerDay,
    daysSinceLaunch,
    viewsThisWeek,
  } = metrics;

  // Very early in listing
  if (daysSinceLaunch < 3) {
    return 'Your property was just listed. Buyer interest typically builds over the first week.';
  }

  // Positive trend
  if (viewsTrendPercent > 50 || savesTrendPercent > 50) {
    return 'Buyer interest is accelerating. Consider sharing updates to maintain momentum.';
  }

  if (viewsTrendPercent > 20) {
    return 'Activity is trending upward. This is a good sign for attracting more buyers.';
  }

  // Comparing to area average
  if (averageViewsPerDay > areaAverageViewsPerDay * 1.2) {
    return 'Your property is getting above-average attention for your area.';
  }

  if (averageViewsPerDay > areaAverageViewsPerDay * 0.8) {
    return 'Activity is in line with similar homes nearby.';
  }

  if (averageViewsPerDay > 0 && averageViewsPerDay < areaAverageViewsPerDay * 0.8) {
    return 'Interest is currently quieter than average. Refreshing photos or adding details might help attract more buyers.';
  }

  // Stable momentum
  if (momentum === 'stable' && viewsThisWeek > 5) {
    return 'Your property is getting consistent attention from buyers.';
  }

  // Cooling but not discouraging
  if (momentum === 'cooling' && daysSinceLaunch > 14) {
    return 'Activity has been quieter recently. Consider updating your listing or adjusting the price to reignite interest.';
  }

  return 'Your property is visible to buyers in your area.';
}

/**
 * Generate action suggestion based on activity state
 */
export function getActivityActionSuggestion(metrics: VendorActivityMetrics): string | undefined {
  const { momentum, viewsThisWeek, totalSaves, daysSinceLaunch, viewingBookings } = metrics;

  // High momentum - maintain
  if (momentum === 'high') {
    return 'Keep momentum going by responding quickly to inquiries and maintaining fresh photos.';
  }

  // Rising - encourage action
  if (momentum === 'rising') {
    return 'Interest is growing. Consider scheduling viewings soon to capitalize on buyer interest.';
  }

  // Stable with good bookings
  if (momentum === 'stable' && viewingBookings > 0) {
    return 'You have viewing interest. Make sure your home shows well to convert interest into offers.';
  }

  // Cooling - suggest refresh
  if (momentum === 'cooling' && daysSinceLaunch > 21) {
    return 'Consider refreshing your listing with new photos or details to attract fresh buyer attention.';
  }

  // Early stage - encourage patience
  if (daysSinceLaunch < 7 && viewsThisWeek < 5) {
    return 'Your property is now live. Buyer interest typically builds over the first 1-2 weeks.';
  }

  return undefined;
}

/**
 * Generate full activity message
 */
export function getVendorActivityMessage(metrics: VendorActivityMetrics): VendorActivityMessage {
  const headline = getActivityHeadline(metrics);
  const subheadline = getActivitySubheadline(metrics);
  const insight = getActivityInsight(metrics);
  const actionSuggestion = getActivityActionSuggestion(metrics);

  // Determine tone
  let tone: 'positive' | 'encouraging' | 'neutral' | 'supportive' = 'neutral';
  if (metrics.momentum === 'high') {
    tone = 'positive';
  } else if (metrics.momentum === 'rising' || metrics.viewsTrendPercent > 20) {
    tone = 'encouraging';
  } else if (metrics.momentum === 'cooling' || metrics.viewsThisWeek === 0) {
    tone = 'supportive';
  }

  return {
    headline,
    subheadline,
    insight,
    tone,
    actionSuggestion,
  };
}

/**
 * Generate comparison context (soft, not competitive)
 */
export function getComparisonContext(
  vendorMetric: number,
  areaMetric: number,
  metricName: string
): string {
  const ratio = vendorMetric / areaMetric;

  if (ratio > 1.5) {
    return `Your ${metricName} are significantly above average for your area.`;
  }

  if (ratio > 1.2) {
    return `Your ${metricName} are above average for your area.`;
  }

  if (ratio > 0.8) {
    return `Your ${metricName} are in line with similar homes nearby.`;
  }

  if (ratio > 0.5) {
    return `Your ${metricName} are below average for your area. Consider updates to attract more interest.`;
  }

  return `Your ${metricName} are significantly below average. Refreshing your listing might help.`;
}

/**
 * Generate trend description
 */
export function getTrendDescription(trendPercent: number, metricName: string): string {
  if (trendPercent > 100) {
    return `${metricName} have more than doubled this week.`;
  }

  if (trendPercent > 50) {
    return `${metricName} have increased significantly this week.`;
  }

  if (trendPercent > 20) {
    return `${metricName} are trending upward this week.`;
  }

  if (trendPercent > 0) {
    return `${metricName} have increased slightly this week.`;
  }

  if (trendPercent > -20) {
    return `${metricName} are relatively stable this week.`;
  }

  if (trendPercent > -50) {
    return `${metricName} have decreased this week. This is normal after the initial launch period.`;
  }

  return `${metricName} have decreased significantly. Consider refreshing your listing.`;
}

/**
 * Generate momentum explanation
 */
export function getMomentumExplanation(momentum: 'high' | 'rising' | 'stable' | 'cooling'): string {
  switch (momentum) {
    case 'high':
      return 'Your property is attracting strong, recent buyer interest with multiple views and saves this week.';
    case 'rising':
      return 'Buyer interest is growing. You\'re seeing more views and saves compared to previous weeks.';
    case 'stable':
      return 'Your property is getting consistent attention from buyers at a steady pace.';
    case 'cooling':
      return 'Interest has slowed compared to earlier in the listing period. This is common as initial buyer attention naturally decreases.';
  }
}

/**
 * Generate viewing booking encouragement
 */
export function getViewingBookingMessage(bookings: number, totalViews: number): string {
  if (bookings === 0 && totalViews > 10) {
    return 'You have buyer interest but no viewings booked yet. Consider reaching out to interested buyers or adjusting your showing availability.';
  }

  if (bookings > 0) {
    const conversionRate = Math.round((bookings / totalViews) * 100);
    if (conversionRate > 10) {
      return `Great conversion rate! ${bookings} of your viewers have booked viewings.`;
    }
    return `${bookings} buyer${bookings === 1 ? '' : 's'} have booked viewings. Keep showing your home to find the right buyer.`;
  }

  return '';
}

/**
 * Generate inquiry encouragement
 */
export function getInquiryMessage(inquiries: number, totalViews: number): string {
  if (inquiries === 0) {
    return '';
  }

  if (inquiries === 1) {
    return 'You have 1 inquiry from an interested buyer.';
  }

  const inquiryRate = Math.round((inquiries / totalViews) * 100);
  return `You have ${inquiries} inquiries. A ${inquiryRate}% inquiry rate shows genuine buyer interest.`;
}
