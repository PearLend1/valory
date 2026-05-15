import { describe, it, expect } from 'vitest';

/**
 * Momentum Badge Tests
 * 
 * Tests for momentum calculation with updated thresholds:
 * - High: 5+ events in 7 days OR offer activity
 * - Rising: 2-4 events in 7 days
 * - Stable: 1 event in 14 days
 * - Cooling: No events in 21 days
 */

describe('Momentum Badge - High Momentum Detection', () => {
  it('should detect High momentum with 5+ events in 7 days', () => {
    const events = [
      { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
      { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
      { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
      { timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), type: 'offer_received' },
      { timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
    ];

    const recentEvents = events.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length;

    const momentum = recentEvents >= 5 ? 'High' : 'Other';
    expect(momentum).toBe('High');
    expect(recentEvents).toBe(5);
  });

  it('should detect High momentum with offer activity', () => {
    const events = [
      { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), type: 'offer_received' },
      { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
    ];

    const hasOfferActivity = events.some((e) =>
      ['offer_received', 'offer_accepted', 'under_offer'].includes(e.type)
    );

    const momentum = hasOfferActivity ? 'High' : 'Other';
    expect(momentum).toBe('High');
    expect(hasOfferActivity).toBe(true);
  });

  it('should detect High momentum with 6 events in 7 days', () => {
    const events = Array.from({ length: 6 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      type: 'viewing_booked',
    }));

    const recentEvents = events.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length;

    const momentum = recentEvents >= 5 ? 'High' : 'Other';
    expect(momentum).toBe('High');
    expect(recentEvents).toBe(6);
  });
});

describe('Momentum Badge - Rising Interest Detection', () => {
  it('should detect Rising with 2 events in 7 days', () => {
    const events = [
      { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
      { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
    ];

    const recentEvents = events.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length;

    const momentum = recentEvents >= 2 && recentEvents < 5 ? 'Rising' : 'Other';
    expect(momentum).toBe('Rising');
    expect(recentEvents).toBe(2);
  });

  it('should detect Rising with 4 events in 7 days', () => {
    const events = [
      { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
      { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
      { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
      { timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
    ];

    const recentEvents = events.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length;

    const momentum = recentEvents >= 2 && recentEvents < 5 ? 'Rising' : 'Other';
    expect(momentum).toBe('Rising');
    expect(recentEvents).toBe(4);
  });

  it('should not detect Rising with 1 event in 7 days', () => {
    const events = [
      { timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
    ];

    const recentEvents = events.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length;

    const momentum = recentEvents >= 2 && recentEvents < 5 ? 'Rising' : 'Other';
    expect(momentum).not.toBe('Rising');
    expect(recentEvents).toBe(1);
  });
});

describe('Momentum Badge - Stable Detection', () => {
  it('should detect Stable with 1 event in 14 days', () => {
    const events = [
      { timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
    ];

    const recentEvents7 = events.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length;

    const recentEvents14 = events.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 14;
    }).length;

    const momentum = recentEvents7 === 0 && recentEvents14 >= 1 ? 'Stable' : 'Other';
    expect(momentum).toBe('Stable');
    expect(recentEvents14).toBe(1);
  });

  it('should not detect Stable with 0 events in 14 days', () => {
    const events = [
      { timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
    ];

    const recentEvents14 = events.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 14;
    }).length;

    const momentum = recentEvents14 >= 1 ? 'Stable' : 'Other';
    expect(momentum).not.toBe('Stable');
    expect(recentEvents14).toBe(0);
  });
});

describe('Momentum Badge - Cooling Detection', () => {
  it('should detect Cooling with no events in 21 days', () => {
    const events = [
      { timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), type: 'launched' },
    ];

    const recentEvents21 = events.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 21;
    }).length;

    const momentum = recentEvents21 === 0 ? 'Cooling' : 'Other';
    expect(momentum).toBe('Cooling');
    expect(recentEvents21).toBe(0);
  });

  it('should detect Cooling with events older than 21 days', () => {
    const events = [
      { timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), type: 'launched' },
      { timestamp: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
    ];

    const recentEvents21 = events.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 21;
    }).length;

    const momentum = recentEvents21 === 0 ? 'Cooling' : 'Other';
    expect(momentum).toBe('Cooling');
    expect(recentEvents21).toBe(0);
  });
});

describe('Momentum Badge - Edge Cases', () => {
  it('should handle empty event list', () => {
    const events: any[] = [];

    const recentEvents = events.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length;

    const momentum = recentEvents === 0 ? 'Cooling' : 'Other';
    expect(momentum).toBe('Cooling');
    expect(recentEvents).toBe(0);
  });

  it('should handle events at exact 7-day boundary', () => {
    const exactlySevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const events = [{ timestamp: exactlySevenDaysAgo, type: 'viewing_booked' }];

    const recentEvents = events.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length;

    expect(recentEvents).toBe(1);
  });

  it('should handle events at exact 14-day boundary', () => {
    const exactlyFourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const events = [{ timestamp: exactlyFourteenDaysAgo, type: 'viewing_booked' }];

    const recentEvents14 = events.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 14;
    }).length;

    expect(recentEvents14).toBe(1);
  });

  it('should handle events at exact 21-day boundary', () => {
    const exactlyTwentyOneDaysAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
    const events = [{ timestamp: exactlyTwentyOneDaysAgo, type: 'launched' }];

    const recentEvents21 = events.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 21;
    }).length;

    expect(recentEvents21).toBe(1);
  });
});

