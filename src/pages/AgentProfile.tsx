import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, Users, Home, Star, Calendar, Phone, Mail
} from 'lucide-react';
import { useState } from 'react';

export default function AgentProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect non-agents
  if (!user || user.role !== 'agent') {
    navigate('/');
    return null;
  }

  // Fetch agent stats
  const { data: stats, isLoading } = trpc.agent.getStats.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Fetch agent's listings
  const { data: listings } = trpc.agent.getActiveListings.useQuery(
    { agentId: user.id },
    { enabled: !!user }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading profile...</div>
      </div>
    );
  }

  const totalListings = listings?.length || 0;
  const totalViews = (listings || []).reduce((sum: number, prop: any) => sum + (prop.views || 0), 0);
  const totalOffers = (listings || []).reduce((sum: number, prop: any) => sum + (prop.offers || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-700 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                  <p className="text-slate-400">Professional Real Estate Agent</p>
                </div>
              </div>
              <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30">
                Active Agent
              </Badge>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/agent-dashboard')}
                className="border-slate-700 hover:bg-slate-900"
              >
                View Dashboard
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
              >
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Home className="w-4 h-4" />
                Active Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalListings}</div>
              <p className="text-xs text-slate-500 mt-1">Properties listed</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalViews}</div>
              <p className="text-xs text-slate-500 mt-1">Property views</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Offers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalOffers}</div>
              <p className="text-xs text-slate-500 mt-1">Offers received</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">4.8</div>
              <p className="text-xs text-slate-500 mt-1">Out of 5.0</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Info */}
        <Tabs defaultValue="contact" className="mb-8">
          <TabsList className="bg-slate-900 border-slate-800">
            <TabsTrigger value="contact" className="data-[state=active]:bg-amber-600">
              Contact Info
            </TabsTrigger>
            <TabsTrigger value="earnings" className="data-[state=active]:bg-amber-600">
              Earnings
            </TabsTrigger>
            <TabsTrigger value="listings" className="data-[state=active]:bg-amber-600">
              Listings
            </TabsTrigger>
          </TabsList>

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
                      <span>(555) 123-4567</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Member Since</label>
                    <div className="flex items-center gap-3 text-white">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>January 2024</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">License</label>
                    <span className="text-white">UK Real Estate License #12345</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg">This Month</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Commission Earned</p>
                    <p className="text-3xl font-bold text-amber-400">£2,450</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Pending Transactions</p>
                    <p className="text-2xl font-bold text-white">£12,500</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Year to Date</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Total Commission</p>
                    <p className="text-3xl font-bold text-amber-400">£28,900</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Transactions Closed</p>
                    <p className="text-2xl font-bold text-white">12</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="listings" className="mt-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Your Active Listings</CardTitle>
              </CardHeader>
              <CardContent>
                {listings && listings.length > 0 ? (
                  <div className="space-y-4">
                    {listings.map((listing: any) => (
                      <div
                        key={listing.id}
                        className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800"
                      >
                        <div>
                          <h3 className="text-white font-medium">{listing.address}</h3>
                          <p className="text-slate-400 text-sm">{listing.city} • £{listing.price?.toLocaleString()}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/property/${listing.id}`)}
                          className="border-slate-700 hover:bg-slate-900"
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">No active listings</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
