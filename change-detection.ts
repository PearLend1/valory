/**
 * Change Detection Service
 * Identifies meaningful profile updates that warrant valuation refresh
 * Distinguishes between significant changes and minor updates
 */

export interface ProfileChange {
  type: string;
  severity: number; // 0-100
  oldValue?: string | number | boolean;
  newValue?: string | number | boolean;
  description: string;
  isSignificant: boolean;
}

export interface ProfileChangeDetectionResult {
  changes: ProfileChange[];
  totalSeverity: number;
  hasSignificantChanges: boolean;
  summary: string;
}

// Severity thresholds for different change types
const CHANGE_SEVERITY_MAP: Record<string, number> = {
  PHOTO_ADDED: 15, // Adding photos improves valuation confidence
  PHOTO_REMOVED: 10, // Removing photos may indicate hiding issues
  FEATURE_ADDED: 20, // New features increase value
  FEATURE_REMOVED: 15, // Removed features decrease value
  CONDITION_CHANGED: 25, // Significant impact on valuation
  DAMAGE_REPORTED: 30, // Major impact - new damage discovered
  IMPROVEMENT_ADDED: 25, // Renovations/improvements
  PRICE_EXPECTATION_CHANGED: 5, // Minor - doesn't affect valuation
  DESCRIPTION_UPDATED: 3, // Very minor - cosmetic changes
  OTHER: 10, // Default for unclassified changes
};

const SIGNIFICANT_CHANGE_THRESHOLD = 30; // Total severity to trigger refresh eligibility

/**
 * Detect changes between old and new property profiles
 */
export function detectProfileChanges(
  oldProfile: Record<string, any>,
  newProfile: Record<string, any>
): ProfileChangeDetectionResult {
  const changes: ProfileChange[] = [];

  // Check for photo changes
  const oldPhotoCount = oldProfile.photos?.length || 0;
  const newPhotoCount = newProfile.photos?.length || 0;

  if (newPhotoCount > oldPhotoCount) {
    const photosAdded = newPhotoCount - oldPhotoCount;
    changes.push({
      type: 'PHOTO_ADDED',
      severity: Math.min(photosAdded * CHANGE_SEVERITY_MAP.PHOTO_ADDED, 40), // Cap at 40
      oldValue: oldPhotoCount,
      newValue: newPhotoCount,
      description: `${photosAdded} new photo(s) added to listing`,
      isSignificant: true,
    });
  } else if (newPhotoCount < oldPhotoCount) {
    const photosRemoved = oldPhotoCount - newPhotoCount;
    changes.push({
      type: 'PHOTO_REMOVED',
      severity: photosRemoved * CHANGE_SEVERITY_MAP.PHOTO_REMOVED,
      oldValue: oldPhotoCount,
      newValue: newPhotoCount,
      description: `${photosRemoved} photo(s) removed from listing`,
      isSignificant: false, // Removing photos is less significant than adding
    });
  }

  // Check for feature changes
  const oldFeatures = new Set(oldProfile.features || []);
  const newFeatures = new Set(newProfile.features || []);

  const featuresAdded = Array.from(newFeatures).filter((f) => !oldFeatures.has(f));
  const featuresRemoved = Array.from(oldFeatures).filter((f) => !newFeatures.has(f));

  if (featuresAdded.length > 0) {
    changes.push({
      type: 'FEATURE_ADDED',
      severity: Math.min(featuresAdded.length * CHANGE_SEVERITY_MAP.FEATURE_ADDED, 50),
      description: `New features added: ${featuresAdded.join(', ')}`,
      isSignificant: true,
    });
  }

  if (featuresRemoved.length > 0) {
    changes.push({
      type: 'FEATURE_REMOVED',
      severity: featuresRemoved.length * CHANGE_SEVERITY_MAP.FEATURE_REMOVED,
      description: `Features removed: ${featuresRemoved.join(', ')}`,
      isSignificant: true,
    });
  }

  // Check for condition changes
  if (oldProfile.condition !== newProfile.condition) {
    changes.push({
      type: 'CONDITION_CHANGED',
      severity: CHANGE_SEVERITY_MAP.CONDITION_CHANGED,
      oldValue: oldProfile.condition,
      newValue: newProfile.condition,
      description: `Property condition changed from ${oldProfile.condition} to ${newProfile.condition}`,
      isSignificant: true,
    });
  }

  // Check for damage reports
  const oldDamages = new Set(oldProfile.reportedDamages || []);
  const newDamages = new Set(newProfile.reportedDamages || []);

  const damagesAdded = Array.from(newDamages).filter((d) => !oldDamages.has(d));

  if (damagesAdded.length > 0) {
    changes.push({
      type: 'DAMAGE_REPORTED',
      severity: Math.min(damagesAdded.length * CHANGE_SEVERITY_MAP.DAMAGE_REPORTED, 60),
      description: `New damage reported: ${damagesAdded.join(', ')}`,
      isSignificant: true,
    });
  }

  // Check for improvements
  const oldImprovements = new Set(oldProfile.improvements || []);
  const newImprovements = new Set(newProfile.improvements || []);

  const improvementsAdded = Array.from(newImprovements).filter((i) => !oldImprovements.has(i));

  if (improvementsAdded.length > 0) {
    changes.push({
      type: 'IMPROVEMENT_ADDED',
      severity: Math.min(improvementsAdded.length * CHANGE_SEVERITY_MAP.IMPROVEMENT_ADDED, 50),
      description: `Property improvements: ${improvementsAdded.join(', ')}`,
      isSignificant: true,
    });
  }

  // Check for price expectation changes (minor)
  if (oldProfile.priceExpectation !== newProfile.priceExpectation) {
    const difference = Math.abs(
      (newProfile.priceExpectation || 0) - (oldProfile.priceExpectation || 0)
    );
    if (difference > 0) {
      changes.push({
        type: 'PRICE_EXPECTATION_CHANGED',
        severity: CHANGE_SEVERITY_MAP.PRICE_EXPECTATION_CHANGED,
        oldValue: oldProfile.priceExpectation,
        newValue: newProfile.priceExpectation,
        description: `Vendor price expectation changed`,
        isSignificant: false,
      });
    }
  }

  // Check for description updates (very minor)
  if (oldProfile.description !== newProfile.description) {
    changes.push({
      type: 'DESCRIPTION_UPDATED',
      severity: CHANGE_SEVERITY_MAP.DESCRIPTION_UPDATED,
      description: 'Property description updated',
      isSignificant: false,
    });
  }

  // Calculate total severity
  const totalSeverity = changes.reduce((sum, change) => sum + change.severity, 0);

  // Generate summary
  const significantChanges = changes.filter((c) => c.isSignificant);
  let summary = '';

  if (significantChanges.length === 0) {
    summary = 'No significant changes detected';
  } else if (significantChanges.length === 1) {
    summary = `1 significant change: ${significantChanges[0].description}`;
  } else {
    summary = `${significantChanges.length} significant changes detected`;
  }

  return {
    changes,
    totalSeverity,
    hasSignificantChanges: totalSeverity >= SIGNIFICANT_CHANGE_THRESHOLD,
    summary,
  };
}

