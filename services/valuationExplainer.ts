/**
 * Valuation Explainer Service
 * Generates human-readable explanations for property valuations
 */

import type { ValuationResult } from './comparableSelection';

export interface ValuationExplanation {
  headline: string;
  confidenceStatement: string;
  howWeCalculated: string;
  whatThisMeans: string;
  whatCouldMoveIt: string;
  importantNote: string;
  nextSteps: string;
}

export function generateExplanation(valuation: ValuationResult, area: string): ValuationExplanation {
  const { estimate, lowBand, highBand, confidence, compsUsed } = valuation;
  const fmt = (n: number) => `£${n.toLocaleString('en-GB')}`;

  return {
    headline: `Your property is estimated at ${fmt(estimate)}`,
    confidenceStatement: `${confidence} confidence based on ${compsUsed} comparable sales in ${area}.`,
    howWeCalculated: `We analysed ${compsUsed} recent Land Registry transactions in ${area} and adjusted for your property's size, type, and condition.`,
    whatThisMeans: `Most buyers would expect to pay between ${fmt(lowBand)} and ${fmt(highBand)} for a property like yours.`,
    whatCouldMoveIt: 'Condition, presentation, local demand, and the speed of the market can all shift the final price by 5–10%.',
    importantNote: 'This is an automated estimate and not a formal RICS valuation. Always seek professional advice before listing.',
    nextSteps: 'Request a free agent appraisal through Valory to refine this figure with local expertise.',
  };
}

export function generateDetailedExplanation(valuation: ValuationResult, area: string): string {
  const exp = generateExplanation(valuation, area);
  return [
    exp.headline,
    '',
    exp.confidenceStatement,
    '',
    `How we calculated this: ${exp.howWeCalculated}`,
    '',
    `What this means: ${exp.whatThisMeans}`,
    '',
    `What could move it: ${exp.whatCouldMoveIt}`,
    '',
    `Important note: ${exp.importantNote}`,
    '',
    `Next steps: ${exp.nextSteps}`,
  ].join('\n');
}

export function generateEmailExplanation(valuation: ValuationResult, area: string): string {
  const exp = generateExplanation(valuation, area);
  return `Dear Vendor,\n\n${exp.headline}.\n\n${exp.confidenceStatement}\n\n${exp.howWeCalculated}\n\nNext steps: ${exp.nextSteps}\n\nBest regards,\nValory`;
}

export function generateShortExplanation(valuation: ValuationResult): string {
  const fmt = (n: number) => `£${n.toLocaleString('en-GB')}`;
  return `Estimated ${fmt(valuation.estimate)} (${fmt(valuation.lowBand)}–${fmt(valuation.highBand)}, ${valuation.confidence} confidence)`;
}
