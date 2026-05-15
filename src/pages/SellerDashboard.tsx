import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, TrendingUp, MapPin, Star, Clock, Users, Eye, Heart, X, Pin } from 'lucide-react';
import { AgentSentiment } from '@/components/AgentSentiment';

export default function SellerDashboard() {
  const [property, setProperty] = useState({
    address: '123 Oak Street, Springfield',
    momentum: 'Rising',
    daysLive: 5,
    profileComplete: 75,
    viewsThisWeek: 142,
    viewsTrend: 15,
    savesThisWeek: 28,
    savesTrend: 8,
    agentsMatched: 5,
    agentsTrend: 0,
  });

  const [activityFeed] = useState([
    { id: 1, type: 'interest', title: 'Agent Expressed Interest', description: 'Sarah Johnson is interested', time: 'Just now', icon: '⭐' },
    { id: 2, type: 'match', title: 'Matched with 5 Agents', description: 'Your property is now visible to quality-matched agents', time: '2 hours ago', icon: '✓' },
    { id: 3, type: 'photo', title: 'Photo Uploaded', description: 'Front-of-house photo added', time: 'Yesterday', icon: '📷' },
    { id: 4, type: 'complete', title: 'Profile Completed', description: 'All property details filled in', time: '3 days ago', icon: '✓' },
    { id: 5, type: 'launch', title: 'Profile Created', description: 'Your property launched on VALORY', time: '5 days ago', icon: '🚀' },
  ]);

  const [matchedAgents] = useState([
    {
      id: 1,
      name: 'Sarah Johnson',
      rating: 4.8,
      specialty: 'Family homes',
      coverage: 'Springfield & surrounding',
      responseTime: '~2 hours',
      satisfaction: '95%',
    },
    {
      id: 2,
      name: 'Michael Chen',
      rating: 4.6,
      specialty: 'First-time sellers',
      coverage: 'Springfield',
      responseTime: '~4 hours',
      satisfaction: '92%',
    },
    {
      id: 3,
      name: 'Emma Williams',
      rating: 4.7,
      specialty: 'Investment properties',
      coverage: 'Springfield & suburbs',
      responseTime: '~1 hour',
      satisfaction: '96%',
    },
  ]);

  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case 'High':
        return 'bg-green-500';
      case 'Rising':
        return 'bg-blue-500';
      case 'Stable':
        return 'bg-gray-500';
      case 'Cooling':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <ArrowDown className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-2">Property Dashboard</h1>
          <p className="text-muted-foreground">{property.address}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Overview Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Momentum Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Momentum</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getMomentumColor(property.momentum)}`}></div>
                  <span className="text-2xl font-bold">{property.momentum}</span>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Live for {property.daysLive} days</p>
              </CardContent>
            </Card>

            {/* Profile Completeness Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{property.profileComplete}%</div>
                <div className="w-full bg-border rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all"
                    style={{ width: `${property.profileComplete}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Complete</p>
              </CardContent>
            </Card>

            {/* Views Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Eye className="w-4 h-4" /> Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{property.viewsThisWeek}</div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(property.viewsTrend)}
                  <span className="text-xs text-muted-foreground">{Math.abs(property.viewsTrend)}% this week</span>
                </div>
              </CardContent>
            </Card>

            {/* Saves Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Heart className="w-4 h-4" /> Saves
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{property.savesThisWeek}</div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(property.savesTrend)}
                  <span className="text-xs text-muted-foreground">{Math.abs(property.savesTrend)}% this week</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Visibility Metrics */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Visibility Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Buyer Engagement</CardTitle>
                <CardDescription>How buyers are interacting with your property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Profile Views</span>
                    <span className="font-bold">{property.viewsThisWeek}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Saved by Buyers</span>
                    <span className="font-bold">{property.savesThisWeek}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Passed</span>
                    <span className="font-bold">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pinned</span>
                    <span className="font-bold">5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
                <CardDescription>Your property's current status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Visibility</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active & Discoverable</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Readiness</span>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Profile Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Agents Matched</span>
                    <span className="font-bold">{property.agentsMatched}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Matched Agents */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Matched Agents ({matchedAgents.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {matchedAgents.map((agent) => (
              <Card key={agent.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-orange-500/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                        <span className="text-sm font-medium">{agent.rating}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium text-foreground">{agent.specialty}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{agent.coverage}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Responds {agent.responseTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{agent.satisfaction} seller satisfaction</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Profile
                    </Button>
                    <Button size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700">
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Agent Sentiment */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Agent Market Insights</h2>
          <AgentSentiment propertyId={property.address} feedbackCount={8} lastUpdated="2 hours ago" />
        </section>

        {/* Activity Feed */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Activity Feed</h2>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {activityFeed.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    {/* Timeline line */}
                    {index !== activityFeed.length - 1 && (
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-sm">
                          {event.icon}
                        </div>
                        <div className="w-0.5 h-12 bg-border mt-2"></div>
                      </div>
                    )}
                    {index === activityFeed.length - 1 && (
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-sm">
                          {event.icon}
                        </div>
                      </div>
                    )}
                    {/* Event details */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{event.title}</h3>
                        <span className="text-xs text-muted-foreground">{event.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Next Steps */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Next Steps</h2>
          <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-orange-600/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Profile 75% Complete</CardTitle>
              <CardDescription>You're almost there!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">75%</span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Next: Upload Front-of-House Photo</p>
                <p className="text-sm text-muted-foreground">
                  Photos unlock agent matching and increase buyer interest by 3x. Your matched agents are waiting to see your property!
                </p>
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700">Upload Photo Now</Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
