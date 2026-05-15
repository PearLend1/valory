/**
 * Valuation Explainer
 * Generates vendor-friendly explanations for valuations
 * Based on production copy templates that build trust and clarity
 */

import { ValuationResult } from './comparableSelection';

export interface ValuationExplanation {
  headline: string;
  confidenceStatement: string;
  howWeCalculated: string[];
  whatThisMeans: string;
  whatCouldMoveIt: string[];
  importantNote: string;
  nextSteps: string;
}

/**
 * Generate confidence wording that vendors understand
 */
function getConfidenceWording(confidence: 'High' | 'Medium' | 'Low'): string {
  const wordings: Record<string, string> = {
    High: 'Strong evidence: lots of similar recent sales nearby.',
    Medium: 'Good evidence, but fewer close matches or slightly older sales.',
    Low: 'Limited evidence: unique property, sparse sales, or incomplete details. We recommend a quick local agent review.',
  };
  return wordings[confidence] || wordings.Low;
}

/**
 * Generate "what could move it" factors
 */
function getMovingFactors(): string[] {
  return [
    'Condition & finish (kitchens, bathrooms, décor, structural issues)',
    'Outside space (parking, garden, views, privacy)',
    'Layout & usability (flow, storage, light)',
    'Street factors (noise, access, nearby developments)',
  ];
}

/**
 * Generate full valuation explanation
 */
export function generateExplanation(
  valuation: ValuationResult,
  area: string,
  months: number = 12,
  radiusMiles: number = 1
): ValuationExplanation {
  const { lowBand, highBand, confidence, compsUsed, medianPrice } = valuation;

  // Headline
  const headline = `Your Valory valuation range: £${lowBand.toLocaleString()} – £${highBand.toLocaleString()}\nConfidence: ${confidence}`;

  // Confidence statement
  const confidenceStatement = getConfidenceWording(confidence);

  // How we calculated it
  const howWeCalculated = [
    `We used ${compsUsed} sold comparables from the last ${months} months within roughly ${radiusMiles} mile${radiusMiles !== 1 ? 's' : ''}.`,
    'We prioritised homes that are most similar in property type and size.',
    'We then applied a small adjustment based on available signals like energy rating (EPC), floor area, and local demand.',
  ];

  // What this means
  const whatThisMeans =
    "If your priority is a quick sale, you'll usually sit closer to the lower end of the range.\n" +
    "If you're aiming for maximum price (and you're happy to wait longer / negotiate), you'll typically sit nearer the top end.";

  // What could move it
  const whatCouldMoveIt = getMovingFactors();

  // Important note
  const importantNote =
    'Land Registry sold prices can lag behind real-time activity because they\'re recorded after completion. ' +
    'That\'s why Valory combines sold evidence with live local signals to keep the valuation realistic.';

  // Next steps
  const nextSteps =
    'You can now choose how you\'d like to go to market: Agent-led launch, Self-list, or Hybrid. ' +
    'If you enable agent contact, we\'ll share your details with up to 5 vetted agents — so you get competition without being overwhelmed.';

  return {
    headline,
    confidenceStatement,
    howWeCalculated,
    whatThisMeans,
    whatCouldMoveIt,
    importantNote,
    nextSteps,
  };
}

/**
 * Format explanation for display
 */
export function formatExplanationForDisplay(explanation: ValuationExplanation): string {
  const sections: string[] = [];

  // Headline
  sections.push(`# ${explanation.headline}`);
  sections.push('');

  // Body intro
  sections.push(
    'This range is based on recent sold prices for similar homes in your area, ' +
      'adjusted for the details you provided and what the wider market is doing right now.'
  );
  sections.push('');

  // Confidence
  sections.push(`## Confidence Level\n${explanation.confidenceStatement}`);
  sections.push('');

  // How we calculated
  sections.push('## How We Calculated It');
  explanation.howWeCalculated.forEach(point => {
    sections.push(`• ${point}`);
  });
  sections.push('');

  // What this means
  sections.push('## What This Means in Real Life');
  sections.push(explanation.whatThisMeans);
  sections.push('');

  // What could move it
  sections.push('## What Could Move the Number Up or Down');
  explanation.whatCouldMoveIt.forEach(factor => {
    sections.push(`• ${factor}`);
  });
  sections.push('');

  // Important note
  sections.push('## Important Note');
  sections.push(explanation.importantNote);
  sections.push('');

  // Next steps
  sections.push('## Next Steps');
  sections.push(explanation.nextSteps);

  return sections.join('\n');
}

/**
 * Generate short explanation for quick display
 */
export function generateShortExplanation(valuation: ValuationResult): string {
  const { lowBand, highBand, confidence, compsUsed } = valuation;

  const confidenceEmoji: Record<string, string> = {
    High: '✓',
    Medium: '◐',
    Low: '⚠',
  };

  return (
    `${confidenceEmoji[confidence]} £${lowBand.toLocaleString()} – £${highBand.toLocaleString()} ` +
    `(${confidence} confidence, based on ${compsUsed} recent sales)`
  );
}

/**
 * Generate explanation with signals breakdown
 */
export function generateDetailedExplanation(
  valuation: ValuationResult,
  area: string,
  months: number = 12,
  radiusMiles: number = 1
): string {
  const explanation = generateExplanation(valuation, area, months, radiusMiles);
  const formatted = formatExplanationForDisplay(explanation);

  // Add signals breakdown
  const signalsSection = ['## Valuation Signals'];
  valuation.signals.forEach(signal => {
    const impact = signal.impact === 'positive' ? '↑' : signal.impact === 'negative' ? '↓' : '→';
    signalsSection.push(`${impact} **${signal.name}**: ${signal.value}`);
  });

  return formatted + '\n' + signalsSection.join('\n');
}

/**
 * Generate email-friendly explanation
 */
export function generateEmailExplanation(valuation: ValuationResult, area: string): string {
  const { lowBand, highBand, confidence, compsUsed } = valuation;

  return `
Hi,

Your Valory valuation for your property in ${area} is ready.

VALUATION RANGE: £${lowBand.toLocaleString()} – £${highBand.toLocaleString()}
CONFIDENCE: ${confidence}

This range is based on ${compsUsed} recent sold properties similar to yours in the local area.

${confidence === 'High' ? 'We have strong evidence from multiple recent sales.' : confidence === 'Medium' ? 'We have good evidence from recent sales, though there are fewer close matches.' : 'We have limited evidence. We recommend getting a local agent review.'}

WHAT COULD AFFECT YOUR PRICE:
• Condition and finish of the property
• Outside space (garden, parking, views)
• Layout and usability
• Local street factors and demand

Next, you can choose your route to market:
1. Agent-led launch (we connect you with vetted agents)
2. Self-list (manage the sale yourself)
3. Hybrid (combination approach)

Best regards,
The Valory Team
  `.trim();
}
