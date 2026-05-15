import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Users, BarChart3 } from 'lucide-react';
import AgentMatchCard, { AgentMatchCardProps } from './AgentMatchCard';

export interface MatchedAgent extends AgentMatchCardProps {
  agentId: number;
  matchScore: number;
  meritScore: number;
}

export interface MatchedAgentsShortlistProps {
  agents: MatchedAgent[];
  propertyAddress: string;
  propertyType: string;
  loading?: boolean;
  onAgentContact?: (agentId: number) => void;
  onAgentSelect?: (agentId: number) => void;
  onViewProfile?: (agentId: number) => void;
}

export const MatchedAgentsShortlist: React.FC<MatchedAgentsShortlistProps> = ({
  agents,
  propertyAddress,
  propertyType,
  loading = false,
  onAgentContact,
  onAgentSelect,
  onViewProfile,
}) => {
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  const handleSelectAgent = (agentId: number) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
    onAgentSelect?.(agentId);
  };

  const handleContactAgent = (agentId: number) => {
    onAgentContact?.(agentId);
  };

  const handleViewProfile = (agentId: number) => {
    onViewProfile?.(agentId);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Finding your best-fit agents...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900">No agents available yet</p>
              <p className="text-sm text-blue-700">
                We're still finding the best matches for your {propertyType} at {propertyAddress}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Matched Agents</h2>
            <p className="text-sm text-gray-600 mt-1">
              {agents.length} agent{agents.length !== 1 ? 's' : ''} curated for {propertyType} at {propertyAddress}
            </p>
          </div>
          <Badge className="bg-purple-100 text-purple-700 text-base px-3 py-1">
            {agents.length} Matches
          </Badge>
        </div>

        {/* Info Banner */}
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-900">
            Each agent below has been selected based on local expertise, marketing quality, valuation accuracy, and
            vendor feedback. You're in full control—contact as many agents as you'd like.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="shortlist" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shortlist" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Shortlist View
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Compare
          </TabsTrigger>
        </TabsList>

        {/* Shortlist View */}
        <TabsContent value="shortlist" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.agentId}
                onClick={() => handleSelectAgent(agent.agentId)}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <AgentMatchCard
                  {...agent}
                  isSelected={selectedAgents.includes(agent.agentId)}
                  onContact={() => handleContactAgent(agent.agentId)}
                  onViewProfile={() => handleViewProfile(agent.agentId)}
                />
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              <strong>Next step:</strong> Contact one or more agents to discuss your property. They'll respond with
              their marketing strategy and next steps.
            </p>
          </div>
        </TabsContent>

        {/* Compare View */}
        <TabsContent value="compare" className="space-y-4">
          <ComparisonTable agents={agents} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Comparison table for detailed agent metrics
 */
const ComparisonTable: React.FC<{ agents: MatchedAgent[] }> = ({ agents }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-3 font-semibold text-gray-700">Agent</th>
            <th className="text-center p-3 font-semibold text-gray-700">Local Knowledge</th>
            <th className="text-center p-3 font-semibold text-gray-700">Marketing</th>
            <th className="text-center p-3 font-semibold text-gray-700">Valuation</th>
            <th className="text-center p-3 font-semibold text-gray-700">Feedback</th>
            <th className="text-center p-3 font-semibold text-gray-700">Match Score</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.agentId} className="border-b hover:bg-gray-50">
              <td className="p-3 font-semibold text-gray-900">{agent.name}</td>
              <td className="text-center p-3">
                <div className="text-sm">
                  <div className="font-semibold text-gray-700">{agent.localRelevance.yearsInArea} yrs</div>
                  <div className="text-xs text-gray-500">{agent.localRelevance.postcode}</div>
                </div>
              </td>
              <td className="text-center p-3">
                <div className="text-sm">
                  <div className="font-semibold text-gray-700">
                    {Math.round((agent.marketingQuality.score / 15) * 100)}%
                  </div>
                  <div className="text-xs text-gray-500">{agent.marketingQuality.style}</div>
                </div>
              </td>
              <td className="text-center p-3">
                <div className="text-sm">
                  <div className="font-semibold text-gray-700">{Math.round(agent.valuationRealism.accuracy)}%</div>
                  <div className="text-xs text-gray-500">Accurate</div>
                </div>
              </td>
              <td className="text-center p-3">
                <div className="text-sm">
                  <div className="font-semibold text-yellow-500">{agent.feedback.averageRating.toFixed(1)}★</div>
                  <div className="text-xs text-gray-500">{agent.feedback.count} reviews</div>
                </div>
              </td>
              <td className="text-center p-3">
                <div className="text-sm">
                  <div className="font-bold text-purple-600">{Math.round(agent.matchScore)}</div>
                  <div className="text-xs text-gray-500">/ 100</div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Comparison Legend */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-900">
        <p className="font-semibold mb-2">How to read this comparison:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>Local Knowledge:</strong> Years in area + postcode coverage</li>
          <li><strong>Marketing:</strong> Profile quality and presentation (0-100%)</li>
          <li><strong>Valuation:</strong> Historical accuracy of price estimates</li>
          <li><strong>Feedback:</strong> Average vendor rating and review count</li>
          <li><strong>Match Score:</strong> Overall fit for your property (0-100)</li>
        </ul>
      </div>
    </div>
  );
};

export default MatchedAgentsShortlist;
