import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Filter, SortAsc } from 'lucide-react';
import SavedPropertyCard, { SavedPropertyCardProps } from './SavedPropertyCard';

export interface SavedPropertiesWatchlistProps {
  properties: SavedPropertyCardProps[];
  isLoading?: boolean;
  onPropertyClick?: (propertyId: number) => void;
  onUnsave?: (propertyId: number) => void;
}

export const SavedPropertiesWatchlist: React.FC<SavedPropertiesWatchlistProps> = ({
  properties,
  isLoading,
  onPropertyClick,
  onUnsave,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'saved' | 'price' | 'momentum' | 'updates'>('saved');
  const [filterMomentum, setFilterMomentum] = useState<'all' | 'high' | 'rising' | 'stable' | 'cooling'>('all');

  const filteredProperties = properties.filter((prop) => {
    const matchesSearch = prop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.postcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMomentum = filterMomentum === 'all' || prop.momentum === filterMomentum;
    return matchesSearch && matchesMomentum;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return b.price - a.price;
      case 'momentum':
        const momentumOrder = { high: 4, rising: 3, stable: 2, cooling: 1 };
        return (momentumOrder[b.momentum as keyof typeof momentumOrder] || 0) -
               (momentumOrder[a.momentum as keyof typeof momentumOrder] || 0);
      case 'updates':
        return b.unreadUpdates - a.unreadUpdates;
      case 'saved':
      default:
        return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    }
  });

  const getMomentumStats = () => {
    return {
      high: properties.filter(p => p.momentum === 'high').length,
      rising: properties.filter(p => p.momentum === 'rising').length,
      stable: properties.filter(p => p.momentum === 'stable').length,
      cooling: properties.filter(p => p.momentum === 'cooling').length,
      totalUpdates: properties.reduce((sum, p) => sum + p.unreadUpdates, 0),
    };
  };

  const stats = getMomentumStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Saved Properties Yet</h2>
        <p className="text-gray-600 mb-6">Start saving properties to build your personal watchlist</p>
        <Button className="bg-purple-600 hover:bg-purple-700">
          Explore Properties
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Property Watchlist</h1>
            <p className="text-gray-600 mt-1">{properties.length} saved properties</p>
          </div>
          <div className="text-right">
            {stats.totalUpdates > 0 && (
              <div className="text-2xl font-bold text-orange-500">{stats.totalUpdates} new updates</div>
            )}
          </div>
        </div>

        {/* Momentum Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <div className="text-2xl font-bold text-red-600">{stats.high}</div>
            <div className="text-xs font-semibold text-gray-600 uppercase">🔥 High Momentum</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.rising}</div>
            <div className="text-xs font-semibold text-gray-600 uppercase">📈 Rising Interest</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.stable}</div>
            <div className="text-xs font-semibold text-gray-600 uppercase">⏳ Stable</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{stats.cooling}</div>
            <div className="text-xs font-semibold text-gray-600 uppercase">📉 Cooling</div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search by address or postcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <Select value={filterMomentum} onValueChange={(value: any) => setFilterMomentum(value)}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Momentum</SelectItem>
              <SelectItem value="high">🔥 High</SelectItem>
              <SelectItem value="rising">📈 Rising</SelectItem>
              <SelectItem value="stable">⏳ Stable</SelectItem>
              <SelectItem value="cooling">📉 Cooling</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="saved">Recently Saved</SelectItem>
              <SelectItem value="price">Price (High to Low)</SelectItem>
              <SelectItem value="momentum">Momentum</SelectItem>
              <SelectItem value="updates">New Updates</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Properties Grid */}
      {sortedProperties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProperties.map((property) => (
            <SavedPropertyCard
              key={property.propertyId}
              {...property}
              onPropertyClick={onPropertyClick}
              onUnsave={onUnsave}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No properties match your filters</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setFilterMomentum('all');
            }}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default SavedPropertiesWatchlist;
