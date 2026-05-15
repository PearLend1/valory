import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Bed, Bath, AlertCircle } from 'lucide-react';
import MomentumBadge from './MomentumBadge';

export interface SavedPropertyCardProps {
  propertyId: number;
  address: string;
  postcode: string;
  price: number;
  beds: number;
  baths: number;
  propertyType: string;
  mainImage: string;
  videoThumbnail?: string;
  momentum: 'high' | 'rising' | 'stable' | 'cooling';
  latestEvent?: {
    type: string;
    timestamp: Date;
    description: string;
  };
  unreadUpdates: number;
  savedAt: Date;
  onPropertyClick?: (propertyId: number) => void;
  onUnsave?: (propertyId: number) => void;
}

export const SavedPropertyCard: React.FC<SavedPropertyCardProps> = ({
  propertyId,
  address,
  postcode,
  price,
  beds,
  baths,
  propertyType,
  mainImage,
  videoThumbnail,
  momentum,
  latestEvent,
  unreadUpdates,
  savedAt,
  onPropertyClick,
  onUnsave,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  const handleUnsave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(false);
    onUnsave?.(propertyId);
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(p);
  };

  const formatEventTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="group cursor-pointer transition-all duration-300 hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPropertyClick?.(propertyId)}
    >
      <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-video shadow-md transition-shadow group-hover:shadow-xl">
        {/* Main Image */}
        <img
          src={mainImage}
          alt={address}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Video Badge */}
        {videoThumbnail && (
          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs font-semibold text-gray-700 flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Video
          </div>
        )}

        {/* Momentum Badge */}
        <div className="absolute top-2 left-2">
          <MomentumBadge momentum={momentum} />
        </div>

        {/* Unread Updates Badge */}
        {unreadUpdates > 0 && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-orange-500 text-white flex items-center gap-1 animate-pulse">
              <AlertCircle className="w-3 h-3" />
              {unreadUpdates} new
            </Badge>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleUnsave}
          className={`absolute bottom-2 left-2 p-2 rounded-full transition-all duration-200 ${
            isSaved
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-300 text-gray-600'
          }`}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Overlay on Hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200">
            <div className="text-white text-center">
              <p className="text-sm font-semibold">View Details</p>
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="mt-3 space-y-2">
        {/* Price */}
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-bold text-gray-900">{formatPrice(price)}</h3>
          <span className="text-xs text-gray-500 font-medium uppercase">{propertyType}</span>
        </div>

        {/* Address */}
        <div className="flex items-start gap-1">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{address}</p>
            <p className="text-xs text-gray-500">{postcode}</p>
          </div>
        </div>

        {/* Property Details */}
        <div className="flex gap-4 text-xs text-gray-600 font-medium">
          <div className="flex items-center gap-1">
            <Bed className="w-4 h-4" />
            <span>{beds} bed{beds !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4" />
            <span>{baths} bath{baths !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Latest Event */}
        {latestEvent && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-gray-700">{latestEvent.type}</span>
              {' '}
              <span className="text-gray-500">{formatEventTime(latestEvent.timestamp)}</span>
            </p>
            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{latestEvent.description}</p>
          </div>
        )}

        {/* Saved Date */}
        <p className="text-xs text-gray-400 pt-1">
          Saved {formatEventTime(savedAt)}
        </p>
      </div>
    </div>
  );
};

export default SavedPropertyCard;
