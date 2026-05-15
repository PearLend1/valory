import { useState, useEffect } from 'react';
import { Heart, MapPin, Bed, Bath, Flame, TrendingUp, Clock, TrendingDown, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HomeButton from '@/components/HomeButton';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

interface SavedProperty {
  id: string;
  title: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  city: string;
  postcode: string;
  description: string;
  latitude: number;
  longitude: number;
  savedAt: string;
  eventCount: number;
  momentum: 'high' | 'rising' | 'stable' | 'cooling';
  unreadUpdates: number;
  latestEvents: Array<{
    id: string;
    type: string;
    title: string;
    timestamp: string;
  }>;
}

export default function SavedProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [totalUnread, setTotalUnread] = useState(0);
  
  // Fetch followed properties using tRPC hook
  const { data: followedData, isLoading, refetch } = trpc.follow.getFollowedProperties.useQuery(
    { limit: 50, offset: 0 },
    { enabled: !!user }
  );

  // Mock data for fallback
  const mockProperties: SavedProperty[] = [
    {
      id: '1',
      title: '3 Bedroom Victorian Townhouse',
      price: '£1,250,000',
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1800,
      city: 'Shoreditch',
      postcode: 'EC2A 3PT',
      description: 'Beautiful Victorian townhouse with original features',
      latitude: 51.5228,
      longitude: -0.0855,
      savedAt: '2026-01-15T10:00:00',
      eventCount: 8,
      momentum: 'high',
      unreadUpdates: 2,
      latestEvents: [
        {
          id: '1',
          type: 'offer_received',
          title: 'Offer Received',
          timestamp: '2026-01-20T09:00:00',
        },
        {
          id: '2',
          type: 'viewing_milestone',
          title: '5th Viewing Milestone',
          timestamp: '2026-01-18T16:00:00',
        },
        {
          id: '3',
          type: 'viewing_booked',
          title: 'First Viewing Booked',
          timestamp: '2026-01-16T14:30:00',
        },
      ],
    },
  ];

  useEffect(() => {
    if (followedData?.properties) {
      // Transform database results to match SavedProperty interface
      const transformedProperties: SavedProperty[] = (followedData.properties || []).map((prop: any) => ({
        id: String(prop.id),
        title: prop.title || 'Untitled Property',
        price: prop.price ? `£${Number(prop.price).toLocaleString()}` : 'Price TBD',
        bedrooms: prop.bedrooms || 0,
        bathrooms: prop.bathrooms || 0,
        squareFeet: prop.squareFeet || 0,
        city: prop.city || '',
        postcode: prop.postcode || '',
        description: prop.description || '',
        latitude: prop.latitude || 0,
        longitude: prop.longitude || 0,
        savedAt: prop.savedAt || new Date().toISOString(),
        eventCount: 0,
        momentum: 'stable' as const,
        unreadUpdates: 0,
        latestEvents: [],
      }));
      
      setProperties(transformedProperties);
      setLastUpdated(new Date());
      
      const unread = transformedProperties.reduce((sum, prop) => sum + prop.unreadUpdates, 0);
      setTotalUnread(unread);
    }
  }, [followedData]);

  useEffect(() => {
    // Set up polling every 60 seconds
    const pollInterval = setInterval(() => {
      refetch();
    }, 60000);

    return () => clearInterval(pollInterval);
  }, [refetch]);

  const getMomentumIcon = (momentum: string) => {
    switch (momentum) {
      case 'high':
        return <Flame className="text-red-500" size={16} />;
      case 'rising':
        return <TrendingUp className="text-green-500" size={16} />;
      case 'stable':
        return <Clock className="text-blue-500" size={16} />;
      case 'cooling':
        return <TrendingDown className="text-gray-500" size={16} />;
      default:
        return null;
    }
  };

  const getMomentumLabel = (momentum: string) => {
    switch (momentum) {
      case 'high':
        return '🔥 High';
      case 'rising':
        return '📈 Rising';
      case 'stable':
        return '⏳ Stable';
      case 'cooling':
        return '📉 Cooling';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <HomeButton />
          {totalUnread > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-lg">
              <Bell size={18} className="text-orange-600" />
              <span className="text-sm font-semibold text-orange-600">
                {totalUnread} new update{totalUnread !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Saved Properties</h1>
          <p className="text-purple-100">
            Track updates on {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'} you're interested in
          </p>
          <p className="text-sm text-purple-200 mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-gray-600 mt-4">Loading your saved properties...</p>
          </div>
        )}

        {!isLoading && properties.length === 0 && (
          <div className="text-center py-12">
            <Heart size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Saved Properties Yet</h2>
            <p className="text-gray-600 mb-6">
              Start saving properties to track their updates and momentum.
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6">
              Browse Properties
            </Button>
          </div>
        )}

        {!isLoading && properties.length > 0 && (
          <div className="space-y-6">
            {properties.map((property) => (
              <div
                key={property.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
                  {/* Property Image Placeholder */}
                  <div className="md:col-span-1 bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg h-48 md:h-auto flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🏠</div>
                      <p className="text-sm text-gray-600">Property Image</p>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="md:col-span-3 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{property.title}</h3>
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                          <MapPin size={16} />
                          <span className="text-sm">
                            {property.city}, {property.postcode}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{property.price}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 px-3 py-1 bg-gray-100 rounded-full w-fit ml-auto">
                          {getMomentumIcon(property.momentum)}
                          <span className="text-sm font-semibold text-gray-700">
                            {getMomentumLabel(property.momentum)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Property Stats */}
                    <div className="flex gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Bed size={16} />
                        <span>{property.bedrooms} beds</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath size={16} />
                        <span>{property.bathrooms} baths</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{property.squareFeet.toLocaleString()} sqft</span>
                      </div>
                    </div>

                    {/* Latest Events */}
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Latest Updates</p>
                      <div className="space-y-2">
                        {property.latestEvents.slice(0, 3).map((event) => (
                          <div key={event.id} className="flex items-start gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{event.title}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(event.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {property.unreadUpdates > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 flex items-center gap-2">
                        <Bell size={16} className="text-orange-600" />
                        <span className="text-sm font-semibold text-orange-700">
                          {property.unreadUpdates} new update{property.unreadUpdates !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-purple-600 text-purple-600 hover:bg-purple-50"
                        onClick={() => alert('View property details')}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          try {
                            const toggleMutation = trpc.follow.toggleFollowProperty.useMutation();
                            await toggleMutation.mutateAsync({ propertyId: property.id });
                            // Reload properties after unsave
                            refetch();
                          } catch (error) {
                            console.error('Failed to unsave property:', error);
                          }
                        }}
                      >
                        <Heart size={16} className="mr-2" />
                        Unsave
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        {!isLoading && properties.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={() => refetch()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6"
            >
              Refresh Updates
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
