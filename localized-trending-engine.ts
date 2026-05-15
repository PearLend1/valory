/**
 * Localized Trending Engine
 * 
 * Calculates trending properties based on user's area and preferences
 * rather than platform-wide activity. Answers: "What's moving in my area?"
 */

export interface LocalizedTrendingConfig {
  userAreas: string[]; // postcodes or areas user is searching
  priceRangeMin: number;
  priceRangeMax: number;
  propertyTypes: string[];
  bedsMin: number;
  bedsMax: number;
  bathsMin: number;
  bathsMax: number;
}

export interface TrendingProperty {
  propertyId: number;
  address: string;
  price: number;
  propertyType: string;
  beds: number;
  baths: number;
  location: string;
  postcode: string;
  momentum: 'high' | 'rising' | 'stable' | 'cooling';
  trendingScore: number;
  recentActivityCount: number;
  viewingVelocity: number;
  lastEventType: string;
  lastEventTime: Date;
  isBackOnMarket: boolean;
  isFreshLaunch: boolean;
}

/**
 * Calculate trending score based on momentum signals
 * Weights:
 * - Recent timeline activity (35%)
 * - Viewing velocity (25%)
 * - Offer/status changes (20%)
 * - Fresh launches (15%)
 * - Back-on-market events (5%)
 */
export function calculateTrendingScore(
  recentActivityCount: number,
  viewingVelocity: number,
  hasOfferActivity: boolean,
  isFreshLaunch: boolean,
  isBackOnMarket: boolean,
  daysSinceLaunch: number
): number {
  let score = 0;

  // Recent timeline activity (35%) - cap at 7 days
  // 5+ events in 7 days = 35 points
  const activityScore = Math.min(35, (recentActivityCount / 5) * 35);
  score += activityScore;

  // Viewing velocity (25%)
  // High velocity (3+ views per day) = 25 points
  const velocityScore = Math.min(25, (viewingVelocity / 3) * 25);
  score += velocityScore;

  // Offer/status changes (20%)
  if (hasOfferActivity) {
    score += 20;
  }

  // Fresh launches (15%)
  // Launched in last 3 days = 15 points, decays over time
  if (isFreshLaunch && daysSinceLaunch <= 3) {
    const freshBonus = 15 * (1 - daysSinceLaunch / 3);
    score += freshBonus;
  }

  // Back-on-market events (5%)
  if (isBackOnMarket) {
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * Check if property matches user preferences
 */
export function propertyMatchesPreferences(
  property: any,
  config: LocalizedTrendingConfig
): boolean {
  // Check area match
  const areaMatch = config.userAreas.some(
    (area) => property.postcode?.startsWith(area) || property.location?.includes(area)
  );
  if (!areaMatch) return false;

  // Check price range
  if (property.price < config.priceRangeMin || property.price > config.priceRangeMax) {
    return false;
  }

  // Check property type
  if (config.propertyTypes.length > 0 && !config.propertyTypes.includes(property.propertyType)) {
    return false;
  }

  // Check beds/baths
  if (property.beds < config.bedsMin || property.beds > config.bedsMax) {
    return false;
  }
  if (property.baths < config.bathsMin || property.baths > config.bathsMax) {
    return false;
  }

  return true;
}

/**
 * Calculate viewing velocity (views per day over last 7 days)
 */
export function calculateViewingVelocity(
  viewCount: number,
  daysSinceLaunch: number
): number {
  if (daysSinceLaunch === 0) return 0;
  return viewCount / Math.min(daysSinceLaunch, 7);
}

/**
 * Detect if property has offer activity in last 7 days
 */
export function hasRecentOfferActivity(timelineEvents: any[]): boolean {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return timelineEvents.some(
    (event) =>
      (event.eventType === 'OFFER_RECEIVED' ||
        event.eventType === 'OFFER_FELL_THROUGH' ||
        event.eventType === 'BACK_ON_MARKET' ||
        event.eventType === 'SOLD') &&
      new Date(event.timestamp) > sevenDaysAgo
  );
}

/**
 * Detect if property is a fresh launch (launched in last 3 days)
 */
export function isFreshLaunch(timelineEvents: any[]): boolean {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  return timelineEvents.some(
    (event) => event.eventType === 'LAUNCHED' && new Date(event.timestamp) > threeDaysAgo
  );
}

/**
 * Detect if property is back on market (relisted after offer fell through)
 */
export function isBackOnMarket(timelineEvents: any[]): boolean {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return timelineEvents.some(
    (event) => event.eventType === 'BACK_ON_MARKET' && new Date(event.timestamp) > sevenDaysAgo
  );
}

/**
 * Get most recent event type
 */
export function getMostRecentEventType(timelineEvents: any[]): string {
  if (timelineEvents.length === 0) return 'UNKNOWN';
  return timelineEvents[0]?.eventType || 'UNKNOWN';
}

/**
 * Get most recent event time
 */
export function getMostRecentEventTime(timelineEvents: any[]): Date {
  if (timelineEvents.length === 0) return new Date();
  return new Date(timelineEvents[0]?.timestamp || new Date());
}

/**
 * Calculate days since launch
 */
export function getDaysSinceLaunch(timelineEvents: any[]): number {
  const launchEvent = timelineEvents.find((e) => e.eventType === 'LAUNCHED');
  if (!launchEvent) return 999;
  const launchDate = new Date(launchEvent.timestamp);
  const now = new Date();
  return Math.floor((now.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Count recent timeline activity (last 7 days)
 */
export function countRecentActivity(timelineEvents: any[]): number {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return timelineEvents.filter((event) => new Date(event.timestamp) > sevenDaysAgo).length;
}

/**
 * Main function: rank properties for localized trending
 */
export function rankLocalizedTrending(
  properties: any[],
  config: LocalizedTrendingConfig,
  limit: number = 50
): TrendingProperty[] {
  // Filter to matching properties
  const matchingProperties = properties.filter((p) => propertyMatchesPreferences(p, config));

  // Score and rank
  const scoredProperties = matchingProperties.map((property) => {
    const recentActivityCount = countRecentActivity(property.timelineEvents || []);
    const daysSinceLaunch = getDaysSinceLaunch(property.timelineEvents || []);
    const viewingVelocity = calculateViewingVelocity(property.viewCount || 0, daysSinceLaunch);
    const hasOfferActivity = hasRecentOfferActivity(property.timelineEvents || []);
    const fresh = isFreshLaunch(property.timelineEvents || []);
    const backOnMarket = isBackOnMarket(property.timelineEvents || []);

    const trendingScore = calculateTrendingScore(
      recentActivityCount,
      viewingVelocity,
      hasOfferActivity,
      fresh,
      backOnMarket,
      daysSinceLaunch
    );

    return {
      propertyId: property.id,
      address: property.address,
      price: property.price,
      propertyType: property.propertyType,
      beds: property.beds,
      baths: property.baths,
      location: property.location,
      postcode: property.postcode,
      momentum: property.momentum,
      trendingScore,
      recentActivityCount,
      viewingVelocity,
      lastEventType: getMostRecentEventType(property.timelineEvents || []),
      lastEventTime: getMostRecentEventTime(property.timelineEvents || []),
      isBackOnMarket: backOnMarket,
      isFreshLaunch: fresh,
    };
  });

  // Sort by trending score (descending)
  const ranked = scoredProperties.sort((a, b) => b.trendingScore - a.trendingScore);

  // Return top N
  return ranked.slice(0, limit);
}
