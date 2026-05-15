/**
 * Feed Ranking Engine
 * 
 * Combines relevance scoring (based on user preferences) with momentum scoring
 * to produce a personalized "For You" feed.
 * 
 * Note: Database tables for user preferences, engagement signals, and browsing
 * history will be created in Phase 17 (Personalized Feed Ranking). Until then,
 * these functions return sensible defaults so the ranking engine can still
 * operate in a momentum-only mode.
 */

export interface FeedProperty {
  propertyId: number;
  address: string;
  price: number;
  propertyType: string;
  beds: number;
  baths: number;
  location: string;
  postcode: string;
  momentum: 'high' | 'rising' | 'stable' | 'cooling';
  relevanceScore: number;
  momentumScore: number;
  combinedScore: number;
}

export interface UserPreferenceProfile {
  locationPreferences: string[];
  priceRangeMin: number;
  priceRangeMax: number;
  propertyTypePreferences: string[];
  bedsMin: number;
  bedsMax: number;
  bathsMin: number;
  bathsMax: number;
}

/**
 * Calculate relevance score based on user preferences
 * Weights: location (30%), price (25%), property type (20%), beds/baths (15%), saved behavior (10%)
 */
export async function calculateRelevanceScore(
  userId: number,
  property: any,
  userPrefs: UserPreferenceProfile | null
): Promise<number> {
  let score = 0;

  if (!userPrefs) {
    // No preferences set, return neutral score
    return 50;
  }

  // Location matching (30%)
  const locationMatch = userPrefs.locationPreferences.some(
    (loc) => property.postcode?.startsWith(loc) || property.location?.includes(loc)
  );
  if (locationMatch) {
    score += 30;
  } else {
    score += 10; // Partial credit for discovery
  }

  // Price range matching (25%)
  if (
    property.price >= userPrefs.priceRangeMin &&
    property.price <= userPrefs.priceRangeMax
  ) {
    score += 25;
  } else if (
    property.price >= userPrefs.priceRangeMin * 0.9 &&
    property.price <= userPrefs.priceRangeMax * 1.1
  ) {
    score += 12; // Partial credit for near-range
  }

  // Property type matching (20%)
  if (userPrefs.propertyTypePreferences.includes(property.propertyType)) {
    score += 20;
  } else {
    score += 5; // Partial credit for discovery
  }

  // Beds/baths matching (15%)
  const bedsMatch = property.beds >= userPrefs.bedsMin && property.beds <= userPrefs.bedsMax;
  const bathsMatch = property.baths >= userPrefs.bathsMin && property.baths <= userPrefs.bathsMax;

  if (bedsMatch && bathsMatch) {
    score += 15;
  } else if (bedsMatch || bathsMatch) {
    score += 7;
  }

  // Saved behavior bonus (10%) - checked separately in the main ranking function

  return Math.min(100, score);
}

/**
 * Calculate momentum score (0-100)
 * Based on: recent events, viewing velocity, offer activity, fresh launches
 */
export function calculateMomentumScore(momentum: string): number {
  const momentumScores: Record<string, number> = {
    high: 100,
    rising: 75,
    stable: 50,
    cooling: 25,
  };
  return momentumScores[momentum] || 50;
}

/**
 * Get user preferences (stub until Phase 17 tables are created)
 */
export async function getUserPreferences(userId: number): Promise<UserPreferenceProfile | null> {
  // TODO: Phase 17 - query userPreferences table
  return null;
}

/**
 * Get user engagement signals (stub until Phase 17 tables are created)
 */
export async function getUserEngagementSignals(userId: number, propertyId: number): Promise<number> {
  // TODO: Phase 17 - query userEngagementSignals table
  return 0;
}

/**
 * Get user browsing history for a property (stub until Phase 17 tables are created)
 */
export async function getUserBrowsingHistory(userId: number, propertyId: number): Promise<any> {
  // TODO: Phase 17 - query userBrowsingHistory table
  return null;
}

/**
 * Main ranking function: combines relevance (70%) + momentum (30%)
 */
export async function rankPropertiesForUser(
  userId: number,
  allProperties: any[],
  limit: number = 50
): Promise<FeedProperty[]> {
  const userPrefs = await getUserPreferences(userId);

  // Score all properties
  const scoredProperties = await Promise.all(
    allProperties.map(async (prop) => {
      const relevanceScore = await calculateRelevanceScore(userId, prop, userPrefs);
      const momentumScore = calculateMomentumScore(prop.momentum);

      // Check for saved behavior bonus
      const engagementSignals = await getUserEngagementSignals(userId, prop.id);
      const browsingHistory = await getUserBrowsingHistory(userId, prop.id);

      let savedBehaviorBonus = 0;
      if (engagementSignals > 0) {
        savedBehaviorBonus = 10; // 10% bonus for engagement
      }
      if (browsingHistory) {
        savedBehaviorBonus = Math.min(10, savedBehaviorBonus + browsingHistory.viewCount * 2);
      }

      const adjustedRelevance = Math.min(100, relevanceScore + savedBehaviorBonus);

      // Combined score: 70% relevance + 30% momentum
      const combinedScore = adjustedRelevance * 0.7 + momentumScore * 0.3;

      return {
        ...prop,
        relevanceScore: adjustedRelevance,
        momentumScore,
        combinedScore,
      };
    })
  );

  // Sort by combined score (descending)
  const ranked = scoredProperties.sort((a, b) => b.combinedScore - a.combinedScore);

  // Return top N properties
  return ranked.slice(0, limit);
}

/**
 * Record user engagement signal (stub until Phase 17 tables are created)
 */
export async function recordEngagementSignal(
  userId: number,
  propertyId: number,
  signalType: 'view' | 'save' | 'click' | 'share' | 'inquiry' | 'hover',
  viewDurationSeconds?: number
): Promise<void> {
  // TODO: Phase 17 - insert into userEngagementSignals and update userBrowsingHistory
}

/**
 * Update user preferences (stub until Phase 17 tables are created)
 */
export async function updateUserPreferences(
  userId: number,
  preferences: Partial<UserPreferenceProfile>
): Promise<void> {
  // TODO: Phase 17 - upsert into userPreferences table
}
