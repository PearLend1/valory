import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MapPin, Home, TrendingUp, Clock, Users } from 'lucide-react';

interface EarlyLeadSignal {
  id: number;
  postcodeSector: string;
  valuationBracket: string;
  propertyType: string;
  readinessStage: 'EARLY_INTEREST' | 'PROFILE_BUILDING' | 'NEARLY_READY';
  readinessLabel: string;
  launchTiming: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  agentNotifications: number;
  createdAt: Date;
  expiresAt: Date;
  daysUntilExpiry: number;
}

interface PremiumEarlyLeadsProps {
  leads: EarlyLeadSignal[];
  isLoading?: boolean;
  onExpressInterest: (leadId: number) => void;
  onWithdrawInterest?: (leadId: number) => void;
  agentInterests?: Set<number>;
}

const READINESS_COLORS = {
  EARLY_INTEREST: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-900' },
  PROFILE_BUILDING: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-900' },
  NEARLY_READY: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-900' },
};

const READINESS_ICONS = {
  EARLY_INTEREST: '🔔',
  PROFILE_BUILDING: '📝',
  NEARLY_READY: '✅',
};

export default function PremiumEarlyLeads({
  leads,
  isLoading = false,
  onExpressInterest,
  onWithdrawInterest,
  agentInterests = new Set(),
}: PremiumEarlyLeadsProps) {
  const [filterPostcode, setFilterPostcode] = useState('');
  const [filterPropertyType, setFilterPropertyType] = useState('');
  const [filterReadiness, setFilterReadiness] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'expiring' | 'popularity'>('newest');

  // Get unique property types and postcodes from leads
  const propertyTypes = useMemo(() => Array.from(new Set(leads.map((l) => l.propertyType))), [leads]);
  const postcodeSectors = useMemo(() => Array.from(new Set(leads.map((l) => l.postcodeSector))).sort(), [leads]);

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let filtered = leads.filter((lead) => {
      if (filterPostcode && !lead.postcodeSector.includes(filterPostcode)) return false;
      if (filterPropertyType && lead.propertyType !== filterPropertyType) return false;
      if (filterReadiness && lead.readinessStage !== filterReadiness) return false;
      return true;
    });

    // Sort
    if (sortBy === 'expiring') {
      filtered.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    } else if (sortBy === 'popularity') {
      filtered.sort((a, b) => b.agentNotifications - a.agentNotifications);
    } else {
      // newest
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [leads, filterPostcode, filterPropertyType, filterReadiness, sortBy]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="font-semibold text-gray-900 mb-2">No Early Leads Available</h3>
          <p className="text-sm text-gray-600 mb-4">
            Check back soon! Premium agents get exclusive early access to incoming opportunities in your area.
          </p>
          <p className="text-xs text-gray-500">Leads refresh daily as vendors complete their valuations.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Premium Early Leads</h2>
        <p className="text-gray-600">
          Exclusive access to properties before they're released to standard agents. Express interest to get notified
          when vendors are ready for matching.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Postcode Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Postcode Sector</label>
            <Select value={filterPostcode} onValueChange={setFilterPostcode}>
              <SelectTrigger>
                <SelectValue placeholder="All sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All sectors</SelectItem>
                {postcodeSectors && postcodeSectors.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property Type Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Property Type</label>
            <Select value={filterPropertyType} onValueChange={setFilterPropertyType}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                {propertyTypes && propertyTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Readiness Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Readiness</label>
            <Select value={filterReadiness} onValueChange={setFilterReadiness}>
              <SelectTrigger>
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All stages</SelectItem>
                <SelectItem value="EARLY_INTEREST">Early Interest</SelectItem>
                <SelectItem value="PROFILE_BUILDING">Profile Building</SelectItem>
                <SelectItem value="NEARLY_READY">Nearly Ready</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Sort By</label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="popularity">Most Interested</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {filteredLeads.length} of {leads.length} leads
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLeads.map((lead) => {
          const isInterested = agentInterests.has(lead.id);
          const colors = READINESS_COLORS[lead.readinessStage];

          return (
            <Card key={lead.id} className={`border-2 ${colors.border} ${colors.bg} transition-all hover:shadow-lg`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold text-gray-900">{lead.postcodeSector}</span>
                    </div>
                    <Badge className={colors.badge}>
                      {READINESS_ICONS[lead.readinessStage]} {lead.readinessLabel}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Valuation Bracket */}
                <div className="bg-white bg-opacity-60 rounded p-3">
                  <p className="text-xs text-gray-600 mb-1">Estimated Value</p>
                  <p className="text-2xl font-bold text-gray-900">{lead.valuationBracket}</p>
                </div>

                {/* Property Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{lead.propertyType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 capitalize">{lead.confidenceLevel} confidence</span>
                  </div>
                </div>

                {/* Launch Timing */}
                <div className="flex items-center gap-2 text-sm bg-white bg-opacity-60 rounded p-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">Launch: {lead.launchTiming}</span>
                </div>

                {/* Agent Interest Count */}
                <div className="flex items-center gap-2 text-sm text-gray-600 border-t pt-3">
                  <Users className="w-4 h-4" />
                  <span>{lead.agentNotifications} agent{lead.agentNotifications !== 1 ? 's' : ''} interested</span>
                </div>

                {/* Expiration */}
                <div className="text-xs text-gray-500">
                  Expires in {lead.daysUntilExpiry} day{lead.daysUntilExpiry !== 1 ? 's' : ''}
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => {
                    if (isInterested && onWithdrawInterest) {
                      onWithdrawInterest(lead.id);
                    } else {
                      onExpressInterest(lead.id);
                    }
                  }}
                  variant={isInterested ? 'outline' : 'default'}
                  className="w-full"
                >
                  <Heart className={`w-4 h-4 mr-2 ${isInterested ? 'fill-current' : ''}`} />
                  {isInterested ? 'Interested' : 'Express Interest'}
                </Button>

                {isInterested && (
                  <p className="text-xs text-center text-gray-600">
                    You'll be notified when this vendor is ready for agent matching.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State After Filtering */}
      {filteredLeads.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-12 text-center">
            <p className="text-gray-600 mb-4">No leads match your filters. Try adjusting your search.</p>
            <Button
              variant="outline"
              onClick={() => {
                setFilterPostcode('');
                setFilterPropertyType('');
                setFilterReadiness('');
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
