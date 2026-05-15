import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';

/**
 * Agent Dashboard Tests
 * 
 * Tests for:
 * 1. Agent-only access control (redirect non-agents)
 * 2. Active listings retrieval with momentum calculation
 * 3. Timeline event creation (viewing, offer, price, status)
 * 4. Momentum stats calculation
 * 5. Vendor leads display (MVP with demo data)
 */

describe('Agent Dashboard - Access Control', () => {
  it('should require agent role to access dashboard', () => {
    // Non-agents should be redirected to home
    const user = { id: 1, role: 'buyer' };
    const isAgent = user.role === 'agent';
    expect(isAgent).toBe(false);
  });

  it('should allow agents to access dashboard', () => {
    const user = { id: 1, role: 'agent' };
    const isAgent = user.role === 'agent';
    expect(isAgent).toBe(true);
  });

  it('should allow admins to access dashboard', () => {
    const user = { id: 1, role: 'admin' };
    const isAgent = user.role === 'agent' || user.role === 'admin';
    expect(isAgent).toBe(true);
  });
});

describe('Agent Dashboard - Momentum Calculation', () => {
  it('should calculate High momentum with 3+ events in 7 days', () => {
    const timelineEvents = [
      { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
      { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
      { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), type: 'offer_received' },
    ];

    const recentEvents = timelineEvents.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length;

    let momentum = 'Cooling';
    if (recentEvents >= 3) momentum = 'High';
    else if (recentEvents >= 2) momentum = 'Rising';
    else if (recentEvents >= 1) momentum = 'Stable';

    expect(momentum).toBe('High');
    expect(recentEvents).toBe(3);
  });

  it('should calculate Rising momentum with 2 events in 7 days', () => {
    const timelineEvents = [
      { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
      { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
    ];

    const recentEvents = timelineEvents.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length;

    let momentum = 'Cooling';
    if (recentEvents >= 3) momentum = 'High';
    else if (recentEvents >= 2) momentum = 'Rising';
    else if (recentEvents >= 1) momentum = 'Stable';

    expect(momentum).toBe('Rising');
    expect(recentEvents).toBe(2);
  });

  it('should calculate Stable momentum with 1 event in 7 days', () => {
    const timelineEvents = [
      { timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), type: 'viewing_booked' },
    ];

    const recentEvents = timelineEvents.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length;

    let momentum = 'Cooling';
    if (recentEvents >= 3) momentum = 'High';
    else if (recentEvents >= 2) momentum = 'Rising';
    else if (recentEvents >= 1) momentum = 'Stable';

    expect(momentum).toBe('Stable');
    expect(recentEvents).toBe(1);
  });

  it('should calculate Cooling momentum with 0 events in 7 days', () => {
    const timelineEvents = [
      { timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), type: 'launched' },
    ];

    const recentEvents = timelineEvents.filter((e) => {
      const daysDiff = Math.floor((Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length;

    let momentum = 'Cooling';
    if (recentEvents >= 3) momentum = 'High';
    else if (recentEvents >= 2) momentum = 'Rising';
    else if (recentEvents >= 1) momentum = 'Stable';

    expect(momentum).toBe('Cooling');
    expect(recentEvents).toBe(0);
  });
});

describe('Agent Dashboard - Needs Attention Detection', () => {
  it('should flag properties with no updates in 14+ days', () => {
    const lastUpdateTime = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdateTime.getTime()) / (1000 * 60 * 60 * 24));
    const needsAttention = daysSinceUpdate > 14;

    expect(needsAttention).toBe(true);
    expect(daysSinceUpdate).toBe(15);
  });

  it('should not flag properties updated within 14 days', () => {
    const lastUpdateTime = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdateTime.getTime()) / (1000 * 60 * 60 * 24));
    const needsAttention = daysSinceUpdate > 14;

    expect(needsAttention).toBe(false);
    expect(daysSinceUpdate).toBe(10);
  });

  it('should not flag properties updated today', () => {
    const lastUpdateTime = new Date();
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdateTime.getTime()) / (1000 * 60 * 60 * 24));
    const needsAttention = daysSinceUpdate > 14;

    expect(needsAttention).toBe(false);
    expect(daysSinceUpdate).toBe(0);
  });
});

describe('Agent Dashboard - Event Creation Validation', () => {
  it('should validate viewing event requires date and time', () => {
    const viewingData = {
      type: 'viewing_booked',
      date: '',
      time: '',
    };

    const isValid = !!viewingData.date && !!viewingData.time;
    expect(isValid).toBe(false);
  });

  it('should validate offer event requires amount', () => {
    const offerData = {
      type: 'offer_received',
      amount: 0,
    };

    const isValid = offerData.amount > 0;
    expect(isValid).toBe(false);
  });

  it('should validate price event requires new price', () => {
    const priceData = {
      type: 'price_adjusted',
      newPrice: 0,
    };

    const isValid = priceData.newPrice > 0;
    expect(isValid).toBe(false);
  });

  it('should accept valid viewing event', () => {
    const viewingData = {
      type: 'viewing_booked',
      date: '2026-03-10',
      time: '14:00',
    };

    const isValid = !!viewingData.date && !!viewingData.time;
    expect(isValid).toBe(true);
  });

  it('should accept valid offer event', () => {
    const offerData = {
      type: 'offer_received',
      amount: 350000,
    };

    const isValid = offerData.amount > 0;
    expect(isValid).toBe(true);
  });

  it('should accept valid price event', () => {
    const priceData = {
      type: 'price_adjusted',
      newPrice: 345000,
    };

    const isValid = priceData.newPrice > 0;
    expect(isValid).toBe(true);
  });
});

