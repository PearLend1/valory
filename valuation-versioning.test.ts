import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBaselineValuation,
  getActiveValuation,
  isBaselineExpired,
  daysUntilBaselineExpiration,
  canRequestRefresh,
  createRefreshedValuation,
  calculateValuationDifference,
  generateRefreshExplanation,
  validateBaselineImmutability,
  getValuationHistory,
  ensureSingleBaseline,
  calculateConfidenceImprovement,
  validateRefreshEligibility,
  ValuationVersion,
} from './valuation-versioning';
import {
  detectProfileChanges,
  classifyChangeSeverity,
  generateChangeSummary,
  shouldTriggerRefresh,
  calculateConfidenceImpact,
  identifyMostImpactfulChanges,
  generateRefreshExplanation as generateChangeRefreshExplanation,
  validateRefreshTrigger,
} from './change-detection';

describe('Valuation Versioning System', () => {
  let baseline: ValuationVersion;

  beforeEach(() => {
    baseline = createBaselineValuation(1, 1, 250000, 75, {
      publicData: 0.4,
      apiData: 0.3,
      agentIntelligence: 0.15,
      platformNative: 0.15,
    });
  });

  describe('Baseline Valuation Creation', () => {
    it('should create baseline valuation with correct properties', () => {
      expect(baseline.versionNumber).toBe(1);
      expect(baseline.isBaseline).toBe(true);
      expect(baseline.status).toBe('ACTIVE');
      expect(baseline.valuationAmount).toBe(250000);
      expect(baseline.confidenceScore).toBe(75);
    });

    it('should set expiration to 12 months from creation', () => {
      const now = new Date();
      const expectedExpiration = new Date(now);
      expectedExpiration.setMonth(expectedExpiration.getMonth() + 12);

      // Allow 1 minute tolerance for test execution
      const timeDiff = Math.abs(baseline.expiresAt.getTime() - expectedExpiration.getTime());
      expect(timeDiff).toBeLessThan(60000);
    });

    it('should mark baseline as active', () => {
      expect(baseline.status).toBe('ACTIVE');
    });
  });

  describe('Active Valuation Retrieval', () => {
    it('should return baseline if still active', () => {
      const versions = [baseline];
      const active = getActiveValuation(versions);

      expect(active).toBe(baseline);
    });

    it('should return latest version if baseline expired', () => {
      const expiredBaseline = { ...baseline, expiresAt: new Date(Date.now() - 1000) };
      const newVersion = createRefreshedValuation(
        1,
        1,
        expiredBaseline,
        260000,
        80,
        'Market update',
        { publicData: 0.4, apiData: 0.3, agentIntelligence: 0.15, platformNative: 0.15 }
      );

      const versions = [expiredBaseline, newVersion];
      const active = getActiveValuation(versions);

      expect(active?.versionNumber).toBe(2);
    });

    it('should return null if no versions exist', () => {
      const active = getActiveValuation([]);
      expect(active).toBeNull();
    });
  });

  describe('Baseline Expiration', () => {
    it('should detect expired baseline', () => {
      const expiredBaseline = { ...baseline, expiresAt: new Date(Date.now() - 1000) };
      expect(isBaselineExpired(expiredBaseline)).toBe(true);
    });

    it('should detect active baseline', () => {
      expect(isBaselineExpired(baseline)).toBe(false);
    });

    it('should calculate days until expiration', () => {
      const days = daysUntilBaselineExpiration(baseline);
      expect(days).toBeGreaterThan(350); // Should be close to 365
      expect(days).toBeLessThanOrEqual(365);
    });
  });

  describe('Refresh Eligibility', () => {
    it('should allow refresh with sufficient change severity', () => {
      expect(canRequestRefresh(35)).toBe(true);
    });

    it('should deny refresh with insufficient change severity', () => {
      expect(canRequestRefresh(20)).toBe(false);
    });

    it('should allow refresh at threshold', () => {
      expect(canRequestRefresh(30)).toBe(true);
    });
  });

  describe('Refreshed Valuation Creation', () => {
    it('should create new version with incremented version number', () => {
      const refreshed = createRefreshedValuation(
        1,
        1,
        baseline,
        260000,
        80,
        'Market update',
        { publicData: 0.4, apiData: 0.3, agentIntelligence: 0.15, platformNative: 0.15 }
      );

      expect(refreshed.versionNumber).toBe(2);
      expect(refreshed.valuationAmount).toBe(260000);
      expect(refreshed.confidenceScore).toBe(80);
    });

    it('should preserve baseline in history', () => {
      const refreshed = createRefreshedValuation(
        1,
        1,
        baseline,
        260000,
        80,
        'Market update',
        { publicData: 0.4, apiData: 0.3, agentIntelligence: 0.15, platformNative: 0.15 }
      );

      expect(baseline.valuationAmount).toBe(250000); // Unchanged
      expect(baseline.isBaseline).toBe(true); // Still marked as baseline
    });

    it('should set new version as active', () => {
      const refreshed = createRefreshedValuation(
        1,
        1,
        baseline,
        260000,
        80,
        'Market update',
        { publicData: 0.4, apiData: 0.3, agentIntelligence: 0.15, platformNative: 0.15 }
      );

      expect(refreshed.status).toBe('ACTIVE');
    });
  });

  describe('Valuation Difference Calculation', () => {
    it('should calculate positive difference correctly', () => {
      const diff = calculateValuationDifference(250000, 260000);
      expect(diff.difference).toBe(10000);
      expect(diff.percentageDifference).toBe(4);
      expect(diff.direction).toBe('UP');
    });

    it('should calculate negative difference correctly', () => {
      const diff = calculateValuationDifference(250000, 240000);
      expect(diff.difference).toBe(-10000);
      expect(diff.percentageDifference).toBe(-4);
      expect(diff.direction).toBe('DOWN');
    });

    it('should handle no change', () => {
      const diff = calculateValuationDifference(250000, 250000);
      expect(diff.difference).toBe(0);
      expect(diff.percentageDifference).toBe(0);
      expect(diff.direction).toBe('SAME');
    });
  });

  describe('Baseline Immutability', () => {
    it('should validate unchanged baseline', () => {
      const validation = validateBaselineImmutability(baseline, baseline);
      expect(validation.isValid).toBe(true);
      expect(validation.issues.length).toBe(0);
    });

    it('should detect tampered valuation amount', () => {
      const tampered = { ...baseline, valuationAmount: 260000 };
      const validation = validateBaselineImmutability(baseline, tampered);
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Baseline valuation amount has been modified');
    });

    it('should detect tampered confidence score', () => {
      const tampered = { ...baseline, confidenceScore: 85 };
      const validation = validateBaselineImmutability(baseline, tampered);
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Baseline confidence score has been modified');
    });
  });

  describe('Valuation History', () => {
    it('should return history in reverse chronological order', () => {
      const v1 = baseline;
      const v2 = createRefreshedValuation(
        1,
        1,
        v1,
        260000,
        80,
        'Update',
        { publicData: 0.4, apiData: 0.3, agentIntelligence: 0.15, platformNative: 0.15 }
      );

      const history = getValuationHistory([v1, v2]);
      expect(history[0].version).toBe(2);
      expect(history[1].version).toBe(1);
    });

    it('should include days remaining for each version', () => {
      const history = getValuationHistory([baseline]);
      expect(history[0].daysRemaining).toBeGreaterThan(350);
      expect(history[0].daysRemaining).toBeLessThanOrEqual(365);
    });
  });

  describe('Single Baseline Enforcement', () => {
    it('should mark old baseline as superseded when new baseline created', () => {
      const oldBaseline = { ...baseline, id: 1, createdAt: new Date(Date.now() - 1000) };
      const newBaseline = {
        ...baseline,
        id: 2,
        versionNumber: 2,
        isBaseline: true,
        createdAt: new Date(),
      };

      const versions = ensureSingleBaseline([oldBaseline, newBaseline]);
      const oldVersion = versions.find((v) => v.id === 1);
      const newVersion = versions.find((v) => v.id === 2);

      expect(oldVersion?.isBaseline).toBe(false);
      expect(oldVersion?.status).toBe('SUPERSEDED');
      expect(newVersion?.isBaseline).toBe(true);
    });
  });

  describe('Confidence Improvement', () => {
    it('should detect significant confidence improvement', () => {
      const improvement = calculateConfidenceImprovement(75, 88);
      expect(improvement.improved).toBe(true);
      expect(improvement.percentagePointsGained).toBe(13);
    });

    it('should detect no improvement', () => {
      const improvement = calculateConfidenceImprovement(75, 75);
      expect(improvement.improved).toBe(false);
      expect(improvement.percentagePointsGained).toBe(0);
    });

    it('should handle confidence decrease', () => {
      const improvement = calculateConfidenceImprovement(80, 70);
      expect(improvement.improved).toBe(false);
      expect(improvement.percentagePointsGained).toBe(-10);
    });
  });

  describe('Refresh Eligibility Validation', () => {
    it('should validate refresh with meaningful changes', () => {
      const validation = validateRefreshEligibility(baseline, 35);
      expect(validation.eligible).toBe(true);
    });

    it('should deny refresh without meaningful changes', () => {
      const validation = validateRefreshEligibility(baseline, 20);
      expect(validation.eligible).toBe(false);
    });
  });
});

