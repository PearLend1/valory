import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Home, TrendingUp, Calendar, Mail, Phone, Settings, ArrowRight
} from 'lucide-react';
import { useState } from 'react';

export default function SellerProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect non-vendors/sellers
  if (!user || user.role !== 'vendor') {
    navigate('/');
    return null;
  }

  // Fetch vendor dashboard data
  const { data: vendorData, isLoading } = trpc.vendorAcceptance.getDashboard.useQuery(
    undefined,
    { enabled: !!user }
  );

  const properties = (vendorData as any)?.properties || [];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                  <p className="text-slate-400">Property Seller</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/vendor/dashboard')}
                className="border-slate-700 hover:bg-slate-900"
              >
                View Dashboard
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions - Property Valuation */}
        <Card className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border-emerald-800/50 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Ready to Sell?</h3>
                <p className="text-slate-300">Get your property valued instantly. Our AI-powered valuation gives you accurate pricing in seconds.</p>
              </div>
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap"
                onClick={() => navigate('/sell')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Get Valuation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Home className="w-4 h-4" />
                Properties Listed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{properties.length}</div>
              <p className="text-xs text-slate-500 mt-1">Currently on market</p>
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
              <div className="text-3xl font-bold text-white">5</div>
              <p className="text-xs text-slate-500 mt-1">Received offers</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Days on Market
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">23</div>
              <p className="text-xs text-slate-500 mt-1">Average listing time</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="properties" className="mb-8">
          <TabsList className="bg-slate-900 border-slate-800">
            <TabsTrigger value="properties" className="data-[state=active]:bg-emerald-600">
              <Home className="w-4 h-4 mr-2" />
              Your Properties
            </TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-emerald-600">
              <Mail className="w-4 h-4 mr-2" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-600">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12 text-slate-400">Loading properties...</div>
            ) : properties.length > 0 ? (
              <div className="space-y-4">
                {properties.map((property: any) => (
                  <Card key={property.id} className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {property.address}
                          </h3>
                          <p className="text-slate-400 text-sm mb-3">{property.city}</p>
                          <div className="flex gap-6">
                            <div>
                              <p className="text-xs text-slate-500">Listed Price</p>
                              <p className="text-xl font-bold text-emerald-400">
                                £{typeof property.price === 'string' ? property.price : property.price?.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Views</p>
                              <p className="text-xl font-bold text-white">{property.views || 0}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Offers</p>
                              <p className="text-xl font-bold text-white">{property.offers || 0}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/property/${property.id}`)}
                            className="border-slate-700 hover:bg-slate-900"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="text-center py-12">
                  <Home className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-50" />
                  <p className="text-slate-400 mb-6">No properties listed yet</p>
                  <Button
                    onClick={() => navigate('/sell')}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Get Your First Property Valued
                  </Button>
                </CardContent>
              </Card>
            )}
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
                      <span>(555) 234-5678</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Member Since</label>
                    <div className="flex items-center gap-3 text-white">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>February 2024</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg">
                    <div>
                      <p className="text-white font-medium">New Offers</p>
                      <p className="text-sm text-slate-400">Get notified when you receive new offers</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Viewings Scheduled</p>
                      <p className="text-sm text-slate-400">Get notified about scheduled viewings</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Market Updates</p>
                      <p className="text-sm text-slate-400">Receive weekly market insights</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                  </div>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700">Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
