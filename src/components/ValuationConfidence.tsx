import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, Database, Users, Zap } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DataSource {
  type: 'public_data' | 'api_data' | 'agent_intelligence' | 'platform_native';
  sourceDetail: string;
  contribution: number; // Percentage
  dataPoints: number;
  confidence: 'low' | 'medium' | 'high';
  estimatedValue?: number;
}

interface ValuationConfidenceProps {
  estimatedPriceLow: number;
  estimatedPriceHigh: number;
  estimatedMidpoint: number;
  confidence: 'low' | 'medium' | 'high';
  confidenceScore: number; // 0-100
  dataSources: DataSource[];
  reasoning: string;
  potentialScore?: number;
  missingDataSources?: string[];
}

const getConfidenceColor = (confidence: 'low' | 'medium' | 'high'): string => {
  switch (confidence) {
    case 'high':
      return 'bg-green-50 border-green-200';
    case 'medium':
      return 'bg-yellow-50 border-yellow-200';
    case 'low':
      return 'bg-red-50 border-red-200';
  }
};

const getConfidenceBadgeColor = (confidence: 'low' | 'medium' | 'high'): string => {
  switch (confidence) {
    case 'high':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-red-100 text-red-800';
  }
};

const getSourceIcon = (type: string) => {
  switch (type) {
    case 'public_data':
      return <Database className="w-4 h-4" />;
    case 'api_data':
      return <TrendingUp className="w-4 h-4" />;
    case 'agent_intelligence':
      return <Users className="w-4 h-4" />;
    case 'platform_native':
      return <Zap className="w-4 h-4" />;
    default:
      return null;
  }
};

const getSourceLabel = (type: string): string => {
  switch (type) {
    case 'public_data':
      return 'Public Data';
    case 'api_data':
      return 'Market Data';
    case 'agent_intelligence':
      return 'Agent Insight';
    case 'platform_native':
      return 'Platform Data';
    default:
      return type;
  }
};

export default function ValuationConfidence({
  estimatedPriceLow,
  estimatedPriceHigh,
  estimatedMidpoint,
  confidence,
  confidenceScore,
  dataSources,
  reasoning,
  potentialScore,
  missingDataSources,
}: ValuationConfidenceProps) {
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  const formatPrice = (price: number): string => {
    return `£${price.toLocaleString()}`;
  };

  const priceRange = estimatedPriceHigh - estimatedPriceLow;
  const priceRangePercent = ((priceRange / estimatedMidpoint) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Main Valuation Card */}
      <Card className={`border-2 ${getConfidenceColor(confidence)}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Estimated Valuation</CardTitle>
              <CardDescription>Based on four-layer data model</CardDescription>
            </div>
            <Badge className={getConfidenceBadgeColor(confidence)}>
              {confidence.toUpperCase()} CONFIDENCE
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Price Range */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-600">Price Range</span>
              <span className="text-xs text-gray-500">±{priceRangePercent}%</span>
            </div>
            <div className="text-4xl font-bold text-purple-600">
              {formatPrice(estimatedMidpoint)}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{formatPrice(estimatedPriceLow)}</span>
              <span>{formatPrice(estimatedPriceHigh)}</span>
            </div>
            <Progress value={(priceRange / estimatedMidpoint) * 100} className="h-2" />
          </div>

          {/* Confidence Score */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Confidence Score</span>
              <span className="text-lg font-bold text-purple-600">{confidenceScore}%</span>
            </div>
            <Progress value={confidenceScore} className="h-3" />
            <p className="text-xs text-gray-600">
              {confidenceScore > 75
                ? 'High confidence based on multiple data sources'
                : confidenceScore > 50
                ? 'Moderate confidence. More data will improve accuracy.'
                : 'Low confidence. Additional data sources needed.'}
            </p>
          </div>

          {/* Improvement Potential */}
          {potentialScore && potentialScore > confidenceScore && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Confidence Can Improve</p>
                  <p className="text-blue-700 text-xs mt-1">
                    Confidence could reach {potentialScore}% with:
                  </p>
                  <ul className="text-blue-700 text-xs mt-2 space-y-1">
                    {missingDataSources?.map((source) => (
                      <li key={source} className="flex gap-2">
                        <span>•</span>
                        <span>{source}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Sources Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Sources</CardTitle>
          <CardDescription>How this valuation was calculated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dataSources.map((source) => (
            <div key={source.type} className="space-y-2">
              {/* Source Header */}
              <button
                onClick={() =>
                  setExpandedSource(expandedSource === source.type ? null : source.type)
                }
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-gray-600">{getSourceIcon(source.type)}</div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{getSourceLabel(source.type)}</p>
                      <p className="text-xs text-gray-600">{source.sourceDetail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {source.contribution.toFixed(1)}%
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {source.confidence}
                    </Badge>
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {expandedSource === source.type && (
                <div className="ml-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 text-xs">Data Points</p>
                      <p className="font-semibold">{source.dataPoints}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Confidence</p>
                      <p className="font-semibold capitalize">{source.confidence}</p>
                    </div>
                  </div>
                  {source.estimatedValue && (
                    <div>
                      <p className="text-gray-600 text-xs">This Source's Estimate</p>
                      <p className="font-semibold text-purple-600">
                        {formatPrice(source.estimatedValue)}
                      </p>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-xs text-blue-600 hover:text-blue-700">
                            How this source works →
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-xs">
                            {source.type === 'public_data' &&
                              'Uses Land Registry sold prices and postcode transaction history to establish baseline values.'}
                            {source.type === 'api_data' &&
                              'Compares with similar properties from market data APIs to validate market positioning.'}
                            {source.type === 'agent_intelligence' &&
                              'Incorporates local agent expertise and market adjustments based on real experience.'}
                            {source.type === 'platform_native' &&
                              'Analyzes viewing velocity, offers, and engagement patterns from Valory platform.'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )}

              {/* Contribution Bar */}
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    source.confidence === 'high'
                      ? 'bg-green-500'
                      : source.confidence === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${source.contribution}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reasoning & Methodology */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Valuation Methodology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono text-xs leading-relaxed">
              {reasoning}
            </p>
          </div>
          <p className="text-xs text-gray-600 mt-4">
            💡 <strong>How this improves over time:</strong> As more data is added by the vendor
            (agent insights, price adjustments) and as Valory learns from platform behavior
            (viewing patterns, offers, final outcomes), the confidence score increases and the
            price range narrows, making valuations increasingly accurate.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
