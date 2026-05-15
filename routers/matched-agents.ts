/**
 * tRPC Router for Matched Agents
 * Handles retrieval of matched agents, agent contact, and selection tracking
 */

import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { matchAgentsForVendor, AgentForMatching } from '../fair-agent-matching';
import { generateMeritReasons } from '../agent-merit-signals';

export const matchedAgentsRouter = router({
  /**
   * Get matched agents for a property
   * Returns up to 5 best-fit agents with all quality signals
   */
  getMatchedAgents: protectedProcedure
    .input(
      z.object({
        propertyId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      // In production, fetch from database:
      // const property = await db.query.properties.findFirst({ where: eq(properties.id, input.propertyId) });
      // const agents = await db.query.users.findMany({ where: eq(users.role, 'agent') });
      // const meritScores = await db.query.agentReputationScores.findMany();

      // For now, return mock data structure
      const mockAgents: AgentForMatching[] = [
        {
          id: 1,
          name: 'Sarah Mitchell',
          tier: 'PREMIUM',
          postcode: 'SW1',
          meritScores: {
            feedbackScore: 18,
            realismScore: 17,
            marketingScore: 14,
            conductScore: 14,
            localRelevanceScore: 9,
            totalMeritScore: 72,
          },
          hasEarlyInterest: true,
          responseTime: 45,
        },
        {
          id: 2,
          name: 'James Chen',
          tier: 'STANDARD',
          postcode: 'SW1',
          meritScores: {
            feedbackScore: 19,
            realismScore: 18,
            marketingScore: 13,
            conductScore: 13,
            localRelevanceScore: 10,
            totalMeritScore: 73,
          },
          hasEarlyInterest: false,
          responseTime: 120,
        },
        {
          id: 3,
          name: 'Emma Rodriguez',
          tier: 'PREMIUM',
          postcode: 'SW1',
          meritScores: {
            feedbackScore: 16,
            realismScore: 15,
            marketingScore: 12,
            conductScore: 12,
            localRelevanceScore: 8,
            totalMeritScore: 63,
          },
          hasEarlyInterest: true,
          responseTime: 60,
        },
      ];

      // Use fair matching engine
      const matchingResult = matchAgentsForVendor(mockAgents, 'SW1', 5);

      // Transform to vendor-facing format
      const matchedAgents = matchingResult.matchedAgents.map((match) => {
        const agent = mockAgents.find((a) => a.id === match.agentId)!;

        return {
          agentId: match.agentId,
          name: agent.name,
          profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.name}`,
          matchReasons: match.matchReasons,
          matchScore: match.matchScore,
          meritScore: match.meritScore,
          localRelevance: {
            postcode: agent.postcode || 'SW1',
            yearsInArea: Math.floor(Math.random() * 15) + 2,
            coverage: '5+ postcodes',
          },
          marketingQuality: {
            score: agent.meritScores.marketingScore,
            style: agent.meritScores.marketingScore > 12 ? 'Modern & Creative' : 'Professional',
            profileCompleteness: Math.floor(Math.random() * 30) + 70,
          },
          valuationRealism: {
            accuracy: Math.round(agent.meritScores.realismScore * 5),
            approach: agent.meritScores.realismScore > 16 ? 'Market-driven' : 'Conservative',
          },
          feedback: {
            averageRating: (agent.meritScores.feedbackScore / 4 + 0.5).toFixed(1),
            count: Math.floor(Math.random() * 30) + 5,
          },
          earlyInterest: match.hasEarlyInterest,
          responseTime: agent.responseTime || 120,
        };
      });

      return {
        agents: matchedAgents,
        totalMatched: matchedAgents.length,
        matchingAlgorithmVersion: '1.0.0',
      };
    }),

  /**
   * Contact an agent
   * Records contact attempt and notifies agent
   */
  contactAgent: protectedProcedure
    .input(
      z.object({
        agentId: z.number(),
        propertyId: z.number(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In production:
      // 1. Verify vendor owns property
      // 2. Create contact record in database
      // 3. Send notification to agent
      // 4. Record contact timestamp

      return {
        success: true,
        contactId: Math.random().toString(36).substring(7),
        message: 'Contact request sent to agent',
        agentResponseTime: '2-4 hours',
      };
    }),

  /**
   * Select an agent
   * Marks agent as selected by vendor
   */
  selectAgent: protectedProcedure
    .input(
      z.object({
        agentId: z.number(),
        propertyId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In production:
      // 1. Verify vendor owns property
      // 2. Update agent_vendor_matches status to 'SELECTED'
      // 3. Notify agent of selection
      // 4. Record selection timestamp

      return {
        success: true,
        message: 'Agent selected',
        nextStep: 'Agent will contact you shortly',
      };
    }),

  /**
   * Get agent profile details
   * Returns full agent profile for vendor viewing
   */
  getAgentProfile: protectedProcedure
    .input(
      z.object({
        agentId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      // In production: fetch from database
      return {
        agentId: input.agentId,
        name: 'Sarah Mitchell',
        bio: 'Specializing in luxury properties in SW London with 8+ years of experience.',
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah`,
        specializations: ['Luxury Properties', 'Period Homes', 'Investment Properties'],
        yearsExperience: 8,
        transactionsCompleted: 127,
        averageTimeToSale: '42 days',
        marketingApproach: 'Modern digital-first with professional photography and video tours',
        testimonials: [
          {
            vendor: 'John Smith',
            rating: 5,
            comment: 'Sarah was professional, responsive, and got us a great price.',
          },
          {
            vendor: 'Emma Johnson',
            rating: 5,
            comment: 'Excellent marketing strategy. Sold in record time.',
          },
        ],
        contactInfo: {
          phone: '+44 (0) 20 XXXX XXXX',
          email: 'sarah@agency.com',
          office: 'Chelsea, London',
        },
      };
    }),

  /**
   * Record vendor feedback on agent
   * Allows vendors to rate agents after interaction
   */
  recordAgentFeedback: protectedProcedure
    .input(
      z.object({
        agentId: z.number(),
        propertyId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        feedbackType: z.enum(['COMMUNICATION', 'PROFESSIONALISM', 'ACCURACY', 'MARKETING', 'OVERALL']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In production:
      // 1. Verify vendor owns property
      // 2. Create feedback record in database
      // 3. Update agent reputation scores
      // 4. Notify agent of feedback

      return {
        success: true,
        message: 'Feedback recorded',
        feedbackId: Math.random().toString(36).substring(7),
      };
    }),

  /**
   * Get contact history for property
   * Shows which agents vendor has contacted
   */
  getContactHistory: protectedProcedure
    .input(
      z.object({
        propertyId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      // In production: fetch from database
      return {
        propertyId: input.propertyId,
        contacts: [
          {
            agentId: 1,
            agentName: 'Sarah Mitchell',
            contactedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            status: 'CONTACTED',
            agentResponse: {
              respondedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
              responseTime: 60, // minutes
              message: 'Interested in viewing the property',
            },
          },
        ],
        totalContacted: 1,
      };
    }),

  /**
   * Get matched agents summary
   * Quick overview of all matched agents
   */
  getMatchedAgentsSummary: protectedProcedure
    .input(
      z.object({
        propertyId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      // In production: fetch from database
      return {
        propertyId: input.propertyId,
        totalMatched: 3,
        premiumCount: 2,
        standardCount: 1,
        averageMatchScore: 68,
        averageFeedback: 4.6,
        topAgent: {
          agentId: 2,
          name: 'James Chen',
          matchScore: 73,
        },
      };
    }),
});

export default matchedAgentsRouter;
