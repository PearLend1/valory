/**
 * Momentum calculation utility
 * Determines property momentum based on timeline activity
 */

export type MomentumLevel = 'High' | 'Rising' | 'Stable' | 'Cooling';

export interface MomentumData {
  level: MomentumLevel;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
  recentEventCount: number;
  hasOfferActivity: boolean;
}

export interface TimelineEvent {
  id?: number;
  type: string;
  timestamp: string | Date;
  details?: Record<string, any>;
}

/**
 * Calculate momentum level based on timeline events
 * 
 * Thresholds:
 * - High: 5+ events in last 7 days OR offer activity
 * - Rising: 2-4 events in last 7 days
 * - Stable: 1 event in last 14 days
 * - Cooling: No events in last 21 days
 */
export function calculateMomentum(timelineEvents: TimelineEvent[] = []): MomentumData {
  const now = Date.now();
  
  // Count events by time window
  const events7Days = timelineEvents.filter((e) => {
    const eventDate = new Date(e.timestamp).getTime();
    const daysDiff = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  });

  const events14Days = timelineEvents.filter((e) => {
    const eventDate = new Date(e.timestamp).getTime();
    const daysDiff = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));
    return daysDiff <= 14;
  });

  const events21Days = timelineEvents.filter((e) => {
    const eventDate = new Date(e.timestamp).getTime();
    const daysDiff = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));
    return daysDiff <= 21;
  });

  // Check for offer activity
  const hasOfferActivity = timelineEvents.some((e) =>
    ['offer_received', 'offer_accepted', 'under_offer'].includes(e.type)
  );

  // Determine momentum level
  let level: MomentumLevel = 'Cooling';
  
  if (events7Days.length >= 5 || hasOfferActivity) {
    level = 'High';
  } else if (events7Days.length >= 2) {
    level = 'Rising';
  } else if (events14Days.length >= 1) {
    level = 'Stable';
  } else if (events21Days.length === 0) {
    level = 'Cooling';
  }

  // Return momentum data with styling
  const momentumMap: Record<MomentumLevel, Omit<MomentumData, 'recentEventCount' | 'hasOfferActivity'>> = {
    High: {
      level: 'High',
      icon: '🔥',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      description: 'Hot property - high activity',
    },
    Rising: {
      level: 'Rising',
      icon: '📈',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      description: 'Rising interest - moderate activity',
    },
    Stable: {
      level: 'Stable',
      icon: '⏳',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      description: 'Stable - consistent interest',
    },
    Cooling: {
      level: 'Cooling',
      icon: '📉',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      description: 'Cooling - low recent activity',
    },
  };

  const baseData = momentumMap[level];
  return {
    ...baseData,
    recentEventCount: events7Days.length,
    hasOfferActivity,
  };
}

/**
 * Get momentum level from event count (simplified version for quick checks)
 */
export function getMomentumLevel(eventCount: number, hasOffers: boolean = false): MomentumLevel {
  if (eventCount >= 5 || hasOffers) return 'High';
  if (eventCount >= 2) return 'Rising';
  if (eventCount >= 1) return 'Stable';
  return 'Cooling';
}

/**
 * Format momentum description with event count
 */
export function getMomentumDescription(momentum: MomentumData): string {
  if (momentum.level === 'High' && momentum.hasOfferActivity) {
    return `${momentum.icon} ${momentum.level} - Offer activity`;
  }
  return `${momentum.icon} ${momentum.level} - ${momentum.recentEventCount} events this week`;
}