/**
 * Classify change severity for user communication
 */
export function classifyChangeSeverity(
  totalSeverity: number
): 'MINOR' | 'MODERATE' | 'SIGNIFICANT' | 'MAJOR' {
  if (totalSeverity < 15) return 'MINOR';
  if (totalSeverity < 30) return 'MODERATE';
  if (totalSeverity < 50) return 'SIGNIFICANT';
  return 'MAJOR';
}

/**
 * Generate human-readable change summary for vendor
 */
export function generateChangeSummary(changes: ProfileChange[]): string {
  if (changes.length === 0) {
    return 'No changes detected since your last valuation.';
  }

  const significantChanges = changes.filter((c) => c.isSignificant);

  if (significantChanges.length === 0) {
    return 'Minor updates detected, but not significant enough to warrant a valuation refresh.';
  }

  const descriptions = significantChanges.map((c) => `• ${c.description}`).join('\n');

  return `We've detected the following meaningful changes to your property:\n\n${descriptions}\n\nThese changes may affect your property's valuation. Would you like us to refresh your valuation?`;
}

/**
 * Determine if changes warrant a refresh
 */
export function shouldTriggerRefresh(totalSeverity: number): boolean {
  return totalSeverity >= SIGNIFICANT_CHANGE_THRESHOLD;
}

/**
 * Calculate confidence impact from changes
 * Positive changes increase confidence, negative changes decrease it
 */
export function calculateConfidenceImpact(changes: ProfileChange[]): number {
  let impact = 0;

  for (const change of changes) {
    switch (change.type) {
      case 'PHOTO_ADDED':
        impact += 3; // More photos = higher confidence
        break;
      case 'PHOTO_REMOVED':
        impact -= 2; // Fewer photos = lower confidence
        break;
      case 'FEATURE_ADDED':
        impact += 5; // New features increase confidence
        break;
      case 'FEATURE_REMOVED':
        impact -= 4; // Removed features decrease confidence
        break;
      case 'CONDITION_CHANGED':
        impact += 2; // Better condition info = higher confidence
        break;
      case 'DAMAGE_REPORTED':
        impact -= 5; // New damage = lower confidence
        break;
      case 'IMPROVEMENT_ADDED':
        impact += 4; // Improvements increase confidence
        break;
      case 'PRICE_EXPECTATION_CHANGED':
        impact += 0; // Doesn't affect valuation confidence
        break;
      case 'DESCRIPTION_UPDATED':
        impact += 0; // Cosmetic changes don't affect confidence
        break;
    }
  }

  return Math.max(-20, Math.min(20, impact)); // Cap between -20 and +20
}

/**
 * Identify which changes are most impactful for valuation
 */
export function identifyMostImpactfulChanges(
  changes: ProfileChange[],
  maxChanges: number = 3
): ProfileChange[] {
  return changes
    .filter((c) => c.isSignificant)
    .sort((a, b) => b.severity - a.severity)
    .slice(0, maxChanges);
}

/**
 * Generate explanation of why refresh is available
 */
export function generateRefreshExplanation(changes: ProfileChange[]): string {
  const significantChanges = changes.filter((c) => c.isSignificant);

  if (significantChanges.length === 0) {
    return 'Your property profile has been updated, but changes are not significant enough to warrant a refresh.';
  }

  const topChanges = identifyMostImpactfulChanges(significantChanges, 2);
  const changeDescriptions = topChanges.map((c) => c.description).join(' and ');

  return `Your property profile has been updated with meaningful changes: ${changeDescriptions}. We can refresh your valuation to reflect these updates.`;
}

/**
 * Validate that only meaningful changes trigger refresh
 * Prevents abuse of refresh system
 */
export function validateRefreshTrigger(
  changes: ProfileChange[],
  totalSeverity: number
): {
  valid: boolean;
  reason: string;
} {
  if (totalSeverity < SIGNIFICANT_CHANGE_THRESHOLD) {
    return {
      valid: false,
      reason: `Changes not significant enough (severity: ${totalSeverity}/${SIGNIFICANT_CHANGE_THRESHOLD})`,
    };
  }

  const significantChanges = changes.filter((c) => c.isSignificant);
  if (significantChanges.length === 0) {
    return {
      valid: false,
      reason: 'No significant changes detected',
    };
  }

  return {
    valid: true,
    reason: 'Meaningful changes detected, refresh eligible',
  };
}
