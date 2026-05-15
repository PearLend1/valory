import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SentimentData {
  category: string;
  positive: number;
  neutral: number;
  concern: number;
}

interface AgentSentimentProps {
  propertyId?: string;
  feedbackCount?: number;
  lastUpdated?: string;
}

export function AgentSentiment({ 
  propertyId = 'demo-property',
  feedbackCount = 8,
  lastUpdated = '2 hours ago'
}: AgentSentimentProps) {
  // Mock sentiment data
  const sentimentData: SentimentData[] = [
    { category: 'Condition', positive: 60, neutral: 30, concern: 10 },
    { category: 'Price', positive: 40, neutral: 40, concern: 20 },
    { category: 'Location', positive: 80, neutral: 15, concern: 5 },
    { category: 'Marketability', positive: 70, neutral: 20, concern: 10 },
    { category: 'Potential', positive: 50, neutral: 35, concern: 15 },
  ];

  // Mock trend data (sentiment score over time)
  const trendData = [
    { day: 'Day 1', score: 0.45 },
    { day: 'Day 3', score: 0.50 },
    { day: 'Day 5', score: 0.55 },
    { day: 'Day 7', score: 0.58 },
    { day: 'Day 10', score: 0.62 },
    { day: 'Today', score: 0.65 },
  ];

  // Calculate overall sentiment score
  const overallScore = sentimentData.reduce((acc, item) => {
    return acc + ((item.positive - item.concern) / 100);
  }, 0) / sentimentData.length;

  // Generate key insights
  const insights = [
    { text: "Agents consistently praise your location (80% positive)", icon: CheckCircle2, color: 'text-amber-500' },
    { text: "Consider addressing condition updates (30% concern)", icon: AlertCircle, color: 'text-orange-500' },
    { text: "Strong marketability signals (70% positive)", icon: TrendingUp, color: 'text-amber-500' },
  ];

  const SentimentBar = ({ data }: { data: SentimentData }) => {
    const total = data.positive + data.neutral + data.concern;
    const positiveWidth = (data.positive / total) * 100;
    const neutralWidth = (data.neutral / total) * 100;
    const concernWidth = (data.concern / total) * 100;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{data.category}</span>
          <span className="text-sm font-semibold text-amber-500">{data.positive}% positive</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className="bg-amber-500 transition-all"
            style={{ width: `${positiveWidth}%` }}
          />
          <div
            className="bg-slate-600 transition-all"
            style={{ width: `${neutralWidth}%` }}
          />
          <div
            className="bg-orange-500 transition-all"
            style={{ width: `${concernWidth}%` }}
          />
        </div>
      </div>
    );
  };

  const TrendChart = () => {
    const maxScore = 1;
    const minScore = 0;
    const range = maxScore - minScore;

    return (
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-2 h-32">
          {trendData.map((point, idx) => {
            const height = ((point.score - minScore) / range) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-24">
                  <div
                    className="w-full max-w-2 bg-gradient-to-t from-amber-500 to-amber-400 rounded-t transition-all"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground text-center">{point.day}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="w-4 h-4 text-amber-500" />
          <span>Sentiment trending positive</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Agent Market Insights</h3>
        <p className="text-sm text-muted-foreground">
          What professional agents think about your property
        </p>
      </div>

      {/* Sentiment Distribution */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Sentiment Distribution</h4>
        <div className="space-y-4">
          {sentimentData.map((data) => (
            <SentimentBar key={data.category} data={data} />
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Key Insights</h4>
        <div className="space-y-2">
          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <div key={idx} className="flex items-start gap-3">
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${insight.color}`} />
                <p className="text-sm text-foreground">{insight.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sentiment Trend */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Sentiment Trend (Last 10 Days)</h4>
        <TrendChart />
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700 text-xs text-muted-foreground">
        <div>
          <p>Feedback from <span className="font-semibold text-foreground">{feedbackCount} agents</span></p>
        </div>
        <div>
          <p>Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-slate-700/30 rounded-lg p-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Privacy Protected:</span> No agent names, emails, or personal information is ever shared. All feedback is completely anonymized and aggregated.
        </p>
      </div>

      {/* Help Link */}
      <div className="text-center">
        <button className="text-xs text-amber-500 hover:text-amber-400 transition-colors">
          Learn more about Agent Insights →
        </button>
      </div>
    </Card>
  );
}
