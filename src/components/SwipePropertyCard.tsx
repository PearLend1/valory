import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart, X, Bookmark, MapPin, Bed, Bath, Home,
  ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
import MomentumBadge from '@/components/MomentumBadge';
import { getPropertyThumbnailUrl } from '@/lib/propertyImages';

// ─── Types ──────────────────────────────────────────────────
export interface PropertyCardData {
  id: number;
  price: string | number;
  bedrooms?: number;
  bathrooms?: number;
  address?: string;
  addressPartial?: string;
  city?: string;
  postcode?: string;
  propertyType?: string;
  status?: string;
  timelineEvents?: any[];
  imageUrl?: string;
}

export type SwipeAction = 'favourite' | 'pass' | 'save';

interface SwipePropertyCardProps {
  property: PropertyCardData;
  onAction: (action: SwipeAction, propertyId: number) => void;
  isTop: boolean;
  stackIndex: number;
}

// ─── Swipe Thresholds ───────────────────────────────────────
const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 0.08;
const OPACITY_FACTOR = 0.005;

export const SwipePropertyCard: React.FC<SwipePropertyCardProps> = ({
  property,
  onAction,
  isTop,
  stackIndex,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  const deltaX = dragState.currentX - dragState.startX;
  const deltaY = dragState.currentY - dragState.startY;

  // ─── Touch Handlers ─────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isTop) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  }, [isTop]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.isDragging) return;
    setDragState(prev => ({
      ...prev,
      currentX: e.clientX,
      currentY: e.clientY,
    }));
  }, [dragState.isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!dragState.isDragging) return;

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      const action: SwipeAction = deltaX > 0 ? 'favourite' : 'pass';
      setExitDirection(deltaX > 0 ? 'right' : 'left');
      setTimeout(() => {
        onAction(action, property.id);
        setExitDirection(null);
      }, 300);
    }

    setDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
  }, [dragState.isDragging, deltaX, onAction, property.id]);

  // ─── Button Actions (Desktop) ───────────────────────────
  const handleButtonAction = useCallback((action: SwipeAction) => {
    const dir = action === 'favourite' ? 'right' : action === 'pass' ? 'left' : null;
    if (dir) {
      setExitDirection(dir);
      setTimeout(() => {
        onAction(action, property.id);
        setExitDirection(null);
      }, 300);
    } else {
      onAction(action, property.id);
    }
  }, [onAction, property.id]);

  // ─── Card Transform ─────────────────────────────────────
  const getCardStyle = (): React.CSSProperties => {
    if (exitDirection) {
      return {
        transform: `translateX(${exitDirection === 'right' ? '120%' : '-120%'}) rotate(${exitDirection === 'right' ? '15' : '-15'}deg)`,
        opacity: 0,
        transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
      };
    }

    if (!isTop) {
      const scale = 1 - stackIndex * 0.04;
      const yOffset = stackIndex * 8;
      return {
        transform: `scale(${scale}) translateY(${yOffset}px)`,
        opacity: 1 - stackIndex * 0.15,
        zIndex: 10 - stackIndex,
        pointerEvents: 'none' as const,
      };
    }

    if (dragState.isDragging) {
      const rotation = deltaX * ROTATION_FACTOR;
      return {
        transform: `translateX(${deltaX}px) translateY(${deltaY * 0.3}px) rotate(${rotation}deg)`,
        cursor: 'grabbing',
        zIndex: 20,
        transition: 'none',
      };
    }

    return {
      cursor: 'grab',
      zIndex: 20,
      transition: 'transform 0.3s ease-out',
    };
  };

  // ─── Swipe Indicator Opacity ────────────────────────────
  const favouriteOpacity = Math.max(0, Math.min(1, deltaX * OPACITY_FACTOR));
  const passOpacity = Math.max(0, Math.min(1, -deltaX * OPACITY_FACTOR));

  // ─── Format Price ───────────────────────────────────────
  const formatPrice = (price: string | number) => {
    const num = typeof price === 'string' ? parseInt(price) : price;
    if (num >= 1000000) return `£${(num / 1000000).toFixed(1)}m`;
    if (num >= 1000) return `£${Math.round(num / 1000)}k`;
    return `£${num.toLocaleString()}`;
  };

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 touch-none select-none"
      style={getCardStyle()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <Card className="h-full overflow-hidden border-0 shadow-xl rounded-2xl bg-white">
        {/* ─── Swipe Indicators (Mobile) ─────────────────── */}
        {dragState.isDragging && (
          <>
            {/* Favourite indicator (right swipe) */}
            <div
              className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
              style={{ opacity: favouriteOpacity }}
            >
              <div className="bg-green-500/90 rounded-2xl px-6 py-3 rotate-[-15deg] border-4 border-green-400">
                <div className="flex items-center gap-2 text-white font-bold text-2xl">
                  <Heart className="w-8 h-8 fill-white" />
                  FAVOURITE
                </div>
              </div>
            </div>
            {/* Pass indicator (left swipe) */}
            <div
              className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
              style={{ opacity: passOpacity }}
            >
              <div className="bg-red-500/90 rounded-2xl px-6 py-3 rotate-[15deg] border-4 border-red-400">
                <div className="flex items-center gap-2 text-white font-bold text-2xl">
                  <X className="w-8 h-8" />
                  PASS
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── Property Image ────────────────────────────── */}
        <div className="relative h-[55%] bg-slate-200 overflow-hidden">
          <img
            src={property.imageUrl || getPropertyThumbnailUrl(property.id, property.propertyType)}
            alt={property.address || 'Property'}
            className="w-full h-full object-cover"
            draggable={false}
          />

          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${
              property.status === 'active' ? 'bg-green-500 text-white' :
              property.status === 'sold' ? 'bg-gray-700 text-white' :
              'bg-yellow-500 text-white'
            }`}>
              {property.status === 'active' ? 'For Sale' : property.status === 'sold' ? 'Sold' : 'Withdrawn'}
            </span>
          </div>

          {/* Momentum Badge */}
          {property.timelineEvents && property.timelineEvents.length > 0 && (
            <div className="absolute bottom-4 left-4">
              <MomentumBadge timelineEvents={property.timelineEvents} size="sm" showTooltip={false} />
            </div>
          )}

          {/* Price Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
            <div className="text-3xl font-bold text-white">
              {formatPrice(property.price)}
            </div>
          </div>
        </div>

        {/* ─── Property Details ──────────────────────────── */}
        <div className="p-5 space-y-3 h-[45%] flex flex-col">
          {/* Beds / Baths / Type */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {property.bedrooms && (
              <div className="flex items-center gap-1.5">
                <Bed size={16} className="text-gray-400" />
                <span className="font-medium">{property.bedrooms} bed</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1.5">
                <Bath size={16} className="text-gray-400" />
                <span className="font-medium">{property.bathrooms} bath</span>
              </div>
            )}
            {property.propertyType && (
              <Badge variant="secondary" className="text-xs capitalize">
                {property.propertyType}
              </Badge>
            )}
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 text-gray-700">
            <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{property.addressPartial || property.address}</p>
              <p className="text-xs text-gray-500">{property.city} {property.postcode}</p>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* ─── Desktop Action Buttons ──────────────────── */}
          <div className="hidden md:flex items-center justify-center gap-4 pt-3 border-t">
            <Button
              variant="outline"
              size="lg"
              onClick={(e) => { e.stopPropagation(); handleButtonAction('pass'); }}
              className="w-14 h-14 rounded-full border-2 border-red-200 hover:border-red-400 hover:bg-red-50 p-0 transition-all hover:scale-110"
              title="Pass"
            >
              <X className="w-6 h-6 text-red-500" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={(e) => { e.stopPropagation(); handleButtonAction('save'); }}
              className="w-12 h-12 rounded-full border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 p-0 transition-all hover:scale-110"
              title="Save for later"
            >
              <Bookmark className="w-5 h-5 text-blue-500" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={(e) => { e.stopPropagation(); handleButtonAction('favourite'); }}
              className="w-14 h-14 rounded-full border-2 border-green-200 hover:border-green-400 hover:bg-green-50 p-0 transition-all hover:scale-110"
              title="Favourite"
            >
              <Heart className="w-6 h-6 text-green-500" />
            </Button>
          </div>

          {/* ─── Mobile Action Buttons (visible tap targets) */}
          <div className="flex md:hidden items-center justify-center gap-3 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleButtonAction('pass'); }}
              className="rounded-full border-red-200 hover:border-red-400 hover:bg-red-50 px-4 gap-1.5"
            >
              <X className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600 font-medium">Pass</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleButtonAction('save'); }}
              className="rounded-full border-blue-200 hover:border-blue-400 hover:bg-blue-50 px-4 gap-1.5"
            >
              <Bookmark className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-600 font-medium">Save</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleButtonAction('favourite'); }}
              className="rounded-full border-green-200 hover:border-green-400 hover:bg-green-50 px-4 gap-1.5"
            >
              <Heart className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600 font-medium">Like</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ─── Discovery Feed Container ───────────────────────────────
interface DiscoveryFeedProps {
  properties: PropertyCardData[];
  onFavourite: (propertyId: number) => void;
  onPass: (propertyId: number) => void;
  onSave: (propertyId: number) => void;
  onViewDetail: (propertyId: number) => void;
  isLoading?: boolean;
}

export const DiscoveryFeed: React.FC<DiscoveryFeedProps> = ({
  properties,
  onFavourite,
  onPass,
  onSave,
  onViewDetail,
  isLoading,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleCards = properties.slice(currentIndex, currentIndex + 3);

  const handleAction = useCallback((action: SwipeAction, propertyId: number) => {
    switch (action) {
      case 'favourite':
        onFavourite(propertyId);
        break;
      case 'pass':
        onPass(propertyId);
        break;
      case 'save':
        onSave(propertyId);
        break;
    }
    setCurrentIndex(prev => prev + 1);
  }, [onFavourite, onPass, onSave]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
          <p className="text-gray-500 text-sm">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= properties.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center px-4">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <Eye className="w-10 h-10 text-purple-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">You've seen all properties</h3>
        <p className="text-gray-500 text-sm max-w-sm">
          Check back soon for new listings, or adjust your filters to discover more homes.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto" style={{ height: '600px' }}>
      {/* Card Stack */}
      <div className="relative w-full h-full">
        {visibleCards.map((property, i) => (
          <SwipePropertyCard
            key={property.id}
            property={property}
            onAction={handleAction}
            isTop={i === 0}
            stackIndex={i}
          />
        ))}
      </div>

      {/* Progress indicator */}
      <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-2">
        <span className="text-xs text-gray-400">
          {currentIndex + 1} of {properties.length}
        </span>
        <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / properties.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Swipe hint (mobile only, first card) */}
      {currentIndex === 0 && (
        <div className="md:hidden absolute -bottom-14 left-0 right-0 text-center">
          <div className="inline-flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <ChevronLeft size={12} /> Pass
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1">
              Favourite <ChevronRight size={12} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveryFeed;
