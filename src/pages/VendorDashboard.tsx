import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Lock, TrendingUp, Camera, Shield, CheckCircle2, Clock, Users,
  ArrowRight, ChevronLeft, Loader2, Home, MapPin, Eye, Sparkles,
  AlertCircle, Calendar, BarChart3, UserCheck, Circle, Rocket,
  Upload, X, LogOut
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { toast } from 'sonner';

const formatPrice = (price: number) => `£${price.toLocaleString()}`;

function VendorNav({ user }: { user: any }) {
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = '/'; },
  });
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-accent/10 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer flex-shrink-0">
              <div className="w-7 h-7 bg-accent/20 rounded-lg flex items-center justify-center border border-accent/30">
                <span className="text-accent font-bold text-xs">V</span>
              </div>
              <span className="font-bold text-white text-sm hidden sm:inline">Valory</span>
            </div>
          </Link>
          <span className="text-foreground/30 text-sm hidden sm:inline">/</span>
          <span className="text-foreground/55 text-sm truncate hidden sm:inline">Property Dashboard</span>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-foreground/40 hidden md:inline truncate max-w-[140px]">{user.name || user.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="border-accent/30 text-accent bg-accent/5 hover:bg-accent/10 text-xs gap-1.5"
            >
              <LogOut size={12} />
              Sign out
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}

const LEAD_STATE_CONFIG: Record<string, { label: string; color: string; tagline: string }> = {
  REGISTERED: {
    label: 'Registered',
    color: 'bg-gray-100 text-gray-700',
    tagline: 'Your account is set up. Start your valuation to proceed.',
  },
  PROFILE_IN_PROGRESS: {
    label: 'Profile in Progress',
    color: 'bg-amber-100 text-amber-800',
    tagline: 'Your property profile is being built.',
  },
  ACCEPTED_VALUATION: {
    label: 'Valuation Accepted',
    color: 'bg-purple-100 text-purple-800',
    tagline: 'Your valuation is locked. Complete your launch profile to go live.',
  },
  READY_FOR_AGENT_MATCH: {
    label: 'Live — Agent Matching',
    color: 'bg-green-100 text-green-800',
    tagline: 'Your profile is live. Agents can express interest in your property.',
  },
};