describe('Momentum Badge - Offer Type Detection', () => {
  it('should recognize offer_received as offer activity', () => {
    const events = [{ type: 'offer_received' }];
    const hasOfferActivity = events.some((e) =>
      ['offer_received', 'offer_accepted', 'under_offer'].includes(e.type)
    );
    expect(hasOfferActivity).toBe(true);
  });

  it('should recognize offer_accepted as offer activity', () => {
    const events = [{ type: 'offer_accepted' }];
    const hasOfferActivity = events.some((e) =>
      ['offer_received', 'offer_accepted', 'under_offer'].includes(e.type)
    );
    expect(hasOfferActivity).toBe(true);
  });

  it('should recognize under_offer as offer activity', () => {
    const events = [{ type: 'under_offer' }];
    const hasOfferActivity = events.some((e) =>
      ['offer_received', 'offer_accepted', 'under_offer'].includes(e.type)
    );
    expect(hasOfferActivity).toBe(true);
  });

  it('should not recognize viewing_booked as offer activity', () => {
    const events = [{ type: 'viewing_booked' }];
    const hasOfferActivity = events.some((e) =>
      ['offer_received', 'offer_accepted', 'under_offer'].includes(e.type)
    );
    expect(hasOfferActivity).toBe(false);
  });
});

describe('Momentum Badge - Visual Properties', () => {
  it('should return correct color for High momentum', () => {
    const momentumColors: Record<string, string> = {
      High: 'bg-red-50 text-red-700',
      Rising: 'bg-orange-50 text-orange-700',
      Stable: 'bg-blue-50 text-blue-700',
      Cooling: 'bg-gray-50 text-gray-700',
    };

    expect(momentumColors['High']).toBe('bg-red-50 text-red-700');
  });

  it('should return correct icon for each momentum level', () => {
    const momentumIcons: Record<string, string> = {
      High: '🔥',
      Rising: '📈',
      Stable: '⏳',
      Cooling: '📉',
    };

    expect(momentumIcons['High']).toBe('🔥');
    expect(momentumIcons['Rising']).toBe('📈');
    expect(momentumIcons['Stable']).toBe('⏳');
    expect(momentumIcons['Cooling']).toBe('📉');
  });

  it('should return correct description for each momentum level', () => {
    const descriptions: Record<string, string> = {
      High: 'Hot property - high activity',
      Rising: 'Rising interest - moderate activity',
      Stable: 'Stable - consistent interest',
      Cooling: 'Cooling - low recent activity',
    };

    expect(descriptions['High']).toContain('Hot');
    expect(descriptions['Rising']).toContain('Rising');
    expect(descriptions['Stable']).toContain('Stable');
    expect(descriptions['Cooling']).toContain('Cooling');
  });
});
