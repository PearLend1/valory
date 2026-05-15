/**
 * ImmersiveDiscoverCards
 *
 * Full-screen property browser — TikTok vertical feed meets Tinder swipe.
 *
 * Interactions:
 *   Swipe / Arrow Right  → Like (adds to favourites, advances)
 *   Swipe / Arrow Left   → Pass (advances)
 *   Swipe / Arrow Up     → Next property
 *   Swipe / Arrow Down   → Previous property
 *   Touch sidebar icons  → Like, Save, Share
 *   Tap "View details"   → Property detail page
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Heart, X, Bookmark, MapPin, Bed, Bath,
  Share2, Eye, Clock, ChevronUp,
} from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';
import MomentumBadge from '@/components/MomentumBadge';
import { getPropertyImageUrl } from '@/lib/propertyImages';

interface Property {
  id: number;
  address: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  type: string;
  timelineEvents?: any[];
  saves?: number;
  views?: number;
  daysOnMarket?: number;
}

interface Props {
  properties: Property[];
  isLoading: boolean;
  onPropertyDetail: (id: number) => void;
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `£${(price / 1_000_000).toFixed(1)}m`;
  if (price >= 1_000) return `£${Math.round(price / 1_000)}k`;
  return `£${price.toLocaleString()}`;
}

export default function ImmersiveDiscoverCards({ properties, isLoading, onPropertyDetail }: Props) {
  const [index, setIndex] = useState(0);
  const [likedIds, setLikedIds]   = useState<Set<number>>(new Set());
  const [savedIds, setSavedIds]   = useState<Set<number>>(new Set());
  const [exitDir, setExitDir]     = useState<'left' | 'right' | null>(null);
  const [entering, setEntering]   = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const busy = useRef(false);

  const p = properties[index];

  // ─── Navigation ─────────────────────────────────────────────
  const advance = useCallback((dir: 'left' | 'right') => {
    if (busy.current) return;
    busy.current = true;
    setExitDir(dir);
    setTimeout(() => {
      setExitDir(null);
      setEntering(true);
      setIndex(i => i + 1);
      setTimeout(() => { setEntering(false); busy.current = false; }, 50);
    }, 340);
  }, []);

  const goBack = useCallback(() => {
    if (busy.current || index === 0) return;
    busy.current = true;
    setEntering(true);
    setIndex(i => i - 1);
    setTimeout(() => { setEntering(false); busy.current = false; }, 300);
  }, [index]);

  // ─── Actions ────────────────────────────────────────────────
  const handleLike = useCallback(() => {
    if (!p) return;
    setLikedIds(prev => {
      const next = new Set(prev);
      if (!next.has(p.id)) {
        next.add(p.id);
        toast.success('Added to favourites ❤️');
      } else {
        next.delete(p.id);
      }
      return next;
    });
    advance('right');
  }, [p, advance]);

  const handlePass = useCallback(() => {
    advance('left');
  }, [advance]);

  const handleSave = useCallback(() => {
    if (!p) return;
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(p.id)) {
        next.delete(p.id);
        toast('Removed from saved');
      } else {
        next.add(p.id);
        toast.success('Saved for later 🔖');
      }
      return next;
    });
  }, [p]);

  // ─── Touch ──────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      dx > 0 ? handleLike() : handlePass();
    } else if (dy < -70 && Math.abs(dy) > Math.abs(dx)) {
      advance('left');
    } else if (dy > 70 && Math.abs(dy) > Math.abs(dx)) {
      goBack();
    }
  };

  // ─── Keyboard ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleLike();
      if (e.key === 'ArrowLeft')  handlePass();
      if (e.key === 'ArrowDown')  advance('left');
      if (e.key === 'ArrowUp')    goBack();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleLike, handlePass, advance, goBack]);

  // ─── States ─────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-slate-800 rounded-full animate-pulse mx-auto" />
        <p className="text-slate-400 text-sm">Loading properties…</p>
      </div>
    </div>
  );

  if (!properties.length) return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <p className="text-slate-400">No properties found — try adjusting filters.</p>
    </div>
  );

  if (index >= properties.length) return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="text-center space-y-4 px-6">
        <div className="text-6xl">🏡</div>
        <p className="text-slate-200 font-semibold text-lg">You've seen everything!</p>
        <p className="text-slate-400 text-sm">New properties are added weekly.</p>
        <button
          onClick={() => { setIndex(0); setLikedIds(new Set()); }}
          className="mt-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-full text-sm transition-colors"
        >
          Start over
        </button>
      </div>
    </div>
  );

  const isLiked = likedIds.has(p.id);
  const isSaved = savedIds.has(p.id);
  const imgUrl  = getPropertyImageUrl(p.id, p.type);
  const isNew   = !p.daysOnMarket || p.daysOnMarket < 14;

  // Exit transform
  const exitStyle: React.CSSProperties = exitDir
    ? {
        transform: `translateX(${exitDir === 'right' ? '115%' : '-115%'}) rotate(${exitDir === 'right' ? 14 : -14}deg)`,
        opacity: 0,
        transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.32s ease',
      }
    : entering
    ? { transform: 'translateY(4%) scale(0.97)', opacity: 0, transition: 'none' }
    : {
        transform: 'translateY(0) scale(1)',
        opacity: 1,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
      };

  return (
    <div
      className="relative w-full h-screen bg-slate-950 overflow-hidden touch-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Progress segments ─────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 px-3 pt-3">
        {properties.slice(0, Math.min(properties.length, 12)).map((_, i) => (
          <div key={i} className="h-[2px] flex-1 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-300"
              style={{ width: i < index ? '100%' : i === index ? '100%' : '0%', opacity: i === index ? 0.9 : 0.6 }}
            />
          </div>
        ))}
        {properties.length > 12 && (
          <span className="text-white/40 text-[10px] ml-1 self-center">{index + 1}/{properties.length}</span>
        )}
      </div>

      {/* ── Card ──────────────────────────────────────────── */}
      <div className="absolute inset-0" style={exitStyle}>
        {/* Full-bleed photo */}
        <img
          key={p.id}
          src={imgUrl}
          alt={`${p.address} property photo`}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Cinematic bottom scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/30 to-transparent" />

        {/* Top status badges */}
        <div className="absolute top-12 left-4 flex items-center gap-2 z-10">
          <span className="px-2.5 py-1 bg-emerald-500/85 backdrop-blur-sm text-white text-[11px] font-semibold rounded-full tracking-wide">
            For Sale
          </span>
          {isNew && (
            <span className="px-2.5 py-1 bg-amber-500/85 backdrop-blur-sm text-white text-[11px] font-semibold rounded-full">
              New
            </span>
          )}
          {p.timelineEvents && p.timelineEvents.length > 0 && (
            <MomentumBadge timelineEvents={p.timelineEvents} size="sm" showTooltip={false} />
          )}
        </div>

        {/* ── TikTok right sidebar ──────────────────────── */}
        <div className="absolute right-3 z-20 flex flex-col gap-5 items-center"
          style={{ bottom: '7.5rem' }}>

          {/* Like */}
          <button
            onClick={handleLike}
            aria-label={isLiked ? 'Unlike property' : 'Like property'}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
              isLiked ? 'bg-rose-500 scale-110' : 'bg-black/50 group-hover:bg-rose-500/30'
            }`}>
              <Heart
                className="w-5 h-5 text-white transition-all"
                fill={isLiked ? 'currentColor' : 'none'}
              />
            </div>
            <span className="text-white/70 text-[10px] font-medium">
              {(p.saves ?? 0) + (isLiked ? 1 : 0)}
            </span>
          </button>

          {/* Save / Bookmark */}
          <button
            onClick={handleSave}
            aria-label={isSaved ? 'Unsave property' : 'Save property'}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
              isSaved ? 'bg-amber-500 scale-110' : 'bg-black/50 group-hover:bg-amber-500/30'
            }`}>
              <Bookmark
                className="w-5 h-5 text-white"
                fill={isSaved ? 'currentColor' : 'none'}
              />
            </div>
            <span className="text-white/70 text-[10px] font-medium">Save</span>
          </button>

          {/* Share */}
          <button aria-label="Share property" className="flex flex-col items-center gap-1 group">
            <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm group-hover:bg-white/15 flex items-center justify-center transition-all">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/70 text-[10px] font-medium">Share</span>
          </button>

          {/* Views */}
          {!!p.views && (
            <div className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <Eye className="w-5 h-5 text-white/70" />
              </div>
              <span className="text-white/60 text-[10px]">{p.views}</span>
            </div>
          )}
        </div>

        {/* ── Property info overlay ──────────────────────── */}
        <div className="absolute left-0 right-16 z-10 px-5 space-y-2" style={{ bottom: '7.5rem' }}>
          {/* Price */}
          <div className="text-[2.4rem] font-bold text-amber-400 leading-none tracking-tight drop-shadow-lg">
            {formatPrice(p.price)}
          </div>

          {/* Address */}
          <div className="flex items-start gap-1.5 text-white/90">
            <MapPin size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm font-medium leading-snug">{p.address}</span>
          </div>
          <p className="text-white/50 text-xs pl-0.5">{p.city}</p>

          {/* Chips */}
          <div className="flex gap-1.5 flex-wrap pt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 backdrop-blur-sm text-white text-[11px] rounded-full">
              <Bed size={10} /> {p.bedrooms} bed
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 backdrop-blur-sm text-white text-[11px] rounded-full">
              <Bath size={10} /> {p.bathrooms} bath
            </span>
            <span className="px-2.5 py-1 bg-white/10 backdrop-blur-sm text-white text-[11px] rounded-full capitalize">
              {p.type}
            </span>
            {!!p.daysOnMarket && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 backdrop-blur-sm text-white text-[11px] rounded-full">
                <Clock size={10} /> {p.daysOnMarket}d
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Swipe overlays (live feedback) ────────────────── */}
      {exitDir === 'right' && (
        <div className="absolute inset-0 z-40 flex items-center justify-start pl-10 pointer-events-none">
          <div className="border-[3px] border-emerald-400 text-emerald-400 font-bold text-2xl tracking-widest px-5 py-2 rounded-lg -rotate-12">
            LIKE
          </div>
        </div>
      )}
      {exitDir === 'left' && (
        <div className="absolute inset-0 z-40 flex items-center justify-end pr-10 pointer-events-none">
          <div className="border-[3px] border-rose-400 text-rose-400 font-bold text-2xl tracking-widest px-5 py-2 rounded-lg rotate-12">
            SKIP
          </div>
        </div>
      )}

      {/* ── Bottom action bar ─────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-white/5 px-5 py-3.5 flex items-center gap-3">
        {/* Pass */}
        <button
          onClick={handlePass}
          aria-label="Skip property"
          className="w-13 h-13 flex-shrink-0 w-[52px] h-[52px] rounded-full bg-slate-800/80 border border-slate-700 hover:bg-rose-500/15 hover:border-rose-500/40 transition-all flex items-center justify-center"
        >
          <X className="w-5 h-5 text-slate-300" />
        </button>

        {/* View details */}
        <Link href={`/property/${p.id}`} className="flex-1">
          <button className="w-full h-11 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-full transition-all">
            View details
          </button>
        </Link>

        {/* Like */}
        <button
          onClick={handleLike}
          aria-label={isLiked ? 'Unlike' : 'Like property'}
          className={`flex-shrink-0 w-[52px] h-[52px] rounded-full border transition-all flex items-center justify-center ${
            isLiked
              ? 'bg-rose-500/20 border-rose-500/50 scale-105'
              : 'bg-slate-800/80 border-slate-700 hover:bg-rose-500/15 hover:border-rose-500/40'
          }`}
        >
          <Heart
            className="w-5 h-5 text-rose-400 transition-all"
            fill={isLiked ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      {/* ── First-card hint ───────────────────────────────── */}
      {index === 0 && (
        <div className="absolute z-20 left-0 right-0 flex justify-between items-end px-6 pointer-events-none"
          style={{ bottom: '6rem' }}>
          <span className="text-white/25 text-[11px] font-medium">← skip</span>
          <div className="flex flex-col items-center text-white/25 text-[11px] gap-0.5">
            <ChevronUp size={11} />
            <span>next</span>
          </div>
          <span className="text-white/25 text-[11px] font-medium">like →</span>
        </div>
      )}
    </div>
  );
}