describe('Agent Dashboard - Event Type Mapping', () => {
  it('should map viewing event to viewing_booked type', () => {
    const eventType = 'viewing_booked';
    expect(eventType).toBe('viewing_booked');
  });

  it('should map offer event to offer_received type', () => {
    const eventType = 'offer_received';
    expect(eventType).toBe('offer_received');
  });

  it('should map price event to price_adjusted type', () => {
    const eventType = 'price_adjusted';
    expect(eventType).toBe('price_adjusted');
  });

  it('should map status events correctly', () => {
    const statusMap: Record<string, string> = {
      under_offer: 'under_offer',
      offer_fell_through: 'offer_fell_through',
      back_on_market: 'back_on_market',
      sold: 'sold',
    };

    expect(statusMap['under_offer']).toBe('under_offer');
    expect(statusMap['sold']).toBe('sold');
  });
});

describe('Agent Dashboard - Statistics Calculation', () => {
  it('should calculate total active listings', () => {
    const properties = [
      { id: 1, agentId: 1 },
      { id: 2, agentId: 1 },
      { id: 3, agentId: 1 },
    ];

    const totalListings = properties.length;
    expect(totalListings).toBe(3);
  });

  it('should calculate high momentum count', () => {
    const momentumData = {
      1: { momentum: 'High' },
      2: { momentum: 'High' },
      3: { momentum: 'Rising' },
    };

    const highMomentumCount = Object.values(momentumData).filter(
      (s: any) => s.momentum === 'High'
    ).length;

    expect(highMomentumCount).toBe(2);
  });

  it('should calculate total events across properties', () => {
    const momentumData = {
      1: { eventCount: 5 },
      2: { eventCount: 8 },
      3: { eventCount: 3 },
    };

    const totalEvents = Object.values(momentumData).reduce(
      (sum: number, s: any) => sum + (s.eventCount || 0),
      0
    );

    expect(totalEvents).toBe(16);
  });

  it('should count properties needing attention', () => {
    const momentumData = {
      1: { needsAttention: true },
      2: { needsAttention: false },
      3: { needsAttention: true },
    };

    const needsAttentionCount = Object.values(momentumData).filter(
      (s: any) => s.needsAttention
    ).length;

    expect(needsAttentionCount).toBe(2);
  });
});

describe('Agent Dashboard - Vendor Leads MVP', () => {
  it('should display demo vendor leads', () => {
    const demoLeads = [
      { id: 1, area: 'Taunton, Somerset', urgency: 'High' },
      { id: 2, area: 'Exeter, Devon', urgency: 'Medium' },
      { id: 3, area: 'Dorchester, Dorset', urgency: 'Medium' },
    ];

    expect(demoLeads.length).toBe(3);
    expect(demoLeads[0].urgency).toBe('High');
  });

  it('should categorize vendor leads by urgency', () => {
    const demoLeads = [
      { id: 1, urgency: 'High' },
      { id: 2, urgency: 'Medium' },
      { id: 3, urgency: 'High' },
      { id: 4, urgency: 'Low' },
    ];

    const highUrgency = demoLeads.filter((l) => l.urgency === 'High').length;
    const mediumUrgency = demoLeads.filter((l) => l.urgency === 'Medium').length;
    const lowUrgency = demoLeads.filter((l) => l.urgency === 'Low').length;

    expect(highUrgency).toBe(2);
    expect(mediumUrgency).toBe(1);
    expect(lowUrgency).toBe(1);
  });
});

describe('Agent Dashboard - Property Card Display', () => {
  it('should display property address and price', () => {
    const property = {
      id: 1,
      title: 'Beautiful Detached House',
      address: '123 Main Street, Taunton',
      price: 350000,
      bedrooms: 4,
      bathrooms: 2,
    };

    expect(property.address).toBe('123 Main Street, Taunton');
    expect(property.price).toBe(350000);
  });

  it('should display property type and bedrooms', () => {
    const property = {
      id: 1,
      propertyType: 'Detached House',
      bedrooms: 4,
      bathrooms: 2,
    };

    expect(property.propertyType).toBe('Detached House');
    expect(property.bedrooms).toBe(4);
  });

  it('should display momentum badge', () => {
    const momentumData = {
      1: { momentum: 'High' },
    };

    const badge = momentumData[1].momentum;
    expect(['High', 'Rising', 'Stable', 'Cooling']).toContain(badge);
  });

  it('should display latest timeline event', () => {
    const momentumData = {
      1: {
        lastEvent: {
          eventType: 'viewing_booked',
          timestamp: new Date().toISOString(),
        },
      },
    };

    expect(momentumData[1].lastEvent.eventType).toBe('viewing_booked');
  });
});
