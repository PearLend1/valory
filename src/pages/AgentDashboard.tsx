import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, Users, Clock, Plus } from 'lucide-react';
import { toast } from 'sonner';
import EventCreatorModal from '@/components/EventCreatorModal';
import MomentumStats from '@/components/MomentumStats';
import VendorLeads from '@/components/VendorLeads';
import MomentumBadge from '@/components/MomentumBadge';

export default function AgentDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [showEventCreator, setShowEventCreator] = useState(false);

  // Redirect non-agents to home
  if (!user || user.role !== 'agent') {
    navigate('/');
    return null;
  }

  // Fetch agent's active listings
  const { data: agentProperties, isLoading: propertiesLoading } = trpc.agent.getActiveListings.useQuery(
    { agentId: user.id },
    { enabled: !!user }
  );

  // Fetch agent subscription
  const { data: subscription } = trpc.subscriptions.getActive.useQuery(undefined, { enabled: !!user });

  // Calculate momentum stats for each property
  const momentumData = useMemo(() => {
    if (!agentProperties) return {};
    
    const stats: Record<number, any> = {};
    agentProperties.forEach((prop: any) => {
      const eventCount = prop.timelineEvents?.length || 0;
      const lastEvent = prop.timelineEvents?.[0];
      const lastUpdateTime = lastEvent?.timestamp ? new Date(lastEvent.timestamp) : new Date(prop.createdAt);
      const daysSinceUpdate = Math.floor((Date.now() - lastUpdateTime.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate momentum based on recent events
      const recentEvents = prop.timelineEvents?.filter((e: any) => {
        const eventDate = new Date(e.timestamp);
        const daysDiff = Math.floor((Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7;
      }).length || 0;

      let momentum = 'Cooling';
      if (recentEvents >= 3) momentum = 'High';
      else if (recentEvents >= 2) momentum = 'Rising';
      else if (recentEvents >= 1) momentum = 'Stable';

      stats[prop.id] = {
        momentum,
        eventCount,
        recentEvents,
        daysSinceUpdate,
        needsAttention: daysSinceUpdate > 14,
        lastEvent,
      };
    });
    
    return stats;
  }, [agentProperties]);

  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Rising':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Stable':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Cooling':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (propertiesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const needsAttentionCount = Object.values(momentumData).filter((s: any) => s.needsAttention).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back, {user?.name || 'Agent'}</p>
            </div>
            <div className="text-right">
              {subscription && (
                <div className="text-sm">
                  <p className="text-gray-600">Current Plan</p>
                  <Badge className="mt-1 bg-purple-600 hover:bg-purple-700">
                    {subscription.tier === 'tier1' ? 'Tier 1 - £10/week' : 'Tier 2 - £20/week'}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{agentProperties?.length || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Active Listings</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">
                  {Object.values(momentumData).filter((s: any) => s.momentum === 'High').length}
                </p>
                <p className="text-sm text-gray-600 mt-1">High Momentum</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {Object.values(momentumData).reduce((sum: number, s: any) => sum + (s.eventCount || 0), 0)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Total Events</p>
              </div>
            </CardContent>
          </Card>

          <Card className={needsAttentionCount > 0 ? 'border-red-300 bg-red-50' : ''}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className={`text-3xl font-bold ${needsAttentionCount > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {needsAttentionCount}
                </p>
                <p className="text-sm text-gray-600 mt-1">Needs Attention</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="listings">My Active Listings</TabsTrigger>
            <TabsTrigger value="momentum">Momentum Overview</TabsTrigger>
            <TabsTrigger value="leads">Vendor Leads</TabsTrigger>
          </TabsList>

          {/* My Active Listings */}
          <TabsContent value="listings" className="space-y-6 mt-6">
            {agentProperties && agentProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agentProperties.map((property: any) => {
                  const stats = momentumData[property.id];
                  return (
                    <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-0">
                        {/* Property Image Placeholder */}
                        <div className="h-40 bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center relative">
                          {property.images && property.images.length > 0 && (
                            <img 
                              src={JSON.parse(property.images)[0]} 
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {property.timelineEvents && property.timelineEvents.length > 0 && (
                            <div className="absolute top-3 right-3">
                              <MomentumBadge timelineEvents={property.timelineEvents} size="sm" showTooltip={true} />
                            </div>
                          )}
                        </div>

                        {/* Property Details */}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 truncate">{property.title}</h3>
                          <p className="text-sm text-gray-600 truncate">{property.address}</p>
                          
                          <div className="mt-3 flex justify-between items-center">
                            <div>
                              <p className="text-lg font-bold text-purple-600">
                                £{property.price?.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">{property.bedrooms}bed • {property.bathrooms}bath</p>
                            </div>
                          </div>

                          {/* Latest Event */}
                          {stats?.lastEvent && (
                            <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                              <p className="font-medium text-gray-700">Latest: {stats.lastEvent.eventType}</p>
                              <p className="text-gray-600">
                                {new Date(stats.lastEvent.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          )}

                          {/* Quick Actions */}
                          <div className="mt-4 space-y-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs"
                              onClick={() => {
                                setSelectedProperty(property.id);
                                setShowEventCreator(true);
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Log Event
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-gray-600 mb-4">No active listings yet</p>
                  <Button>Add Property</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Momentum Overview */}
          <TabsContent value="momentum" className="mt-6">
            <MomentumStats properties={agentProperties || []} momentumData={momentumData} />
          </TabsContent>

          {/* Vendor Leads */}
          <TabsContent value="leads" className="mt-6">
            <VendorLeads />
          </TabsContent>
        </Tabs>
      </div>

      {/* Event Creator Modal */}
      {selectedProperty && (
        <EventCreatorModal
          propertyId={selectedProperty}
          isOpen={showEventCreator}
          onClose={() => {
            setShowEventCreator(false);
            setSelectedProperty(null);
          }}
          onSuccess={() => {
            setShowEventCreator(false);
            setSelectedProperty(null);
            toast.success('Event created successfully');
          }}
        />
      )}
    </div>
  );
}
