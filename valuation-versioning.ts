/**
 * Valuation Versioning Service
 * Preserves baseline valuations for 12 months
 * Supports refreshed valuations while maintaining history and transparency
 */

export interface ValuationVersion {
  id: number;
  propertyId: number;
  vendorId: number;
  versionNumber: number;
  valuationAmount: number;
  confidenceScore: number;
  isBaseline: boolean;
  status: 'ACTIVE' | 'SUPERSEDED' | 'EXPIRED';
  createdAt: Date;
  expiresAt: Date;
  dataSourceBreakdown: {
    publicData: number;
    apiData: number;
    agentIntelligence: number;
    platformNative: number;
  };
}

export interface ValuationRefreshRequest {
  propertyId: number;
  vendorId: number;
  changesSummary: string;
  changesDetected: Array<{
    type: string;
    severity: number;
    description: string;
  }>;
  totalChangeSeverity: number;
}

const BASELINE_EXPIRATION_MONTHS = 12;
const REFRESH_ELIGIBILITY_THRESHOLD = 30; // Severity score threshold for refresh eligibility

/**
 * Create initial baseline valuation
 * This valuation is locked for 12 months and cannot be modified
 */
export function createBaselineValuation(
  propertyId: number,
  vendorId: number,
  valuationAmount: number,
  confidenceScore: number,
  dataSourceBreakdown: {
    publicData: number;
    apiData: number;
    agentIntelligence: number;
    platformNative: number;
  }
): ValuationVersion {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + BASELINE_EXPIRATION_MONTHS);

  return {
    id: 0, // Will be assigned by database
    propertyId,
    vendorId,
    versionNumber: 1,
    valuationAmount,
    confidenceScore,
    isBaseline: true,
    status: 'ACTIVE',
    createdAt: now,
    expiresAt,
    dataSourceBreakdown,
  };
}

/**
 * Get the active valuation for a property
 * Returns baseline if still valid, otherwise latest valid version
 */
export function getActiveValuation(
  versions: ValuationVersion[]
): ValuationVersion | null {
  if (versions.length === 0) return null;

  // Sort by version number descending
  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  const now = new Date();

  // Find baseline if still active
  const baseline = sorted.find((v) => v.isBaseline && v.status === 'ACTIVE');
  if (baseline && baseline.expiresAt > now) {
    return baseline;
  }

  // Return latest active version
  const active = sorted.find((v) => v.status === 'ACTIVE');
  return active || null;
}

/**
 * Check if baseline valuation has expired
 */
export function isBaselineExpired(baseline: ValuationVersion): boolean {
  const now = new Date();
  return baseline.expiresAt <= now;
}

/**
 * Calculate days until baseline expiration
 */
