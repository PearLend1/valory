/**
 * Vendor Feedback Summary System
 * 
 * Transforms raw post-viewing feedback into soft, aggregated summaries
 * that help vendors understand market response without harsh language.
 * 
 * Principles:
 * - Only use verified viewer feedback
 * - Present patterns and aggregates, never individual comments
 * - Use constructive, calm language
 * - Avoid buyer identities and harsh wording
 * - Position as market insight, not criticism
 */

export interface ViewingFeedback {
  expectationMatch: 'exceeded' | 'matched' | 'below';
  interestLevel: 'very_interested' | 'somewhat_interested' | 'not_interested';
  standoutFeatures: string[];
  comment?: string;
}

export interface FeedbackSummary {
  totalFeedback: number;
  expectationsSummary: string;
  interestSummary: string;
  standoutFeatures: string[];
  pricingFeedback?: string;
  layoutFeedback?: string;
  keyInsights: string[];
  recommendedActions?: string[];
}

/**
 * Generate soft expectation summary from feedback
 */
export function generateExpectationsSummary(feedback: ViewingFeedback[]): string {
  if (feedback.length === 0) return '';

  const exceeded = feedback.filter(f => f.expectationMatch === 'exceeded').length;
  const matched = feedback.filter(f => f.expectationMatch === 'matched').length;
  const below = feedback.filter(f => f.expectationMatch === 'below').length;

  const total = feedback.length;
  const exceededPct = Math.round((exceeded / total) * 100);
  const matchedPct = Math.round((matched / total) * 100);
  const belowPct = Math.round((below / total) * 100);

  // Soft language patterns
  if (exceededPct >= 60) {
    return 'Most viewers felt the home exceeded their expectations';
  }
  if (matchedPct >= 60) {
    return 'Most viewers felt the home matched their expectations';
  }
  if (exceededPct + matchedPct >= 70) {
    return 'The majority of viewers felt the home met or exceeded their expectations';
  }
  if (belowPct >= 50) {
    return 'Some viewers felt the home was slightly below their initial expectations';
  }
  if (belowPct >= 30) {
    return 'Feedback was mixed on how the home compared to expectations';
  }

  return 'Viewers had varied reactions to how the home compared to their expectations';
}

/**
 * Generate soft interest summary from feedback
 */
export function generateInterestSummary(feedback: ViewingFeedback[]): string {
  if (feedback.length === 0) return '';

  const veryInterested = feedback.filter(f => f.interestLevel === 'very_interested').length;
  const somewhateInterested = feedback.filter(f => f.interestLevel === 'somewhat_interested').length;
  const notInterested = feedback.filter(f => f.interestLevel === 'not_interested').length;

  const total = feedback.length;
  const veryPct = Math.round((veryInterested / total) * 100);
  const somewhatPct = Math.round((somewhateInterested / total) * 100);
  const notPct = Math.round((notInterested / total) * 100);

  // Soft language patterns
  if (veryPct >= 70) {
    return 'Interest was strong after viewings';
  }
  if (veryPct >= 50) {
    return 'Most viewers showed strong interest in the property';
  }
  if (veryPct + somewhatPct >= 80) {
    return 'Viewers generally showed positive interest in the property';
  }
  if (notPct >= 50) {
    return 'Interest levels were lower than average';
  }
  if (notPct >= 30) {
    return 'Feedback on interest was mixed';
  }

  return 'Viewers had varied levels of interest in the property';
}

/**
 * Extract standout features from feedback
 */
