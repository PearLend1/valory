import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, MapPin, Home, DollarSign, Info } from 'lucide-react';

interface ValuationLayer {
  layer_name: string;
  layer_number: number;
  description: string;
  valuation_low: number;
  valuation_high: number;
  confidence: number;
  data_sources: string[];
  contribution_percentage: number;
}

interface ComparableProperty {
  id: string;
  address: string;
  distance_meters: number;
  sale_price: number;
  sale_date: string;
  bedrooms: number;
  bathrooms: number;
  similarity_score: number;
  adjustment_percentage: number;
}

interface SellerImprovement {
  improvement: string;
  estimated_value_increase: number;
  confidence: number;
}

interface ValuationExplanation {
  property_id: string;
  broad_valuation_low: number;
  broad_valuation_high: number;
  refined_valuation_low: number;
  refined_valuation_high: number;
  overall_confidence: number;
  confidence_reasons: string[];
  layers: ValuationLayer[];
  comparables: ComparableProperty[];
  seller_improvements: SellerImprovement[];
  what_would_tighten: string[];
  valuation_date: string;
  next_update_date: string;
}

interface ExplainMyValuationProps {
  propertyId: string;
  onClose?: () => void;
}

export const ExplainMyValuation: React.FC<ExplainMyValuationProps> = ({ propertyId, onClose }) => {
  const [valuation, setValuation] = useState<ValuationExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchValuation = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual tRPC call
        // const result = await trpc.valuation.explainValuation.useQuery({ propertyId });
        
        // Mock data for demonstration
        const mockData: ValuationExplanation = {
          property_id: propertyId,
          broad_valuation_low: 250000,
          broad_valuation_high: 350000,
          refined_valuation_low: 285000,
          refined_valuation_high: 305000,
          overall_confidence: 78,
          confidence_reasons: [
            'Strong comparable evidence from 12 recent sales',
            'Property condition aligns with market expectations',
            'Area showing stable market momentum',
            'Seller-provided improvements verified'
          ],
          layers: [
            {
              layer_name: 'Official Data',
              layer_number: 1,
              description: 'HM Land Registry price paid data + EPC ratings',
              valuation_low: 260000,
              valuation_high: 340000,
              confidence: 65,
              data_sources: ['HM Land Registry', 'EPC API'],
              contribution_percentage: 30
            },
            {
              layer_name: 'Commercial Data',
              layer_number: 2,
              description: 'Rightmove AVM + comparable properties',
              valuation_low: 280000,
              valuation_high: 310000,
              confidence: 72,
              data_sources: ['Rightmove AVM', 'PropertyData'],
              contribution_percentage: 35
            },
            {
              layer_name: 'Agent Intelligence',
              layer_number: 3,
              description: 'Agent feedback and market signals',
              valuation_low: 290000,
              valuation_high: 300000,
              confidence: 82,
              data_sources: ['Agent Feedback', 'Market Signals'],
              contribution_percentage: 20
            },
            {
              layer_name: 'VALORY Data',
              layer_number: 4,
              description: 'Seller input and market activity',
              valuation_low: 295000,
              valuation_high: 298000,
              confidence: 88,
              data_sources: ['Seller Input', 'Market Activity'],
              contribution_percentage: 15
            }
          ],
          comparables: [
            {
              id: 'comp_1',
              address: '42 Elm Street, SW1A 1AA',
              distance_meters: 150,
              sale_price: 295000,
              sale_date: '2024-02-15',
              bedrooms: 3,
              bathrooms: 2,
              similarity_score: 94,
              adjustment_percentage: 0
            },
            {
              id: 'comp_2',
              address: '15 Oak Avenue, SW1A 1AB',
              distance_meters: 280,
              sale_price: 305000,
              sale_date: '2024-01-20',
              bedrooms: 3,
              bathrooms: 2,
              similarity_score: 91,
              adjustment_percentage: 2
            },
            {
              id: 'comp_3',
              address: '88 Pine Road, SW1A 1AC',
              distance_meters: 420,
              sale_price: 280000,
              sale_date: '2023-12-10',
              bedrooms: 3,
              bathrooms: 1,
              similarity_score: 87,
              adjustment_percentage: -5
            }
          ],
          seller_improvements: [
            {
              improvement: 'Kitchen renovation (2023)',
              estimated_value_increase: 15000,
              confidence: 85
            },
            {
              improvement: 'New boiler installation',
              estimated_value_increase: 3000,
              confidence: 90
            },
            {
              improvement: 'Garden landscaping',
              estimated_value_increase: 2000,
              confidence: 60
            }
          ],
          what_would_tighten: [
            'Professional property survey (would increase confidence by ~10%)',
            'Recent energy performance certificate update',
            'Confirmation of any planning permissions or building regulations',
            'Detailed maintenance history documentation'
          ],
          valuation_date: new Date().toISOString(),
          next_update_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        setValuation(mockData);
        setError(null);
      } catch (err) {
        setError('Failed to load valuation explanation');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchValuation();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-copper mx-auto mb-4"></div>
                <p className="text-gray-400">Calculating your valuation...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !valuation) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <Card className="border-red-900/50 bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-red-400">{error || 'Failed to load valuation'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const confidenceColor = valuation.overall_confidence >= 80 ? 'text-green-400' : 
                          valuation.overall_confidence >= 60 ? 'text-yellow-400' : 'text-orange-400';

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Your Valuation Explained</h1>
        <p className="text-gray-400">Understand how we arrived at your property valuation</p>
      </div>

      {/* Valuation Overview */}
      <Card className="border-copper/30 bg-gradient-to-br from-slate-900 to-slate-800">
        <CardHeader>
          <CardTitle className="text-copper">Valuation Range</CardTitle>
          <CardDescription>Based on multiple data sources and market analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Broad Bracket */}
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Initial Bracket</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-300">
                £{valuation.broad_valuation_low.toLocaleString()}
              </span>
              <span className="text-gray-500">—</span>
              <span className="text-2xl font-bold text-gray-300">
                £{valuation.broad_valuation_high.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Refined Bracket */}
          <div className="space-y-2 pt-4 border-t border-copper/20">
            <p className="text-sm text-copper">Refined Bracket</p>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-copper">
                £{valuation.refined_valuation_low.toLocaleString()}
              </span>
              <span className="text-gray-500">—</span>
              <span className="text-3xl font-bold text-copper">
                £{valuation.refined_valuation_high.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 pt-2">
              Midpoint: £{Math.round((valuation.refined_valuation_low + valuation.refined_valuation_high) / 2).toLocaleString()}
            </p>
          </div>

          {/* Confidence Score */}
          <div className="pt-4 border-t border-copper/20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-400">Confidence Score</p>
              <span className={`text-2xl font-bold ${confidenceColor}`}>
                {valuation.overall_confidence}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-copper to-orange-400 h-2 rounded-full"
                style={{ width: `${valuation.overall_confidence}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Details */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-copper/20">
          <TabsTrigger value="overview" className="data-[state=active]:bg-copper/20">Overview</TabsTrigger>
          <TabsTrigger value="layers" className="data-[state=active]:bg-copper/20">Layers</TabsTrigger>
          <TabsTrigger value="comparables" className="data-[state=active]:bg-copper/20">Comparables</TabsTrigger>
          <TabsTrigger value="improvements" className="data-[state=active]:bg-copper/20">Improvements</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="border-copper/30">
            <CardHeader>
              <CardTitle className="text-lg">Why We're Confident</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {valuation.confidence_reasons.map((reason, idx) => (
                <div key={idx} className="flex gap-3">
                  <TrendingUp className="h-5 w-5 text-copper flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">{reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-copper/30">
            <CardHeader>
              <CardTitle className="text-lg">What Would Tighten This Valuation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {valuation.what_would_tighten.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <Info className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layers Tab */}
        <TabsContent value="layers" className="space-y-4">
          {valuation.layers.map((layer) => (
            <Card key={layer.layer_number} className="border-copper/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Layer {layer.layer_number}: {layer.layer_name}</CardTitle>
                    <CardDescription>{layer.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-copper text-copper">
                    {layer.contribution_percentage}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Valuation Range</p>
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span className="text-gray-300">£{layer.valuation_low.toLocaleString()}</span>
                    <span className="text-gray-300">£{layer.valuation_high.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">Confidence: {layer.confidence}%</p>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-copper h-2 rounded-full"
                      style={{ width: `${layer.confidence}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">Data Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {layer.data_sources.map((source) => (
                      <Badge key={source} variant="secondary" className="bg-slate-700 text-gray-300">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Comparables Tab */}
        <TabsContent value="comparables" className="space-y-4">
          <Card className="border-copper/30">
            <CardHeader>
              <CardTitle className="text-lg">Nearby Sold Properties</CardTitle>
              <CardDescription>Recent sales used to validate valuation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {valuation.comparables.map((comp) => (
                  <div key={comp.id} className="border border-copper/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-white">{comp.address}</p>
                        <p className="text-sm text-gray-400">{comp.bedrooms} bed, {comp.bathrooms} bath</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-copper">£{comp.sale_price.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{new Date(comp.sale_date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-400">{comp.distance_meters}m away</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Similarity:</span>
                        <span className="font-semibold text-copper">{comp.similarity_score}%</span>
                      </div>
                    </div>

                    {comp.adjustment_percentage !== 0 && (
                      <p className="text-sm text-amber-400">
                        Adjustment: {comp.adjustment_percentage > 0 ? '+' : ''}{comp.adjustment_percentage}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Improvements Tab */}
        <TabsContent value="improvements" className="space-y-4">
          <Card className="border-copper/30">
            <CardHeader>
              <CardTitle className="text-lg">Your Property Improvements</CardTitle>
              <CardDescription>Seller-entered improvements and estimated value impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {valuation.seller_improvements.map((improvement, idx) => (
                  <div key={idx} className="border border-copper/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">{improvement.improvement}</p>
                      <p className="text-lg font-bold text-copper">+£{improvement.estimated_value_increase.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Confidence: {improvement.confidence}%</p>
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div
                          className="bg-copper h-1.5 rounded-full"
                          style={{ width: `${improvement.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card className="border-copper/30 bg-slate-900/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Valuation Date</p>
              <p className="text-white font-semibold">{new Date(valuation.valuation_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-400">Next Update</p>
              <p className="text-white font-semibold">{new Date(valuation.next_update_date).toLocaleDateString()}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            This valuation is based on available data as of {new Date(valuation.valuation_date).toLocaleDateString()}. 
            Market conditions and property updates may affect future valuations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExplainMyValuation;
