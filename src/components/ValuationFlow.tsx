import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

interface ValuationFlowProps {
  propertyId: number;
  address: string;
  postcode: string;
  propertyType: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  onValuationComplete?: (valuation: any) => void;
}

type ConfidenceStage = 'early' | 'improving' | 'high';

interface ValuationData {
  estimatedPriceLow: number;
  estimatedPriceHigh: number;
  estimatedMidpoint: number;
  confidence: 'low' | 'medium' | 'high';
  confidenceScore: number;
  dataSources: any[];
  potentialScore?: number;
  missingDataSources?: string[];
}

const getConfidenceStage = (score: number): ConfidenceStage => {
  if (score < 60) return 'early';
  if (score < 80) return 'improving';
  return 'high';
};

const getConfidenceLabel = (stage: ConfidenceStage): string => {
  switch (stage) {
    case 'early':
      return 'Early estimate';
    case 'improving':
      return 'Getting more precise';
    case 'high':
      return 'High confidence';
  }
};

const getConfidenceDescription = (stage: ConfidenceStage): string => {
  switch (stage) {
    case 'early':
      return 'This is an initial estimate based on public market data. It will become more accurate as more information is added.';
    case 'improving':
      return 'This estimate is becoming more precise as we gather more market data. Adding agent insights will improve accuracy further.';
    case 'high':
      return 'This is a highly accurate estimate based on multiple data sources and market validation.';
  }
};

export default function ValuationFlow({
  propertyId,
  address,
  postcode,
  propertyType,
  price,
  bedrooms,
  bathrooms,
  squareFeet,
  onValuationComplete,
}: ValuationFlowProps) {
  const [valuation, setValuation] = useState<ValuationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateValuation = async () => {
    setLoading(true);
    setError(null);
    try {
      // In production, this would call the tRPC endpoint
      // const result = await trpc.valuation.calculateFourLayer.query({...})
      // For now, mock the response
      const mockValuation: ValuationData = {
        estimatedPriceLow: Math.round(price * 0.95),
        estimatedPriceHigh: Math.round(price * 1.05),
        estimatedMidpoint: price,
        confidence: 'medium',
        confidenceScore: 65,
        dataSources: [
          {
            type: 'public_data',
            sourceDetail: 'Land Registry & Postcode History',
            contribution: 35,
            dataPoints: 50,
            confidence: 'medium',
          },
          {
            type: 'api_data',
            sourceDetail: 'Market Comparables',
            contribution: 35,
            dataPoints: 20,
            confidence: 'medium',
          },
          {
            type: 'agent_intelligence',
            sourceDetail: 'Agent Insights',
            contribution: 0,
            dataPoints: 0,
            confidence: 'low',
          },
          {
            type: 'platform_native',
            sourceDetail: 'Engagement Data',
            contribution: 0,
            dataPoints: 0,
            confidence: 'low',
          },
        ],
        potentialScore: 85,
        missingDataSources: ['Agent pricing insights', 'Engagement data'],
      };
      setValuation(mockValuation);
      onValuationComplete?.(mockValuation);
    } catch (err) {
      setError('Failed to calculate valuation. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!valuation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Valuation</CardTitle>
          <CardDescription>Get an estimate for {address}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium">How this works</p>
              <p className="text-xs mt-1">
                We'll calculate a valuation using public market data, recent sales in your area, and current market trends. The estimate becomes more accurate as more data is added.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-900">
              {error}
            </div>
          )}

          <Button onClick={calculateValuation} disabled={loading} className="w-full">
            {loading ? 'Calculating...' : 'Get Valuation'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stage = getConfidenceStage(valuation.confidenceScore);
  const formatPrice = (price: number) => `£${price.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Main Valuation Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Your Property Valuation</CardTitle>
              <CardDescription>{address}</CardDescription>
            </div>
            <Badge className="bg-purple-100 text-purple-900 text-xs">
              {getConfidenceLabel(stage)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estimated Price */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Estimated Value</p>
            <div className="text-5xl font-bold text-purple-600">
              {formatPrice(valuation.estimatedMidpoint)}
            </div>
            <p className="text-sm text-gray-600">
              Likely range: {formatPrice(valuation.estimatedPriceLow)} – {formatPrice(valuation.estimatedPriceHigh)}
            </p>
          </div>

          {/* Confidence Meter */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Confidence Level</p>
              <span className="text-sm font-bold text-purple-600">{valuation.confidenceScore}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-green-500 transition-all"
                style={{ width: `${valuation.confidenceScore}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">
              {getConfidenceDescription(stage)}
            </p>
          </div>

          {/* Data Sources Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium">Based on:</p>
            <div className="space-y-2">
              {valuation.dataSources.map((source) => (
                <div key={source.type} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700">
                    {source.sourceDetail}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {source.contribution > 0 ? `${source.contribution.toFixed(0)}%` : 'Not yet'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Improvement Potential */}
          {valuation.potentialScore && valuation.potentialScore > valuation.confidenceScore && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex gap-2 items-start">
                <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Accuracy can improve</p>
                  <p className="text-blue-700 text-xs mt-1">
                    We can increase confidence to {valuation.potentialScore}% by adding:
                  </p>
                  <ul className="text-blue-700 text-xs mt-2 space-y-1">
                    {valuation.missingDataSources?.map((source) => (
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

          {/* Next Steps */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Next Steps</p>
            <div className="space-y-2">
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Review this valuation</p>
                  <p className="text-gray-600 text-xs">Does this seem reasonable for your property?</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-gray-600">Add more details (optional)</p>
                  <p className="text-gray-600 text-xs">Share agent insights or recent market activity to improve accuracy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setValuation(null)} className="flex-1">
              Recalculate
            </Button>
            <Button className="flex-1">Accept & Continue</Button>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-gray-600 text-center">
        This valuation is an estimate based on available market data. Actual property value may vary based on condition, location specifics, and market conditions.
      </p>
    </div>
  );
}
