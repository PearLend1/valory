import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Star,
  MapPin,
  Award,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface AgentComparisonData {
  agentId: number;
  name: string;
  photo: string;
  bio: string;
  yearsExperience: number;
  specializations: string[];
  certifications: string[];
  ranking: {
    position: number;
    totalScore: number;
    factors: {
      accuracyScore: number;
      marketingScore: number;
      engagementScore: number;
      expertiseScore: number;
      responsivenessScore: number;
    };
    explanation: string;
  };
  localExpertise: {
    yearsInArea: number;
    propertiesSoldInArea: number;
    localReputation: number;
  };
  engagement: {
    responseQuality: string;
    responseTime: string;
    isThoughtful: boolean;
    relevanceToProperty: string;
  };
  pricing: {
    realism: string;
    alignmentWithValuation: number;
  };
}

interface AgentComparisonProps {
  agents: AgentComparisonData[];
  onSelectAgent: (agentId: number) => void;
  selectedAgentId?: number;
}

export default function AgentComparison({
  agents,
  onSelectAgent,
  selectedAgentId,
}: AgentComparisonProps) {
  // Prepare data for radar chart
  const radarData = useMemo(
    () =>
      agents.map((agent) => ({
        name: agent.name,
        Accuracy: agent.ranking.factors.accuracyScore,
        Marketing: agent.ranking.factors.marketingScore,
        Engagement: agent.ranking.factors.engagementScore,
        Expertise: agent.ranking.factors.expertiseScore,
        Responsiveness: agent.ranking.factors.responsivenessScore,
      })),
    [agents]
  );

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-900';
    if (score >= 70) return 'bg-blue-100 text-blue-900';
    if (score >= 60) return 'bg-amber-100 text-amber-900';
    return 'bg-red-100 text-red-900';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Compare Agents</h2>
        <p className="text-gray-600">
          Agents are ranked by quality, expertise, and engagement—not just response speed. Choose based on what matters
          most to you.
        </p>
      </div>

      {/* Radar Chart - Overall Comparison */}
      {agents.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Quality Profile Comparison</CardTitle>
            <CardDescription>
              How agents compare across accuracy, marketing, engagement, expertise, and responsiveness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                {agents.map((agent, index) => (
                  <Radar
                    key={agent.agentId}
                    name={agent.name}
                    dataKey={agent.name}
                    stroke={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]}
                    fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]}
                    fillOpacity={0.25}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Agent Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card
            key={agent.agentId}
            className={`cursor-pointer transition-all ${
              selectedAgentId === agent.agentId ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'
            }`}
            onClick={() => onSelectAgent(agent.agentId)}
          >
            <CardHeader>
              {/* Rank Badge */}
              <div className="flex items-start justify-between mb-3">
                <Badge className="bg-blue-100 text-blue-900">#{agent.ranking.position}</Badge>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(agent.ranking.totalScore)}`}>
                    {Math.round(agent.ranking.totalScore)}
                  </div>
                  <p className="text-xs text-gray-500">Quality Score</p>
                </div>
              </div>

              {/* Agent Info */}
              <div className="flex gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                  <p className="text-sm text-gray-600">{agent.yearsExperience} years experience</p>
                </div>
              </div>

              {/* Bio */}
              <p className="text-sm text-gray-600 line-clamp-2">{agent.bio}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Quality Scores */}
              <div className="space-y-3 bg-gray-50 p-3 rounded">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Quality Breakdown</h4>

                {/* Accuracy */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-gray-700">Pricing Realism</label>
                    <span className={`text-xs font-semibold ${getScoreColor(agent.ranking.factors.accuracyScore)}`}>
                      {Math.round(agent.ranking.factors.accuracyScore)}
                    </span>
                  </div>
                  <Progress value={agent.ranking.factors.accuracyScore} className="h-2" />
                  <p className="text-xs text-gray-600 mt-1">{agent.pricing.realism}</p>
                </div>

                {/* Marketing */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-gray-700">Marketing Quality</label>
                    <span className={`text-xs font-semibold ${getScoreColor(agent.ranking.factors.marketingScore)}`}>
                      {Math.round(agent.ranking.factors.marketingScore)}
                    </span>
                  </div>
                  <Progress value={agent.ranking.factors.marketingScore} className="h-2" />
                </div>

                {/* Engagement */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-gray-700">Response Quality</label>
                    <span className={`text-xs font-semibold ${getScoreColor(agent.ranking.factors.engagementScore)}`}>
                      {Math.round(agent.ranking.factors.engagementScore)}
                    </span>
                  </div>
                  <Progress value={agent.ranking.factors.engagementScore} className="h-2" />
                  <p className="text-xs text-gray-600 mt-1">{agent.engagement.responseQuality}</p>
                </div>

                {/* Expertise */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-gray-700">Local Expertise</label>
                    <span className={`text-xs font-semibold ${getScoreColor(agent.ranking.factors.expertiseScore)}`}>
                      {Math.round(agent.ranking.factors.expertiseScore)}
                    </span>
                  </div>
                  <Progress value={agent.ranking.factors.expertiseScore} className="h-2" />
                  <p className="text-xs text-gray-600 mt-1">
                    {agent.localExpertise.yearsInArea} years in area, {agent.localExpertise.propertiesSoldInArea} sales
                  </p>
                </div>

                {/* Responsiveness (Light Signal) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-gray-700">Responsiveness</label>
                    <span className={`text-xs font-semibold ${getScoreColor(agent.ranking.factors.responsivenessScore)}`}>
                      {Math.round(agent.ranking.factors.responsivenessScore)}
                    </span>
                  </div>
                  <Progress value={agent.ranking.factors.responsivenessScore} className="h-2" />
                  <p className="text-xs text-gray-600 mt-1">{agent.engagement.responseTime}</p>
                </div>
              </div>

              {/* Engagement Quality */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Engagement</h4>
                <div className="space-y-1">
                  {agent.engagement.isThoughtful && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Thoughtful, personalized responses</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-700">{agent.engagement.relevanceToProperty}</span>
                  </div>
                </div>
              </div>

              {/* Specializations */}
              {agent.specializations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">Specializations</h4>
                  <div className="flex flex-wrap gap-1">
                    {agent.specializations.slice(0, 3).map((spec) => (
                      <Badge key={spec} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                    {agent.specializations.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{agent.specializations.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Ranking Explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-gray-700 italic">{agent.ranking.explanation}</p>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => onSelectAgent(agent.agentId)}
                variant={selectedAgentId === agent.agentId ? 'default' : 'outline'}
                className="w-full"
              >
                {selectedAgentId === agent.agentId ? 'Selected' : 'Select Agent'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fair Ranking Explanation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">How We Rank Agents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-gray-700">
            Valory ranks agents fairly to help you find the best fit—not just the fastest responder.
          </p>
          <div className="space-y-2">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-semibold text-gray-900">Pricing Realism (25%)</p>
                <p className="text-gray-600">Agents whose estimates align with market data rank higher</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-semibold text-gray-900">Marketing Quality (25%)</p>
                <p className="text-gray-600">Strong profiles, personality, and modern marketing approach</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-semibold text-gray-900">Response Quality (20%)</p>
                <p className="text-gray-600">Thoughtful, personalized responses matter more than speed</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div>
                <p className="font-semibold text-gray-900">Local Expertise (20%)</p>
                <p className="text-gray-600">Market knowledge and experience in your area</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">
                5
              </div>
              <div>
                <p className="font-semibold text-gray-900">Responsiveness (10%)</p>
                <p className="text-gray-600">Fair response time—not a dominant factor</p>
              </div>
            </div>
          </div>
          <p className="text-gray-700 italic border-t border-blue-200 pt-3">
            This approach helps independents and larger teams compete fairly on quality and expertise.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