export function extractStandoutFeatures(feedback: ViewingFeedback[]): string[] {
  const featureCount: Record<string, number> = {};

  feedback.forEach(f => {
    f.standoutFeatures.forEach(feature => {
      featureCount[feature] = (featureCount[feature] || 0) + 1;
    });
  });

  // Return features mentioned by at least 20% of viewers
  const threshold = Math.max(1, Math.ceil(feedback.length * 0.2));
  return Object.entries(featureCount)
    .filter(([_, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([feature]) => feature)
    .slice(0, 5); // Top 5 features
}

/**
 * Detect pricing sentiment from comments
 */
export function detectPricingSentiment(feedback: ViewingFeedback[]): string | undefined {
  const pricingComments = feedback
    .filter(f => f.comment && f.comment.toLowerCase().includes('price'))
    .map(f => f.comment || '');

  if (pricingComments.length === 0) return undefined;

  const ambitious = pricingComments.filter(c =>
    c.toLowerCase().includes('ambitious') ||
    c.toLowerCase().includes('high') ||
    c.toLowerCase().includes('expensive')
  ).length;

  const reasonable = pricingComments.filter(c =>
    c.toLowerCase().includes('reasonable') ||
    c.toLowerCase().includes('fair') ||
    c.toLowerCase().includes('good value')
  ).length;

  if (ambitious > reasonable * 2) {
    return 'Some viewers felt pricing may be slightly ambitious for the current market';
  }
  if (reasonable > ambitious * 2) {
    return 'Viewers felt the pricing was reasonable and fair';
  }
  if (ambitious > 0 || reasonable > 0) {
    return 'Feedback on pricing was mixed';
  }

  return undefined;
}

/**
 * Detect layout sentiment from comments
 */
export function detectLayoutSentiment(feedback: ViewingFeedback[]): string | undefined {
  const layoutComments = feedback
    .filter(f => f.comment && f.comment.toLowerCase().includes('layout'))
    .map(f => f.comment || '');

  if (layoutComments.length === 0) return undefined;

  const positive = layoutComments.filter(c =>
    c.toLowerCase().includes('great') ||
    c.toLowerCase().includes('excellent') ||
    c.toLowerCase().includes('flows well')
  ).length;

  const negative = layoutComments.filter(c =>
    c.toLowerCase().includes('awkward') ||
    c.toLowerCase().includes('cramped') ||
    c.toLowerCase().includes('doesn\'t flow')
  ).length;

  if (positive > negative * 2) {
    return 'Viewers responded positively to the layout and flow';
  }
  if (negative > positive * 2) {
    return 'Some viewers found the layout could be improved';
  }
  if (positive > 0 || negative > 0) {
    return 'Feedback on layout was mixed';
  }

  return undefined;
}

/**
 * Generate key insights from feedback
 */
export function generateKeyInsights(feedback: ViewingFeedback[]): string[] {
  const insights: string[] = [];

  if (feedback.length === 0) return insights;

  // Standout features insight
  const features = extractStandoutFeatures(feedback);
  if (features.length > 0) {
    const featureList = features.slice(0, 3).join(', ');
    insights.push(`Buyers responded well to the ${featureList}`);
  }

  // Interest insight
  const veryInterested = feedback.filter(f => f.interestLevel === 'very_interested').length;
  if (veryInterested / feedback.length >= 0.6) {
    insights.push('Strong buyer interest suggests good market fit');
  }

  // Expectation insight
  const exceeded = feedback.filter(f => f.expectationMatch === 'exceeded').length;
  if (exceeded / feedback.length >= 0.5) {
    insights.push('The property is exceeding buyer expectations, which is positive');
  }

  // Pricing insight
  const pricingSentiment = detectPricingSentiment(feedback);
  if (pricingSentiment) {
    insights.push(pricingSentiment);
  }

  return insights;
}

/**
 * Generate recommended actions based on feedback
 */
export function generateRecommendedActions(feedback: ViewingFeedback[]): string[] {
  const actions: string[] = [];

  if (feedback.length === 0) return actions;

  // Low interest action
  const veryInterested = feedback.filter(f => f.interestLevel === 'very_interested').length;
  if (veryInterested / feedback.length < 0.4) {
    actions.push('Consider refreshing marketing materials or adjusting strategy');
  }

  // Pricing action
  const pricingSentiment = detectPricingSentiment(feedback);
  if (pricingSentiment && pricingSentiment.includes('ambitious')) {
    actions.push('You may want to discuss pricing strategy with your agent');
  }

  // Layout action
  const layoutSentiment = detectLayoutSentiment(feedback);
  if (layoutSentiment && layoutSentiment.includes('improved')) {
    actions.push('Consider highlighting alternative uses or layout benefits in marketing');
  }

  return actions;
}

/**
 * Generate complete vendor feedback summary
 */
export function generateVendorFeedbackSummary(feedback: ViewingFeedback[]): FeedbackSummary {
  return {
    totalFeedback: feedback.length,
    expectationsSummary: generateExpectationsSummary(feedback),
    interestSummary: generateInterestSummary(feedback),
    standoutFeatures: extractStandoutFeatures(feedback),
    pricingFeedback: detectPricingSentiment(feedback),
    layoutFeedback: detectLayoutSentiment(feedback),
    keyInsights: generateKeyInsights(feedback),
    recommendedActions: generateRecommendedActions(feedback),
  };
}
