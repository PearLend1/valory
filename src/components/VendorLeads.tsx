import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, TrendingUp } from 'lucide-react';

// Demo vendor leads data
const DEMO_VENDOR_LEADS = [
  {
    id: 1,
    area: 'Taunton, Somerset',
    propertyType: 'Detached House',
    valuationRange: '£350,000 - £400,000',
    urgency: 'High',
    daysListed: 3,
    description: 'Vendor seeking quick sale, open to agent-led marketing',
  },
  {
    id: 2,
    area: 'Exeter, Devon',
    propertyType: 'Semi-Detached',
    valuationRange: '£280,000 - £320,000',
    urgency: 'Medium',
    daysListed: 7,
    description: 'First-time seller, prefers hybrid approach',
  },
  {
    id: 3,
    area: 'Dorchester, Dorset',
    propertyType: 'Terraced House',
    valuationRange: '£220,000 - £260,000',
    urgency: 'Medium',
    daysListed: 5,
    description: 'Relocating for work, flexible timeline',
  },
  {
    id: 4,
    area: 'Bridgwater, Somerset',
    propertyType: 'Bungalow',
    valuationRange: '£180,000 - £220,000',
    urgency: 'Low',
    daysListed: 14,
    description: 'Downsizing, no rush to sell',
  },
  {
    id: 5,
    area: 'Weymouth, Dorset',
    propertyType: 'Apartment',
    valuationRange: '£150,000 - £190,000',
    urgency: 'High',
    daysListed: 2,
    description: 'Investment property, seeking quick transaction',
  },
];

export default function VendorLeads() {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Medium':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'High':
        return '🔴';
      case 'Medium':
        return '🟠';
      case 'Low':
        return '🟢';
      default:
        return '•';
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>MVP Note:</strong> These are demo vendor leads. In Phase 2, this section will connect to your valuation requests and show real vendors seeking agent representation.
          </p>
        </CardContent>
      </Card>

      {/* Vendor Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DEMO_VENDOR_LEADS.map((lead) => (
          <Card key={lead.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">{lead.area}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{lead.propertyType}</p>
                </div>
                <Badge className={`${getUrgencyColor(lead.urgency)} whitespace-nowrap ml-2`}>
                  {getUrgencyIcon(lead.urgency)} {lead.urgency}
                </Badge>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Valuation Range</p>
                  <p className="text-lg font-bold text-purple-600">{lead.valuationRange}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Listed {lead.daysListed} days ago</span>
                </div>

                <p className="text-sm text-gray-700 italic">{lead.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Button
                  size="sm"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Contact Vendor
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Leads Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <p className="text-2xl font-bold text-purple-600">{DEMO_VENDOR_LEADS.length}</p>
              <p className="text-xs text-gray-600 mt-1">Total Leads</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <p className="text-2xl font-bold text-red-600">
                {DEMO_VENDOR_LEADS.filter(l => l.urgency === 'High').length}
              </p>
              <p className="text-xs text-gray-600 mt-1">High Priority</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded">
              <p className="text-2xl font-bold text-orange-600">
                £{(DEMO_VENDOR_LEADS.reduce((sum, l) => {
                  const range = l.valuationRange.match(/£(\d+),(\d+)/g);
                  if (range) {
                    const low = parseInt(range[0].replace(/£|,/g, ''));
                    const high = parseInt(range[1].replace(/£|,/g, ''));
                    return sum + (low + high) / 2;
                  }
                  return sum;
                }, 0) / DEMO_VENDOR_LEADS.length / 1000).toFixed(0)}k avg
              </p>
              <p className="text-xs text-gray-600 mt-1">Average Value</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(DEMO_VENDOR_LEADS.reduce((sum, l) => sum + l.daysListed, 0) / DEMO_VENDOR_LEADS.length)}
              </p>
              <p className="text-xs text-gray-600 mt-1">Avg Days Listed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase 2 Roadmap */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-900">Coming in Phase 2</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-900 space-y-2">
          <p>✓ Real vendor leads from valuation requests</p>
          <p>✓ Automated lead scoring based on property value and urgency</p>
          <p>✓ Direct messaging with vendors</p>
          <p>✓ Lead assignment and tracking</p>
          <p>✓ Commission calculator for Tier 1 & Tier 2 agents</p>
        </CardContent>
      </Card>
    </div>
  );
}
