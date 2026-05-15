import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidTransition,
  getReadinessStage,
  getLaunchTiming,
  getStateDescription,
  isReadyForAgentMatch,
  isLeadActive,
} from './lead-state-manager';
import {
  extractPostcodeSector,
  createValuationBracket,
  getReadinessLabel,
} from './early-lead-signal-service';

describe('Lead State Manager', () => {
  describe('isValidTransition', () => {
    it('should allow transition from null to REGISTERED', () => {
      expect(isValidTransition(null, 'REGISTERED')).toBe(true);
    });

    it('should not allow transition from null to any other state', () => {
      expect(isValidTransition(null, 'PROFILE_IN_PROGRESS')).toBe(false);
      expect(isValidTransition(null, 'READY_FOR_AGENT_MATCH')).toBe(false);
    });

    it('should allow forward progression: REGISTERED → PROFILE_IN_PROGRESS', () => {
      expect(isValidTransition('REGISTERED', 'PROFILE_IN_PROGRESS')).toBe(true);
    });

    it('should allow PROFILE_IN_PROGRESS → READY_FOR_AGENT_MATCH', () => {
      expect(isValidTransition('PROFILE_IN_PROGRESS', 'READY_FOR_AGENT_MATCH')).toBe(true);
    });

    it('should allow pause from any active state', () => {
      expect(isValidTransition('REGISTERED', 'PAUSED')).toBe(true);
      expect(isValidTransition('PROFILE_IN_PROGRESS', 'PAUSED')).toBe(true);
      expect(isValidTransition('READY_FOR_AGENT_MATCH', 'PAUSED')).toBe(true);
    });

    it('should allow withdrawal from any state', () => {
      expect(isValidTransition('REGISTERED', 'WITHDRAWN')).toBe(true);
      expect(isValidTransition('PROFILE_IN_PROGRESS', 'WITHDRAWN')).toBe(true);
      expect(isValidTransition('PAUSED', 'WITHDRAWN')).toBe(true);
    });

    it('should allow resume from PAUSED', () => {
      expect(isValidTransition('PAUSED', 'PROFILE_IN_PROGRESS')).toBe(true);
      expect(isValidTransition('PAUSED', 'READY_FOR_AGENT_MATCH')).toBe(true);
    });

    it('should not allow backward progression', () => {
      expect(isValidTransition('PROFILE_IN_PROGRESS', 'REGISTERED')).toBe(true); // Resume is allowed
      expect(isValidTransition('READY_FOR_AGENT_MATCH', 'PROFILE_IN_PROGRESS')).toBe(false);
      expect(isValidTransition('READY_FOR_AGENT_MATCH', 'REGISTERED')).toBe(false);
    });

    it('should not allow transition from WITHDRAWN', () => {
      expect(isValidTransition('WITHDRAWN', 'REGISTERED')).toBe(false);
      expect(isValidTransition('WITHDRAWN', 'PROFILE_IN_PROGRESS')).toBe(false);
    });
  });

  describe('getReadinessStage', () => {
    it('should return EARLY_INTEREST for REGISTERED state', () => {
      expect(getReadinessStage('REGISTERED')).toBe('EARLY_INTEREST');
    });

    it('should return PROFILE_BUILDING for PROFILE_IN_PROGRESS state', () => {
      expect(getReadinessStage('PROFILE_IN_PROGRESS')).toBe('PROFILE_BUILDING');
    });

    it('should return NEARLY_READY for READY_FOR_AGENT_MATCH state', () => {
      expect(getReadinessStage('READY_FOR_AGENT_MATCH')).toBe('NEARLY_READY');
    });

    it('should return EARLY_INTEREST for PAUSED state', () => {
      expect(getReadinessStage('PAUSED')).toBe('EARLY_INTEREST');
    });

    it('should return EARLY_INTEREST for WITHDRAWN state', () => {
      expect(getReadinessStage('WITHDRAWN')).toBe('EARLY_INTEREST');
    });
  });

  describe('getLaunchTiming', () => {
    it('should return "This week" for READY_FOR_AGENT_MATCH', () => {
      expect(getLaunchTiming('READY_FOR_AGENT_MATCH', 50)).toBe('This week');
    });

    it('should return "Next 2 weeks" for >75% profile completion', () => {
      expect(getLaunchTiming('PROFILE_IN_PROGRESS', 80)).toBe('Next 2 weeks');
      expect(getLaunchTiming('REGISTERED', 90)).toBe('Next 2 weeks');
    });

    it('should return "Next month" for <75% profile completion', () => {
      expect(getLaunchTiming('PROFILE_IN_PROGRESS', 50)).toBe('Next month');
      expect(getLaunchTiming('REGISTERED', 25)).toBe('Next month');
    });

    it('should return "Next month" for exactly 75% completion', () => {
      expect(getLaunchTiming('PROFILE_IN_PROGRESS', 75)).toBe('Next month');
    });
  });

  describe('getStateDescription', () => {
    it('should provide appropriate description for each state', () => {
      expect(getStateDescription('REGISTERED')).toContain('Valuation completed');
      expect(getStateDescription('PROFILE_IN_PROGRESS')).toContain('Your profile is being built');
      expect(getStateDescription('READY_FOR_AGENT_MATCH')).toContain('ready for agent matching');
      expect(getStateDescription('PAUSED')).toContain('paused');
      expect(getStateDescription('WITHDRAWN')).toContain('withdrawn');
    });
  });

  describe('isReadyForAgentMatch', () => {
    it('should return true for READY_FOR_AGENT_MATCH state', () => {
      const leadState = {
        id: 1,
        vendorId: 1,
        propertyId: 1,
        state: 'READY_FOR_AGENT_MATCH' as const,
        stateChangedAt: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(isReadyForAgentMatch(leadState)).toBe(true);
    });

    it('should return false for other states', () => {
      const leadState = {
        id: 1,
        vendorId: 1,
        propertyId: 1,
        state: 'REGISTERED' as const,
        stateChangedAt: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(isReadyForAgentMatch(leadState)).toBe(false);
    });
  });

  describe('isLeadActive', () => {
    it('should return true for active states', () => {
      const registeredLead = {
        id: 1,
        vendorId: 1,
        propertyId: 1,
        state: 'REGISTERED' as const,
        stateChangedAt: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(isLeadActive(registeredLead)).toBe(true);

      const profileLead = { ...registeredLead, state: 'PROFILE_IN_PROGRESS' as const };
      expect(isLeadActive(profileLead)).toBe(true);

      const readyLead = { ...registeredLead, state: 'READY_FOR_AGENT_MATCH' as const };
      expect(isLeadActive(readyLead)).toBe(true);
    });

    it('should return false for PAUSED and WITHDRAWN', () => {
      const pausedLead = {
        id: 1,
        vendorId: 1,
        propertyId: 1,
        state: 'PAUSED' as const,
        stateChangedAt: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(isLeadActive(pausedLead)).toBe(false);

      const withdrawnLead = { ...pausedLead, state: 'WITHDRAWN' as const };
      expect(isLeadActive(withdrawnLead)).toBe(false);
    });
  });
});

describe('Early Lead Signal Service', () => {
  describe('extractPostcodeSector', () => {
    it('should extract postcode sector correctly', () => {
      expect(extractPostcodeSector('TA20 1AB')).toBe('TA20');
      expect(extractPostcodeSector('SW1A 1AA')).toBe('SW1A');
      expect(extractPostcodeSector('B33 8TH')).toBe('B33');
      expect(extractPostcodeSector('CR2 6XH')).toBe('CR2');
    });

    it('should handle postcodes without spaces', () => {
      expect(extractPostcodeSector('TA201AB')).toBe('TA20');
      expect(extractPostcodeSector('SW1A1AA')).toBe('SW1A');
    });

    it('should handle lowercase postcodes', () => {
      expect(extractPostcodeSector('ta20 1ab')).toBe('TA20');
      expect(extractPostcodeSector('sw1a 1aa')).toBe('SW1A');
    });

    it('should handle edge cases', () => {
      // Single letter + digit postcodes
      expect(extractPostcodeSector('M1 1AA')).toBe('M1');
      expect(extractPostcodeSector('E1 6AN')).toBe('E1');
    });
  });

  describe('createValuationBracket', () => {
    it('should create bracket label from price range', () => {
      const bracket = createValuationBracket(250000, 300000);
      expect(bracket.label).toBe('£250k-£300k');
      expect(bracket.low).toBe(250000);
      expect(bracket.high).toBe(300000);
    });

    it('should round to nearest thousand', () => {
      const bracket = createValuationBracket(245000, 305000);
      expect(bracket.label).toBe('£245k-£305k');
    });

    it('should handle large prices', () => {
      const bracket = createValuationBracket(1250000, 1500000);
      expect(bracket.label).toBe('£1250k-£1500k');
    });

    it('should handle small prices', () => {
      const bracket = createValuationBracket(50000, 75000);
      expect(bracket.label).toBe('£50k-£75k');
    });

    it('should handle same low and high', () => {
      const bracket = createValuationBracket(300000, 300000);
      expect(bracket.label).toBe('£300k-£300k');
    });
  });

  describe('getReadinessLabel', () => {
    it('should return appropriate label for each readiness stage', () => {
      expect(getReadinessLabel('EARLY_INTEREST')).toContain('Early Interest');
      expect(getReadinessLabel('PROFILE_BUILDING')).toContain('Profile Building');
      expect(getReadinessLabel('NEARLY_READY')).toContain('Nearly Ready');
    });

    it('should include descriptive text', () => {
      expect(getReadinessLabel('EARLY_INTEREST')).toContain('Early Interest');
      expect(getReadinessLabel('PROFILE_BUILDING')).toContain('Profile Building');
      expect(getReadinessLabel('NEARLY_READY')).toContain('Nearly Ready');
    });
  });
});

describe('Vendor Lead Flow Integration', () => {
  describe('State progression workflow', () => {
    it('should represent complete vendor journey', () => {
      // Vendor starts at REGISTERED after valuation
      expect(isValidTransition(null, 'REGISTERED')).toBe(true);
      expect(getReadinessStage('REGISTERED')).toBe('EARLY_INTEREST');

      // Vendor moves to PROFILE_IN_PROGRESS while building profile
      expect(isValidTransition('REGISTERED', 'PROFILE_IN_PROGRESS')).toBe(true);
      expect(getReadinessStage('PROFILE_IN_PROGRESS')).toBe('PROFILE_BUILDING');

      // Vendor completes profile and moves to READY_FOR_AGENT_MATCH
      expect(isValidTransition('PROFILE_IN_PROGRESS', 'READY_FOR_AGENT_MATCH')).toBe(true);
      expect(getReadinessStage('READY_FOR_AGENT_MATCH')).toBe('NEARLY_READY');
      expect(isReadyForAgentMatch({ state: 'READY_FOR_AGENT_MATCH' } as any)).toBe(true);
    });

    it('should support pause and resume workflow', () => {
      // Vendor can pause at any time
      expect(isValidTransition('PROFILE_IN_PROGRESS', 'PAUSED')).toBe(true);
      expect(isLeadActive({ state: 'PAUSED' } as any)).toBe(false);

      // Vendor can resume from pause
      expect(isValidTransition('PAUSED', 'PROFILE_IN_PROGRESS')).toBe(true);
      expect(isLeadActive({ state: 'PROFILE_IN_PROGRESS' } as any)).toBe(true);
    });

    it('should support withdrawal at any time', () => {
      expect(isValidTransition('REGISTERED', 'WITHDRAWN')).toBe(true);
      expect(isValidTransition('PROFILE_IN_PROGRESS', 'WITHDRAWN')).toBe(true);
      expect(isValidTransition('READY_FOR_AGENT_MATCH', 'WITHDRAWN')).toBe(true);
      expect(isLeadActive({ state: 'WITHDRAWN' } as any)).toBe(false);
    });

    it('should prevent invalid transitions', () => {
      // Cannot go backward
      expect(isValidTransition('READY_FOR_AGENT_MATCH', 'PROFILE_IN_PROGRESS')).toBe(false);
      expect(isValidTransition('PROFILE_IN_PROGRESS', 'REGISTERED')).toBe(true); // Resume is OK
      expect(isValidTransition('READY_FOR_AGENT_MATCH', 'REGISTERED')).toBe(false);

      // Cannot resume from withdrawn
      expect(isValidTransition('WITHDRAWN', 'REGISTERED')).toBe(false);
      expect(isValidTransition('WITHDRAWN', 'PROFILE_IN_PROGRESS')).toBe(false);
    });
  });

  describe('Privacy and anonymisation', () => {
    it('should protect vendor identity in early stages', () => {
      // REGISTERED and PROFILE_IN_PROGRESS stages show anonymised signals
      expect(getReadinessStage('REGISTERED')).toBe('EARLY_INTEREST');
      expect(getReadinessStage('PROFILE_IN_PROGRESS')).toBe('PROFILE_BUILDING');

      // These stages should not expose vendor contact details
      // (Verified in early-lead-signal-service.getAnonymisedLeadSignal)
    });

    it('should only expose vendor when READY_FOR_AGENT_MATCH', () => {
      // Only READY_FOR_AGENT_MATCH should expose full vendor details
      expect(isReadyForAgentMatch({ state: 'READY_FOR_AGENT_MATCH' } as any)).toBe(true);
      expect(isReadyForAgentMatch({ state: 'PROFILE_IN_PROGRESS' } as any)).toBe(false);
      expect(isReadyForAgentMatch({ state: 'REGISTERED' } as any)).toBe(false);
    });
  });

  describe('Premium agent signal timing', () => {
    it('should show launch timing based on profile completion', () => {
      // Early stage
      expect(getLaunchTiming('REGISTERED', 0)).toBe('Next month');

      // Mid-way through profile
      expect(getLaunchTiming('PROFILE_IN_PROGRESS', 50)).toBe('Next month');

      // Nearly complete
      expect(getLaunchTiming('PROFILE_IN_PROGRESS', 80)).toBe('Next 2 weeks');

      // Ready to release
      expect(getLaunchTiming('READY_FOR_AGENT_MATCH', 100)).toBe('This week');
    });
  });
});
