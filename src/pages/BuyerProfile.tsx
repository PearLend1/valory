import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Heart, MapPin, Bed, Bath, Maximize2, Mail, Phone, Calendar, Settings
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function BuyerProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect non-buyers (role is 'public' in the DB)
  if (!user || (user.role !== 'public' && user.role !== 'admin')) {
    navigate('/');
    return null;
  }

  // Fetch followed properties
  const { data: followedData, isLoading } = trpc.follow.getFollowedProperties.useQuery(
    {},
    { enabled: !!user }
  );

  const followedProperties: any[] = (followedData as any)?.properties ?? followedData ?? [];

  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(
    new Set(followedProperties.map((p: any) => p.id))
  );

  const handleToggleFavorite = (propertyId: number) => {
    setFavoriteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
        toast('Removed from favorites');
      } else {
        newSet.add(propertyId);
        toast.success('Added to favorites');
      }
      return newSet;
    });
  };

  const favorites = followedProperties;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-rose-700 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                  <p className="text-slate-400">Property Buyer</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/discover')}
                className="border-slate-700 hover:bg-slate-900"
              >
                Continue Browsing
              </Button>
              <Button className="bg-pink-600 hover:bg-pink-700">
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Favorites Saved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{favorites.length}</div>
              <p className="text-xs text-slate-500 mt-1">Properties you love</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Price Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">£500k - £2m</div>
              <p className="text-xs text-slate-500 mt-1">Your search preference</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Active Searches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">3</div>
              <p className="text-xs text-slate-500 mt-1">Saved search alerts</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="favorites" className="mb-8">
          <TabsList className="bg-slate-900 border-slate-800">
            <TabsTrigger value="favorites" className="data-[state=active]:bg-pink-600">
              <Heart className="w-4 h-4 mr-2" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-pink-600">
              <Settings className="w-4 h-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-pink-600">
              <Mail className="w-4 h-4 mr-2" />
              Contact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12 text-slate-400">Loading favorites...</div>
            ) : favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((property: any) => (
                  <Card
                    key={property.id}
                    className="bg-slate-900 border-slate-800 overflow-hidden hover:border-slate-700 transition-colors cursor-pointer"
                    onClick={() => navigate(`/property/${property.id}`)}
                  >
                    {/* Image Placeholder */}
                    <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border-b border-slate-800">
                      <Maximize2 className="w-8 h-8 text-slate-700" />
                    </div>

                    <CardContent className="p-4">
                      {/* Header with favorite button */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{property.address}</h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {property.city}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(property.id);
                          }}
                          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              favoriteIds.has(property.id)
                                ? 'fill-pink-500 text-pink-500'
                                : 'text-slate-500'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="mb-4 pb-4 border-b border-slate-800">
                        <p className="text-2xl font-bold text-white">
                          £{typeof property.price === 'string' ? property.price : property.price?.toLocaleString()}
                        </p>
                      </div>

                      {/* Features */}
                      <div className="flex gap-4 mb-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />
                          <span>{property.bedrooms} Bed</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="w-4 h-4" />
                          <span>{property.bathrooms} Bath</span>
                        </div>
                      </div>

                      {/* CTA */}
                      <Button
                        size="sm"
                        className="w-full bg-pink-600 hover:bg-pink-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/property/${property.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="text-center py-12">
                  <Heart className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-50" />
                  <p className="text-slate-400 mb-4">No favorites yet</p>
                  <Button
                    onClick={() => navigate('/discover')}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    Start Browsing Properties
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preferences" className="mt-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Search Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Preferred Locations</label>
                    <p className="text-white">London, Manchester, Birmingham</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Property Type</label>
                    <p className="text-white">Detached, Semi-detached, Townhouse</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Price Range</label>
                    <p className="text-white">£500,000 - £2,000,000</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Bedrooms</label>
                    <p className="text-white">3-4 bedrooms</p>
                  </div>
                </div>
                <Button className="bg-pink-600 hover:bg-pink-700">Update Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Email</label>
                    <div className="flex items-center gap-3 text-white">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span>{user.email || 'Not provided'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Phone</label>
                    <div className="flex items-center gap-3 text-white">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span>(555) 987-6543</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Member Since</label>
                    <div className="flex items-center gap-3 text-white">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>March 2024</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
            