describe('Change Detection System', () => {
  describe('Profile Change Detection', () => {
    it('should detect photo additions', () => {
      const oldProfile = { photos: ['photo1.jpg'] };
      const newProfile = { photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'] };

      const result = detectProfileChanges(oldProfile, newProfile);
      expect(result.changes.some((c) => c.type === 'PHOTO_ADDED')).toBe(true);
      expect(result.totalSeverity).toBeGreaterThan(0);
    });

    it('should detect feature additions', () => {
      const oldProfile = { features: ['Garden', 'Garage'] };
      const newProfile = { features: ['Garden', 'Garage', 'Pool'] };

      const result = detectProfileChanges(oldProfile, newProfile);
      expect(result.changes.some((c) => c.type === 'FEATURE_ADDED')).toBe(true);
      // One feature added = 20 severity, which is below 30 threshold
      expect(result.totalSeverity).toBeGreaterThan(0);
    });

    it('should detect damage reports', () => {
      const oldProfile = { reportedDamages: [] };
      const newProfile = { reportedDamages: ['Roof damage', 'Foundation crack'] };

      const result = detectProfileChanges(oldProfile, newProfile);
      expect(result.changes.some((c) => c.type === 'DAMAGE_REPORTED')).toBe(true);
      expect(result.totalSeverity).toBeGreaterThan(50);
    });

    it('should detect improvements', () => {
      const oldProfile = { improvements: [] };
      const newProfile = { improvements: ['New roof', 'New windows'] };

      const result = detectProfileChanges(oldProfile, newProfile);
      expect(result.changes.some((c) => c.type === 'IMPROVEMENT_ADDED')).toBe(true);
    });

    it('should ignore minor description changes', () => {
      const oldProfile = { description: 'Beautiful house' };
      const newProfile = { description: 'Beautiful house with garden' };

      const result = detectProfileChanges(oldProfile, newProfile);
      const descriptionChange = result.changes.find((c) => c.type === 'DESCRIPTION_UPDATED');
      expect(descriptionChange?.isSignificant).toBe(false);
    });
  });

  describe('Change Severity Classification', () => {
    it('should classify minor changes', () => {
      expect(classifyChangeSeverity(10)).toBe('MINOR');
    });

    it('should classify moderate changes', () => {
      expect(classifyChangeSeverity(20)).toBe('MODERATE');
    });

    it('should classify significant changes', () => {
      expect(classifyChangeSeverity(40)).toBe('SIGNIFICANT');
    });

    it('should classify major changes', () => {
      expect(classifyChangeSeverity(60)).toBe('MAJOR');
    });
  });

  describe('Refresh Trigger Validation', () => {
    it('should trigger refresh for significant changes', () => {
      expect(shouldTriggerRefresh(35)).toBe(true);
    });

    it('should not trigger refresh for minor changes', () => {
      expect(shouldTriggerRefresh(15)).toBe(false);
    });

    it('should trigger refresh at threshold', () => {
      expect(shouldTriggerRefresh(30)).toBe(true);
    });
  });

  describe('Confidence Impact Calculation', () => {
    it('should increase confidence for positive changes', () => {
      const changes = [
        {
          type: 'PHOTO_ADDED',
          severity: 15,
          description: 'Photos added',
          isSignificant: true,
        },
        {
          type: 'IMPROVEMENT_ADDED',
          severity: 25,
          description: 'Improvements',
          isSignificant: true,
        },
      ];

      const impact = calculateConfidenceImpact(changes);
      expect(impact).toBeGreaterThan(0);
    });

    it('should decrease confidence for negative changes', () => {
      const changes = [
        {
          type: 'DAMAGE_REPORTED',
          severity: 30,
          description: 'Damage',
          isSignificant: true,
        },
      ];

      const impact = calculateConfidenceImpact(changes);
      expect(impact).toBeLessThan(0);
    });
  });

  describe('Most Impactful Changes Identification', () => {
    it('should return top changes by severity', () => {
      const changes = [
        { type: 'PHOTO_ADDED', severity: 15, description: 'Photos', isSignificant: true },
        { type: 'DAMAGE_REPORTED', severity: 60, description: 'Damage', isSignificant: true },
        { type: 'IMPROVEMENT_ADDED', severity: 50, description: 'Improvements', isSignificant: true },
      ];

      const topChanges = identifyMostImpactfulChanges(changes, 2);
      expect(topChanges.length).toBe(2);
      expect(topChanges[0].type).toBe('DAMAGE_REPORTED');
      expect(topChanges[1].type).toBe('IMPROVEMENT_ADDED');
    });
  });

  describe('Refresh Trigger Validation', () => {
    it('should validate significant changes', () => {
      const changes = [
        { type: 'DAMAGE_REPORTED', severity: 60, description: 'Damage', isSignificant: true },
      ] as any;

      const validation = validateRefreshTrigger(changes, 60);
      expect(validation.valid).toBe(true);
    });

    it('should reject insufficient changes', () => {
      const changes = [
        { type: 'DESCRIPTION_UPDATED', severity: 3, description: 'Description', isSignificant: false },
      ];

      const validation = validateRefreshTrigger(changes, 3);
      expect(validation.valid).toBe(false);
    });
  });
});
