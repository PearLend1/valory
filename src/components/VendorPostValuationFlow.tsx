import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, Shield, Users, Zap } from 'lucide-react';

interface VendorPostValuationFlowProps {
  propertyId: number;
  address: string;
  estimatedPrice: number;
  onProceedToProfile: () => void;
  onSaveForLater: () => void;
}

const PROFILE_STEPS = [
  {
    number: 1,
    title: 'Add Property Images',
    description: 'Upload high-quality photos of your property',
    icon: '📸',
  },
  {
    number: 2,
    title: 'List Key Features',
    description: 'Highlight bedrooms, bathrooms, garden, parking, etc.',
    icon: '🏠',
  },
  {
    number: 3,
    title: 'Describe Condition',
    description: 'Share any renovations or improvements',
    icon: '🔨',
  },
  {
    number: 4,
    title: 'Add Marketing Highlights',
    description: 'What makes your property special?',
    icon: '⭐',
  },
  {
    number: 5,
    title: 'Review & Release',
    description: 'Preview and release to agents',
    icon: '✅',
  },
];

export default function VendorPostValuationFlow({
  propertyId,
  address,
  estimatedPrice,
  onProceedToProfile,
  onSaveForLater,
}: VendorPostValuationFlowProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'benefits' | 'privacy'>('overview');

  const formatPrice = (price: number) => `£${price.toLocaleString()}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader>
          <div className="space-y-2">
            <CardTitle className="text-2xl">Great! Your Valuation is Ready</CardTitle>
            <CardDescription>{address}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-purple-600">{formatPrice(estimatedPrice)}</span>
            <span className="text-gray-600">estimated value</span>
          </div>
          <p className="text-sm text-gray-600">
            This is your starting point. By completing your launch profile, you'll attract qualified agents and unlock premium early-access opportunities.
          </p>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        {(['overview', 'benefits', 'privacy'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              selectedTab === tab
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'overview' && 'What Happens Next'}
            {tab === 'benefits' && 'Your Benefits'}
            {tab === 'privacy' && 'Your Privacy'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Complete your launch profile in 5 simple steps. You remain in full control throughout the process.
          </p>
          <div className="grid gap-4">
            {PROFILE_STEPS.map((step) => (
              <div key={step.number} className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl font-bold text-purple-600">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                <div className="text-2xl">{step.icon}</div>
              </div>
            ))}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <p className="font-medium mb-1">⏱️ Takes about 10-15 minutes</p>
            <p>You can save and continue anytime. Your progress is automatically saved.</p>
          </div>
        </div>
      )}

      {selectedTab === 'benefits' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="flex gap-4 p-4 border rounded-lg bg-gradient-to-br from-amber-50 to-white">
              <Zap className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Premium Early Access</h4>
                <p className="text-sm text-gray-600">
                  Premium agents get exclusive early-warning signals about your property before it's fully released. This creates competition and urgency.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 border rounded-lg bg-gradient-to-br from-green-50 to-white">
              <Users className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Better Agent Matches</h4>
                <p className="text-sm text-gray-600">
                  Agents can see your property details and market positioning, helping them understand if they're the right fit for your sale.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-white">
              <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Faster Sales</h4>
                <p className="text-sm text-gray-600">
                  Complete profiles attract more qualified interest, leading to faster viewings and better offers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'privacy' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-900">
              <p className="font-medium mb-1">You Stay in Control</p>
              <p>Your identity and contact details remain private until you explicitly choose to release your profile to agents.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">What agents see at each stage:</h4>

            <div className="border rounded-lg p-4 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-amber-100 text-amber-900">Early Stage</Badge>
                  <span className="text-sm font-medium">Profile Building</span>
                </div>
                <p className="text-sm text-gray-600">
                  Premium agents only see: postcode sector, estimated price range, property type, and that you're actively building your profile.
                </p>
                <p className="text-xs text-gray-500 mt-2">✓ Your name and contact details: Hidden</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-100 text-green-900">Ready</Badge>
                  <span className="text-sm font-medium">Full Release</span>
                </div>
                <p className="text-sm text-gray-600">
                  Once you release your profile, all agents can see your full property details, images, and features.
                </p>
                <p className="text-xs text-gray-500 mt-2">✓ Your name and contact details: Shown (with your consent)</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <p className="font-medium mb-1">You can pause or withdraw anytime</p>
            <p>If you change your mind, you can pause your profile or withdraw completely. No penalties, no questions asked.</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onSaveForLater} className="flex-1">
          Save for Later
        </Button>
        <Button onClick={onProceedToProfile} className="flex-1 gap-2">
          Start Building Profile <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Trust Badges */}
      <div className="flex gap-4 justify-center text-xs text-gray-600 pt-4">
        <div className="flex items-center gap-1">
          <Shield className="w-4 h-4" />
          <span>Your data is secure</span>
        </div>
        <div>•</div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>Verified agents only</span>
        </div>
        <div>•</div>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4" />
          <span>You're in control</span>
        </div>
      </div>
    </div>
  );
}