export default function VendorDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  const utils = trpc.useUtils();

  const { data: dashboard, isLoading, error } = trpc.vendorAcceptance.getDashboard.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: leadHistory } = trpc.vendorAcceptance.getLeadHistory.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const completeProfileMutation = trpc.vendorAcceptance.completeProfile.useMutation({
    onSuccess: (result) => {
      setShowLaunchModal(false);
      toast.success(result.message);
      utils.vendorAcceptance.getDashboard.invalidate();
      utils.vendorAcceptance.getLeadHistory.invalidate();
    },
    onError: (error) => {
      setShowLaunchModal(false);
      toast.error(error.message || 'Failed to complete profile.');
    },
  });

  // Auth redirect
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-lg">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Unable to load dashboard</h2>
            <p className="text-gray-600 text-sm">{error.message}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No valuation yet — prompt to start
  if (!dashboard?.hasValuation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <VendorNav user={user} />
        <div className="max-w-3xl mx-auto px-4 pt-20 pb-12">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                <Home className="w-8 h-8 text-purple-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">No valuation yet</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Start your property valuation to unlock your vendor dashboard, agent matching, and launch profile.
                </p>
              </div>
              <Link href="/sell">
                <Button className="bg-purple-600 hover:bg-purple-700 h-12 px-8 font-semibold">
                  Start Your Valuation
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Dashboard Data ─────────────────────────────────────────
  const {
    valuation,
    leadState,
    profileChecklist,
    profileComplete,
    completionPercentage,
    agentInterest,
    nextSteps,
  } = dashboard;

  const currentLeadState = valuation?.leadState || leadState?.state || 'ACCEPTED_VALUATION';
  const stateConfig = LEAD_STATE_CONFIG[currentLeadState] || LEAD_STATE_CONFIG.ACCEPTED_VALUATION;
  const lockedUntil = valuation?.lockedUntil ? new Date(valuation.lockedUntil) : null;
  const acceptedAt = valuation?.acceptedAt ? new Date(valuation.acceptedAt) : null;
  const isLocked = lockedUntil && lockedUntil > new Date();
  const daysRemaining = lockedUntil
    ? Math.max(0, Math.ceil((lockedUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isLive = currentLeadState === 'READY_FOR_AGENT_MATCH';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <VendorNav user={user} />

      <div className="max-w-3xl mx-auto px-4 pt-20 pb-8 space-y-6">

        {/* ─── Welcome & State ─────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isLive ? 'Your Property is Live' : 'Complete Your Launch Profile'}
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                {valuation?.address && <span>{valuation.address}, </span>}
                {valuation?.postcode}
              </p>
            </div>
            <Badge className={`${stateConfig.color} text-xs font-semibold px-3 py-1.5 whitespace-nowrap`}>
              {stateConfig.label}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{stateConfig.tagline}</p>
        </div>

        {/* ─── PRIMARY: Launch Profile Checklist ──────────── */}
        {!isLive && (
          <Card className="border-0 shadow-lg ring-1 ring-purple-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-purple-600" />
                  Launch Profile
                </CardTitle>
                <span className="text-sm font-bold text-purple-700">{completionPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full mt-2">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {profileChecklist.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-3 items-start p-3 rounded-lg transition-colors ${
                    item.completed
                      ? 'bg-green-50/60'
                      : 'bg-white border border-gray-100'
                  }`}
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.completed ? 'text-green-800' : 'text-gray-900'}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                  {!item.completed && item.id === 'property_photos' && (
                    <Link href="/sell">
                      <Button size="sm" variant="outline" className="text-xs flex-shrink-0">
                        <Camera className="mr-1" size={14} />
                        Add
                      </Button>
                    </Link>
                  )}
                </div>
              ))}

              {/* Launch CTA — only when all items are complete */}
              {profileComplete ? (
                <div className="pt-3 space-y-2">
                  <Button
                    onClick={() => setShowLaunchModal(true)}
                    disabled={completeProfileMutation.isPending}
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-base font-semibold shadow-lg shadow-purple-200"
                  >
                    {completeProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={18} />
                        Launching...
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2" size={18} />
                        Launch Profile
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Launching makes your property visible to all agents in your area.
                  </p>
                </div>
              ) : (
                <div className="pt-2">
                  <p className="text-xs text-gray-500 text-center">
                    Complete all steps above to launch your profile and unlock full agent matching.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─── Live State Banner ─────────────────────────── */}
        {isLive && (
          <Card className="border-0 shadow-lg bg-green-50 ring-1 ring-green-200">
            <CardContent className="pt-6 pb-6">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-900">Your profile is live</h3>
                  <p className="text-sm text-green-700 mt-1">
                    All agents in your area can now see your property and express interest.
                    You'll be notified when agents want to connect.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Valuation Summary (compact) ───────────────── */}
        <Card className="border-0 shadow-md">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Locked Valuation</span>
              {isLocked && (
                <Badge className="bg-green-100 text-green-800 text-[10px] ml-auto">
                  {daysRemaining} days remaining
                </Badge>
              )}
            </div>
            <div className="flex items-baseline gap-3">
              <p className="text-2xl font-bold text-gray-900">
                {valuation?.estimatedMidpoint ? formatPrice(valuation.estimatedMidpoint) : '—'}
              </p>
              {valuation?.estimatedPriceLow && valuation?.estimatedPriceHigh && (
                <p className="text-sm text-gray-400">
                  {formatPrice(valuation.estimatedPriceLow)} – {formatPrice(valuation.estimatedPriceHigh)}
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Accepted</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5">
                  {acceptedAt ? acceptedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Valid Until</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5">
                  {lockedUntil ? lockedUntil.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Confidence</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5 capitalize">{valuation?.confidence || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Agent Interest (lightweight) ──────────────── */}
        <Card className="border-0 shadow-md">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Agent Interest</span>
              </div>
              {agentInterest.premiumOnly && (
                <Badge variant="secondary" className="text-[10px]">Premium only</Badge>
              )}
            </div>

            {agentInterest.total === 0 ? (
              <div className="mt-2">
                <p className="text-sm text-gray-700">No interest yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  {agentInterest.premiumOnly
                    ? 'Premium agents have been notified. Complete your profile to reach all agents.'
                    : 'Agents are reviewing your property. Interest typically arrives within 24–48 hours.'}
                </p>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    {agentInterest.expressed}
                  </span>
                  <span className="text-sm text-gray-600">
                    agent{agentInterest.expressed !== 1 ? 's' : ''} interested
                  </span>
                </div>
              </div>
            )}

            <p className="text-[10px] text-gray-400 mt-2">
              Agent identities remain anonymised until you choose to connect.
            </p>
          </CardContent>
        </Card>

        {/* ─── Property Summary ──────────────────────────── */}
        {(() => {
          const basics = valuation?.propertyBasics as Record<string, string> | null;
          if (!basics) return null;
          const items = [
            { key: 'propertyType', label: 'Type', transform: (v: string) => v.replace('-', ' ') },
            { key: 'bedrooms', label: 'Beds' },
            { key: 'bathrooms', label: 'Baths' },
            { key: 'receptionRooms', label: 'Receptions' },
            { key: 'sqft', label: 'Sq Ft' },
            { key: 'tenure', label: 'Tenure' },
          ].filter(item => basics[item.key]);

          if (items.length === 0) return null;

          return (
            <Card className="border-0 shadow-md">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Home className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Property Summary</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {items.map(item => (
                    <div key={item.key} className="text-center p-2.5 bg-gray-50 rounded-lg">
                      <p className="text-[10px] text-gray-400">{item.label}</p>
                      <p className="text-xs font-medium text-gray-800 capitalize mt-0.5">
                        {item.transform ? item.transform(basics[item.key]) : basics[item.key]}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* ─── Journey Timeline ──────────────────────────── */}
        {leadHistory && leadHistory.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-gray-500">
                <Clock className="w-4 h-4" />
                Journey Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leadHistory.map((entry, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 ${i === 0 ? 'bg-purple-600' : 'bg-gray-300'}`} />
                      {i < leadHistory.length - 1 && <div className="w-0.5 h-6 bg-gray-200 mt-1" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700">
                          {entry.newState.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(entry.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{entry.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Reassurance ───────────────────────────────── */}
        <div className="bg-green-50/70 border border-green-200 rounded-lg p-4 flex gap-3">
          <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-green-900">You're in control</p>
            <p className="text-xs text-green-700 mt-1">
              Your valuation is locked and your identity is protected. No agent can contact you directly until you choose to connect. You can pause or withdraw at any time.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Launch Confirmation Modal ─────────────────── */}
      <Dialog open={showLaunchModal} onOpenChange={setShowLaunchModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Launch your property profile
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              You're about to make your property visible to all agents in your area.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Your Valory valuation</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                {valuation?.estimatedMidpoint ? formatPrice(valuation.estimatedMidpoint) : '—'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <Users className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <span className="font-medium">All agents notified</span> — every relevant agent in your area will see your property.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <Eye className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Agent matching begins</span> — agents can express interest and you choose who to connect with.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <span className="font-medium">You stay in control</span> — no obligation. You decide the next steps.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLaunchModal(false)}
              disabled={completeProfileMutation.isPending}
              className="sm:flex-1"
            >
              Not yet
            </Button>
            <Button
              onClick={() => {
                if (valuation?.id) {
                  completeProfileMutation.mutate({ valuationId: valuation.id });
                }
              }}
              disabled={completeProfileMutation.isPending}
              className="sm:flex-1 bg-purple-600 hover:bg-purple-700 font-semibold"
            >
              {completeProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  Launching...
                </>
              ) : (
                <>
                  <Rocket className="mr-2" size={16} />
                  Launch Profile
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Header() {
  return (
    <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Home</span>
          </button>
        </Link>
        <span className="text-sm font-semibold text-purple-700 tracking-wide">VALORY</span>
        <div className="w-16" />
      </div>
    </div>
  );
}