export function daysUntilBaselineExpiration(baseline: ValuationVersion): number {
  const now = new Date();
  const diffMs = baseline.expiresAt.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if vendor can request a refresh
 * Requires meaningful changes detected (severity > threshold)
 */
export function canRequestRefresh(totalChangeSeverity: number): boolean {
  return totalChangeSeverity >= REFRESH_ELIGIBILITY_THRESHOLD;
}

/**
 * Create a refreshed valuation
 * Preserves baseline in history, creates new version
 */
export function createRefreshedValuation(
  propertyId: number,
  vendorId: number,
  previousVersion: ValuationVersion,
  newValuationAmount: number,
  newConfidenceScore: number,
  refreshReason: string,
  dataSourceBreakdown: {
    publicData: number;
    apiData: number;
    agentIntelligence: number;
    platformNative: number;
  }
): ValuationVersion {
  const now = new Date();

  // New version does NOT expire - it becomes the active baseline
  // unless it gets superseded by another refresh
  return {
    id: 0, // Will be assigned by database
    propertyId,
    vendorId,
    versionNumber: previousVersion.versionNumber + 1,
    valuationAmount: newValuationAmount,
    confidenceScore: newConfidenceScore,
    isBaseline: false, // New version is not marked as baseline
    status: 'ACTIVE',
    createdAt: now,
    expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 12 months from now
    dataSourceBreakdown,
  };
}

/**
 * Mark old version as superseded when refresh completes
 */
export function markAsSupersceded(version: ValuationVersion): ValuationVersion {
  return {
    ...version,
    status: 'SUPERSEDED',
  };
}

/**
 * Calculate valuation difference and percentage change
 */
export function calculateValuationDifference(
  oldValuation: number,
  newValuation: number
): {
  difference: number;
  percentageDifference: number;
  direction: 'UP' | 'DOWN' | 'SAME';
} {
  const difference = newValuation - oldValuation;
  const percentageDifference = (difference / oldValuation) * 100;

  let direction: 'UP' | 'DOWN' | 'SAME' = 'SAME';
  if (difference > 0) direction = 'UP';
  if (difference < 0) direction = 'DOWN';

  return {
    difference,
    percentageDifference: Math.round(percentageDifference * 100) / 100,
    direction,
  };
}

/**
 * Generate human-readable explanation for valuation change
 */
export function generateRefreshExplanation(
  oldValuation: number,
  newValuation: number,
  oldConfidence: number,
  newConfidence: number,
  changes: Array<{ type: string; description: string }>
): string {
  const diff = calculateValuationDifference(oldValuation, newValuation);
  const confidenceDiff = newConfidence - oldConfidence;

  let explanation = '';

  if (diff.direction === 'UP') {
    explanation = `Your property valuation has increased by £${Math.abs(diff.difference).toLocaleString()} (${Math.abs(diff.percentageDifference)}%). `;
  } else if (diff.direction === 'DOWN') {
    explanation = `Your property valuation has decreased by £${Math.abs(diff.difference).toLocaleString()} (${Math.abs(diff.percentageDifference)}%). `;
  } else {
    explanation = `Your property valuation remains stable at £${newValuation.toLocaleString()}. `;
  }

  if (confidenceDiff > 0) {
    explanation += `Confidence has improved from ${oldConfidence}% to ${newConfidence}%. `;
  } else if (confidenceDiff < 0) {
    explanation += `Confidence has decreased from ${oldConfidence}% to ${newConfidence}%. `;
  }

  if (changes.length > 0) {
    explanation += `This refresh was triggered by: ${changes.map((c) => c.description).join(', ')}. `;
  }

  return explanation;
}

/**
 * Validate that baseline has not been tampered with
 * Ensures immutability of baseline valuation
 */
export function validateBaselineImmutability(
  baseline: ValuationVersion,
  currentVersion: ValuationVersion
): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (baseline.valuationAmount !== currentVersion.valuationAmount) {
    issues.push('Baseline valuation amount has been modified');
  }

  if (baseline.confidenceScore !== currentVersion.confidenceScore) {
    issues.push('Baseline confidence score has been modified');
  }

  if (baseline.createdAt !== currentVersion.createdAt) {
    issues.push('Baseline creation timestamp has been modified');
  }

  if (baseline.isBaseline !== currentVersion.isBaseline) {
    issues.push('Baseline flag has been modified');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Get valuation history for transparency
 * Shows all versions and their progression
 */
export function getValuationHistory(versions: ValuationVersion[]): Array<{
  version: number;
  amount: number;
  confidence: number;
  isBaseline: boolean;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  daysRemaining: number;
}> {
  const now = new Date();

  return versions
    .sort((a, b) => b.versionNumber - a.versionNumber)
    .map((v) => ({
      version: v.versionNumber,
      amount: v.valuationAmount,
      confidence: v.confidenceScore,
      isBaseline: v.isBaseline,
      status: v.status,
      createdAt: v.createdAt,
      expiresAt: v.expiresAt,
      daysRemaining: Math.ceil((v.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));
}

/**
 * Ensure only one baseline valuation exists
 * If creating new baseline, mark old baseline as superseded
 */
export function ensureSingleBaseline(versions: ValuationVersion[]): ValuationVersion[] {
  const baselines = versions.filter((v) => v.isBaseline);

  if (baselines.length <= 1) {
    return versions;
  }

  // Keep only the most recent baseline
  const sorted = baselines.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const currentBaseline = sorted[0];

  return versions.map((v) => {
    if (v.isBaseline && v.id !== currentBaseline.id) {
      return { ...v, isBaseline: false, status: 'SUPERSEDED' };
    }
    return v;
  });
}

/**
 * Calculate confidence improvement from new data
 */
export function calculateConfidenceImprovement(
  oldConfidence: number,
  newConfidence: number
): {
  improved: boolean;
  percentagePointsGained: number;
  explanation: string;
} {
  const gain = newConfidence - oldConfidence;

  let explanation = '';
  if (gain > 10) {
    explanation = 'Significant improvement from new property data and market insights';
  } else if (gain > 5) {
    explanation = 'Moderate improvement from updated information';
  } else if (gain > 0) {
    explanation = 'Slight improvement from new data';
  } else if (gain === 0) {
    explanation = 'Confidence remains stable';
  } else {
    explanation = 'Confidence adjusted based on updated market conditions';
  }

  return {
    improved: gain > 0,
    percentagePointsGained: Math.round(gain * 100) / 100,
    explanation,
  };
}

/**
 * Validate refresh request eligibility
 */
export function validateRefreshEligibility(
  currentVersion: ValuationVersion,
  totalChangeSeverity: number
): {
  eligible: boolean;
  reason: string;
} {
  // Check if baseline is still active
  const now = new Date();
  if (currentVersion.isBaseline && currentVersion.expiresAt <= now) {
    return {
      eligible: true,
      reason: 'Baseline has expired, refresh available',
    };
  }

  // Check if meaningful changes detected
  if (totalChangeSeverity >= REFRESH_ELIGIBILITY_THRESHOLD) {
    return {
      eligible: true,
      reason: `Meaningful changes detected (severity: ${totalChangeSeverity})`,
    };
  }

  return {
    eligible: false,
    reason: `Changes are not significant enough for refresh (severity: ${totalChangeSeverity}/${REFRESH_ELIGIBILITY_THRESHOLD})`,
  };
}
