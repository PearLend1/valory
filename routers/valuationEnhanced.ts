/**
 * Enhanced Valuation Router
 * tRPC endpoints for production-ready valuations with comparable selection
 * and vendor-friendly explanations
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import {
  buildCandidateSet,
  buildValuation,
  type Subject,
} from '../services/comparableSelection';
import {
  generateExplanation,
  generateDetailedExplanation,
  generateEmailExplanation,
  generateShortExplanation,
} from '../services/valuationExplainer';

const valuationInputSchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  typeBucket: z.enum(['house', 'flat', 'other']),
  beds: z.number().int().min(0).max(10).optional(),
  areaSqm: z.number().min(10).max(10000).optional(),
  postcode: z.string().min(5).max(8).optional(),
  postcodeOutcode: z.string().min(2).max(10).optional(),
  area: z.string().min(2).max(100).optional(),
});

export const valuationEnhancedRouter = router({
  /**
   * Get valuation with comparable selection algorithm
   * Returns estimate, band, confidence, and comps used
   */
  estimate: publicProcedure
    .input(valuationInputSchema)
    .query(async ({ input }) => {
      try {
        const subject: Subject = {
          lat: input.lat,
          lng: input.lng,
          typeBucket: input.typeBucket,
          beds: input.beds,
          areaSqm: input.areaSqm,
          postcode: input.postcode,
          postcodeOutcode: input.postcodeOutcode,
        };

        // Build candidate set with intelligent fallback
        const comps = await buildCandidateSet(subject);

        if (comps.length === 0) {
          return {
            success: false,
            error: 'No comparable sales found in this area. Try a different location or contact an agent.',
          };
        }

        // Build valuation from comps
        const valuation = buildValuation(subject, comps);

        return {
          success: true,
          data: {
            estimate: valuation.estimate,
            lowBand: valuation.lowBand,
            highBand: valuation.highBand,
            confidence: valuation.confidence,
            compsUsed: valuation.compsUsed,
            medianPrice: valuation.medianPrice,
            ppsqm: valuation.ppsqm,
            signals: valuation.signals,
          },
        };
      } catch (error) {
        console.error('[Valuation] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Valuation generation failed',
        };
      }
    }),

  /**
   * Get full valuation with vendor-friendly explanation
   */
  estimateWithExplanation: publicProcedure
    .input(valuationInputSchema)
    .query(async ({ input }) => {
      try {
        const subject: Subject = {
          lat: input.lat,
          lng: input.lng,
          typeBucket: input.typeBucket,
          beds: input.beds,
          areaSqm: input.areaSqm,
          postcode: input.postcode,
          postcodeOutcode: input.postcodeOutcode,
        };

        const comps = await buildCandidateSet(subject);

        if (comps.length === 0) {
          return {
            success: false,
            error: 'No comparable sales found. Please try a different location.',
          };
        }

        const valuation = buildValuation(subject, comps);
        const area = input.area || input.postcodeOutcode || 'your area';

        const explanation = generateExplanation(valuation, area);
        const detailed = generateDetailedExplanation(valuation, area);
        const short = generateShortExplanation(valuation);

        return {
          success: true,
          data: {
            valuation: {
              estimate: valuation.estimate,
              lowBand: valuation.lowBand,
              highBand: valuation.highBand,
              confidence: valuation.confidence,
              compsUsed: valuation.compsUsed,
            },
            explanation: {
              headline: explanation.headline,
              confidenceStatement: explanation.confidenceStatement,
              howWeCalculated: explanation.howWeCalculated,
              whatThisMeans: explanation.whatThisMeans,
              whatCouldMoveIt: explanation.whatCouldMoveIt,
              importantNote: explanation.importantNote,
              nextSteps: explanation.nextSteps,
            },
            formatted: {
              detailed,
              short,
            },
          },
        };
      } catch (error) {
        console.error('[Valuation] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate valuation',
        };
      }
    }),

  /**
   * Get valuation explanation as email-friendly text
   */
  getEmailExplanation: publicProcedure
    .input(valuationInputSchema)
    .query(async ({ input }) => {
      try {
        const subject: Subject = {
          lat: input.lat,
          lng: input.lng,
          typeBucket: input.typeBucket,
          beds: input.beds,
          areaSqm: input.areaSqm,
          postcode: input.postcode,
          postcodeOutcode: input.postcodeOutcode,
        };

        const comps = await buildCandidateSet(subject);

        if (comps.length === 0) {
          return {
            success: false,
            error: 'No comparable sales found.',
          };
        }

        const valuation = buildValuation(subject, comps);
        const area = input.area || input.postcodeOutcode || 'your area';
        const emailText = generateEmailExplanation(valuation, area);

        return {
          success: true,
          data: {
            email: emailText,
            subject: `Your Valory Valuation: £${valuation.lowBand.toLocaleString()} – £${valuation.highBand.toLocaleString()}`,
          },
        };
      } catch (error) {
        console.error('[Valuation] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate email',
        };
      }
    }),

  /**
   * Get comparable sales used in valuation
   */
  getComparables: publicProcedure
    .input(valuationInputSchema)
    .query(async ({ input }) => {
      try {
        const subject: Subject = {
          lat: input.lat,
          lng: input.lng,
          typeBucket: input.typeBucket,
          beds: input.beds,
          areaSqm: input.areaSqm,
          postcode: input.postcode,
          postcodeOutcode: input.postcodeOutcode,
        };

        const comps = await buildCandidateSet(subject);

        if (comps.length === 0) {
          return {
            success: false,
            error: 'No comparable sales found.',
          };
        }

        const valuation = buildValuation(subject, comps);

        return {
          success: true,
          data: {
            comps: comps.slice(0, valuation.compsUsed).map(c => ({
              price: c.price,
              date: c.date.toISOString(),
              type: c.ppdType,
              beds: c.beds,
              areaSqm: c.areaSqm,
              distance: c.distance,
            })),
            count: valuation.compsUsed,
            medianPrice: valuation.medianPrice,
            ppsqm: valuation.ppsqm,
          },
        };
      } catch (error) {
        console.error('[Valuation] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get comparables',
        };
      }
    }),

  /**
   * Explain confidence level in detail
   */
  explainConfidence: publicProcedure
    .input(
      z.object({
        confidence: z.enum(['High', 'Medium', 'Low']),
        compsUsed: z.number().int().min(0),
        recentComps: z.number().int().min(0),
        hasArea: z.boolean(),
      })
    )
    .query(({ input }) => {
      const explanations: Record<
        string,
        { title: string; description: string }
      > = {
        High: {
          title: 'Strong Evidence',
          description:
            'We have lots of similar recent sales nearby. This valuation is based on solid market data.',
        },
        Medium: {
          title: 'Good Evidence',
          description:
            'We have good evidence from recent sales, but there are fewer close matches or slightly older sales. The valuation is reliable but with a slightly wider band.',
        },
        Low: {
          title: 'Limited Evidence',
          description:
            'This property is unique, the market is sparse, or we have incomplete details. We recommend getting a quick review from a local agent to validate this valuation.',
        },
      };

      const explanation = explanations[input.confidence];

      return {
        success: true,
        data: {
          confidence: input.confidence,
          title: explanation?.title || 'Unknown',
          description: explanation?.description || '',
          factors: {
            compsUsed: `${input.compsUsed} comparable sales used`,
            recency: `${input.recentComps} within 12 months`,
            hasArea: input.hasArea ? 'Floor area available (more accurate)' : 'No floor area (less accurate)',
          },
          recommendation:
            input.confidence === 'Low'
              ? 'Contact a local agent for a professional valuation'
              : 'Use this valuation to guide your pricing strategy',
        },
      };
    }),
});
