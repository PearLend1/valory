'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DiscoveryFeed, type SwipeAction } from '@/components/SwipePropertyCard';
import ImmersiveDiscoverCards from '@/components/ImmersiveDiscoverCards';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  Home, Search, SlidersHorizontal, X, ChevronLeft,
  Heart, Bookmark, Grid3X3, Layers
} from 'lucide-react';

type ViewMode = 'swipe' | 'grid';

export default function BuyerDiscovery() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>('swipe');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    type: undefined as any,
    minPrice: undefined as any,
    maxPrice: undefined as any,
    limit: 50,
    offset: 0,
  });

  const queryFilters = useMemo(() => ({
    ...filters,
    city: filters.city.trim() || undefined,
  }), [filters]);

  const { data: properties, isLoading } = trpc.properties.list.useQuery(queryFilters);

  // ─── Action Handlers ──────────────────────────────────────
  const handleFavourite = useCallback((propertyId: number) => {
    toast.success('Added to favourites', {
      description: 'View your favourites in Saved Properties',
      action: {
        label: 'View',
        onClick: () => navigate('/saved'),
      },
    });
  }, [navigate]);

  const handlePass = useCallback((propertyId: number) => {
    // Silent pass — no toast needed for smooth experience
  }, []);

  const handleSave = useCallback((propertyId: number) => {
    toast('Saved for later', {
      description: 'Pinned to your saved list',
      icon: <Bookmark className="w-4 h-4 text-amber-500" />,
    });
  }, []);

  const handleViewDetail = useCallback((propertyId: number) => {
    navigate(`/property/${propertyId}`);
  }, [navigate]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const formatPrice = (price: string | number) => {
    const num = typeof price === 'string' ? parseInt(price) : price;
    if (num >= 1000000) return `£${(num / 1000000).toFixed(1)}m`;
    if (num >= 1000) return `£${Math.round(num / 1000)}k`;
    return `£${num.toLocaleString()}`;
  };

  const activeFilterCount = [
    filters.city,
    filters.type,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;

  // Use immersive cards view by default
  if (viewMode !== 'grid') {
    return (
      <>
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-accent/10 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center glow-copper-sm">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
                <span className="text-lg font-bold text-white tracking-wider">VALORY</span>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/sell" className="text-foreground/70 hover:text-accent transition-colors">Sell</Link>
              <Link href="/discover" className="text-accent font-semibold">Buy</Link>
              <Link href="/agents" className="text-foreground/70 hover:text-accent transition-colors">For Agents</Link>
            </div>
            <button
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-1.5 text-foreground/50 hover:text-accent transition-colors text-xs font-medium border border-accent/20 px-3 py-1.5 rounded-lg hover:border-accent/40"
            >
              <Grid3X3 size={14} />
              <span className="hidden sm:inline">Grid view</span>
            </button>
          </div>
        </nav>
        <div className="pt-14">
          <ImmersiveDiscoverCards
            properties={properties || []}
            isLoading={isLoading}
            onPropertyDetail={handleViewDetail}
          />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ─── Nav ──────────────────────────────────────────── */}
      <nav className="border-b border-accent/10 bg-slate-950/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center glow-copper-sm">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-lg font-bold text-white tracking-wider">VALORY</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/sell" className="text-foreground/70 hover:text-accent transition-colors">Sell</Link>
            <Link href="/discover" className="text-accent font-semibold">Buy</Link>
            <Link href="/agents" className="text-foreground/70 hover:text-accent transition-colors">For Agents</Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('swipe' as ViewMode)}
              className="p-1.5 rounded-md text-foreground/50 hover:text-accent transition-all"
              title="Card view"
            >
              <Layers size={16} />
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`gap-1.5 border-slate-700 text-slate-300 hover:text-accent hover:border-accent/50 ${activeFilterCount > 0 ? 'border-accent/50 text-accent' : ''}`}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <Badge className="bg-accent text-background text-[10px] h-4 w-4 p-0 flex items-center justify-center rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* ─── Filters Panel ─────────────────────────────── */}
        {showFilters && (
          <div className="border-t border-slate-800 bg-slate-900 px-4 py-4 animate-in fade-in duration-200">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Input
                  placeholder="City or area"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-10"
                />
                <Select value={filters.type || 'all'} onValueChange={(v) => handleFilterChange('type', v === 'all' ? undefined : v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Min price"
                  type="number"
                  value={filters.minPrice || ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-10"
                />
                <Input
                  placeholder="Max price"
                  type="number"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilters({ city: '', type: undefined, minPrice: undefined, maxPrice: undefined, limit: 50, offset: 0 });
                    setShowFilters(false);
                  }}
                  className="text-slate-400 hover:text-amber-500 h-10"
                >
                  <X size={14} className="mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Content ─────────────────────────────────────── */}
      <div className="py-8 pb-20">
        {viewMode !== 'grid' ? (
          /* ─── Swipe Mode ─────────────────────────────── */
          <div className="px-4">
            <DiscoveryFeed
              properties={properties || []}
              onFavourite={handleFavourite}
              onPass={handlePass}
              onSave={handleSave}
              onViewDetail={handleViewDetail}
              isLoading={isLoading}
            />
          </div>
        ) : (
          /* ─── Grid Mode (Desktop) ────────────────────── */
          <div className="max-w-6xl mx-auto px-4">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
              </div>
            ) : properties && properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(properties as any[]).map((property: any) => (
                  <Link key={property.id} href={`/property/${property.id}`}>
                    <div className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-amber-500/20 transition-all cursor-pointer">
                      {/* Image */}
                      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 h-48">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Home className="text-slate-700" size={48} />
                        </div>
                        {property.status === 'active' && (
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white">
                              For Sale
                            </span>
                          </div>
                        )}
                        {/* Price overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3 pt-8">
                          <span className="text-xl font-bold text-amber-500">{formatPrice(property.price)}</span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          {property.bedrooms && <span>{property.bedrooms} bed</span>}
                          {property.bathrooms && <span>{property.bathrooms} bath</span>}
                        </div>
                        <p className="text-sm text-slate-300 truncate">
                          {property.addressPartial || property.address}, {property.city}
                        </p>

                        {/* Grid Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              handleFavourite(property.id);
                            }}
                            className="flex-1 text-slate-400 hover:text-amber-500 hover:bg-slate-800"
                          >
                            <Heart size={14} className="mr-1" />
                            Favourite
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSave(property.id);
                            }}
                            className="flex-1 text-slate-400 hover:text-amber-500 hover:bg-slate-800"
                          >
                            <Bookmark size={14} className="mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-400">No properties found. Try adjusting your filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
