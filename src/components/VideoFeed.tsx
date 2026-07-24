/**
 * VideoFeed — TikTok / YouTube Shorts style vertical property feed.
 *
 * - Full-height snap-scroll feed: one property per screen, swipe/scroll/arrow-keys to move
 * - Video-first: listings with videoUrl autoplay (muted, looped) when in view
 * - Photo-only listings get a slow Ken Burns motion so every card feels alive
 * - All action icons live in a bottom bar: Not for me · Save · Enquire · Share · Details
 * - Desktop: centred 9:16 column on a dark stage (TikTok web style) with side nav arrows
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Heart, X, Share2, MessageCircle, ChevronUp, ChevronDown,
  Bed, Bath, MapPin, Volume2, VolumeX, Eye, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import MomentumBadge from '@/components/MomentumBadge';
import { getPropertyImageUrl } from '@/lib/propertyImages';

interface FeedProperty {
  id: number;
  address: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  type: string;
  videoUrl?: string | null;
  timelineEvents?: any[];
  saves?: number;
  views?: number;
  daysOnMarket?: number;
}

interface Props {
  properties: FeedProperty[];
  isLoading: boolean;
  onPropertyDetail: (id: number) => void;
  onSave?: (id: number) => void;
  onPass?: (id: number) => void;
  onEnquire?: (id: number) => void;
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `£${(price / 1_000_000).toFixed(1)}m`;
  if (price >= 1_000) return `£${Math.round(price / 1_000)}k`;
  return `£${price.toLocaleString()}`;
}

/** One full-screen feed card */
function FeedCard({
  p, idx, muted, onToggleMute, saved, onSave, onPass, onEnquire, onDetail,
}: {
  p: FeedProperty;
  idx: number;
  muted: boolean;
  onToggleMute: () => void;
  saved: boolean;
  onSave: () => void;
  onPass: () => void;
  onEnquire: () => void;
  onDetail: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [inView, setInView] = useState(false);
  const [likedPulse, setLikedPulse] = useState(false);

  const imgUrl = getPropertyImageUrl(p.id, p.type);
  const hasVideo = !!p.videoUrl && !videoFailed;

  // Play/pause video based on visibility
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.intersectionRatio >= 0.6),
      { threshold: [0, 0.6, 1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView) {
      v.play().catch(() => {/* autoplay blocked until interaction — poster shows */});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [inView, hasVideo]);

  const handleDoubleTap = () => {
    if (!saved) onSave();
    setLikedPulse(true);
    setTimeout(() => setLikedPulse(false), 700);
  };

  // Alternate Ken Burns direction per card so consecutive photos feel distinct
  const kenBurnsClass = idx % 2 === 0 ? 'animate-kenburns-a' : 'animate-kenburns-b';

  return (
    <div
      ref={cardRef}
      className="relative w-full h-full snap-start snap-always shrink-0 overflow-hidden bg-black select-none"
      onDoubleClick={handleDoubleTap}
    >
      {/* ── Media layer ── */}
      {hasVideo ? (
        <video
          ref={videoRef}
          src={p.videoUrl as string}
          poster={imgUrl}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={imgUrl}
            alt={`${p.address}, ${p.city}`}
            draggable={false}
            className={`absolute inset-0 w-full h-full object-cover will-change-transform ${inView ? kenBurnsClass : ''}`}
          />
        </div>
      )}

      {/* ── Scrims ── */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none" />

      {/* ── Double-tap heart pulse ── */}
      {likedPulse && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <Heart className="w-28 h-28 text-white fill-rose-500 drop-shadow-2xl animate-heart-pop" />
        </div>
      )}

      {/* ── Top row: status + sound ── */}
      <div className="absolute top-3 inset-x-3 flex items-start justify-between z-20">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-emerald-500/85 backdrop-blur-sm text-white text-[11px] font-semibold rounded-full tracking-wide">
            For Sale
          </span>
          {p.timelineEvents && p.timelineEvents.length > 0 && (
            <MomentumBadge timelineEvents={p.timelineEvents} size="sm" showTooltip={false} />
          )}
        </div>
        {hasVideo && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
            aria-label={muted ? 'Unmute video' : 'Mute video'}
            className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/65 transition-colors"
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
        )}
      </div>

      {/* ── Bottom info block ── */}
      <div className="absolute bottom-[88px] inset-x-0 px-4 z-20 pointer-events-none">
        <div className="pointer-events-auto max-w-lg">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-3xl font-extrabold text-white drop-shadow-md leading-none">
                {formatPrice(p.price)}
              </p>
              <p className="mt-2 text-white/95 font-semibold text-[15px] truncate">{p.address}</p>
              <p className="flex items-center gap-1 text-white/70 text-[13px] mt-0.5">
                <MapPin size={13} className="shrink-0" /> {p.city}
              </p>
              <div className="flex items-center gap-3 mt-2 text-white/85 text-[13px] font-medium">
                <span className="flex items-center gap-1"><Bed size={14} /> {p.bedrooms}</span>
                <span className="flex items-center gap-1"><Bath size={14} /> {p.bathrooms}</span>
                <span className="capitalize px-2 py-0.5 bg-white/15 backdrop-blur-sm rounded-full text-[11px]">
                  {p.type}
                </span>
                {typeof p.views === 'number' && p.views > 0 && (
                  <span className="flex items-center gap-1 text-white/60">
                    <Eye size={13} /> {p.views >= 1000 ? `${(p.views / 1000).toFixed(1)}k` : p.views}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onDetail}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-[13px] font-semibold rounded-full transition-colors"
            >
              Details <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom action bar ── */}
      <div className="absolute bottom-0 inset-x-0 z-20 px-4 pb-4 pt-1">
        <div className="mx-auto max-w-lg flex items-center justify-around bg-black/40 backdrop-blur-lg rounded-2xl py-2.5 px-2 border border-white/10">
          <FeedAction
            icon={<X size={22} />}
            label="Not for me"
            onClick={onPass}
            className="text-white/80 hover:text-white"
          />
          <FeedAction
            icon={<Heart size={22} className={saved ? 'fill-rose-500 text-rose-500' : ''} />}
            label={saved ? 'Saved' : 'Save'}
            onClick={onSave}
            className={saved ? 'text-rose-400' : 'text-white/80 hover:text-rose-300'}
          />
          <FeedAction
            icon={<MessageCircle size={22} />}
            label="Enquire"
            onClick={onEnquire}
            className="text-white/80 hover:text-accent"
            emphasis
          />
          <FeedAction
            icon={<Share2 size={22} />}
            label="Share"
            onClick={async () => {
              const url = `${window.location.origin}/property/${p.id}`;
              try {
                if (navigator.share) {
                  await navigator.share({ title: `${p.address}, ${p.city}`, url });
                } else {
                  await navigator.clipboard.writeText(url);
                  toast.success('Link copied to clipboard');
                }
              } catch { /* user dismissed share sheet */ }
            }}
            className="text-white/80 hover:text-white"
          />
        </div>
      </div>
    </div>
  );
}

function FeedAction({
  icon, label, onClick, className = '', emphasis = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  emphasis?: boolean;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${className}`}
    >
      <span className={emphasis
        ? 'w-11 h-11 -mt-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-900/40'
        : 'flex items-center justify-center'}>
        {icon}
      </span>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}

export default function VideoFeed({
  properties, isLoading, onPropertyDetail, onSave, onPass, onEnquire,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [passedIds, setPassedIds] = useState<Set<number>>(new Set());

  const visible = properties.filter(p => !passedIds.has(p.id));

  const scrollByCard = useCallback((dir: 1 | -1) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ top: dir * el.clientHeight, behavior: 'smooth' });
  }, []);

  // Keyboard navigation (desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); scrollByCard(1); }
      if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); scrollByCard(-1); }
      if (e.key === 'm') setMuted(m => !m);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scrollByCard]);

  const handleSave = (id: number) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      next.add(id);
      return next;
    });
    if (!savedIds.has(id)) {
      onSave?.(id);
    }
  };

  const handlePass = (id: number) => {
    setPassedIds(prev => new Set(prev).add(id));
    onPass?.(id);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-x-0 top-14 bottom-0 z-30 flex items-center justify-center bg-black">
        <div className="text-white/60 text-sm animate-pulse">Loading properties…</div>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="fixed inset-x-0 top-14 bottom-0 z-30 flex flex-col items-center justify-center bg-black text-center px-6">
        <p className="text-white text-lg font-semibold">You're all caught up</p>
        <p className="text-white/60 text-sm mt-2">No more properties match your filters right now. Check back soon or widen your search.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 top-14 bottom-0 z-30 bg-black">
      {/* Stage: full-bleed on mobile, centred 9:16 column on desktop */}
      <div className="mx-auto h-full w-full md:max-w-[440px] relative md:py-2">
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide overscroll-contain md:rounded-2xl"
        >
          {visible.map((p, i) => (
            <div key={p.id} className="h-full w-full snap-start">
              <FeedCard
                p={p}
                idx={i}
                muted={muted}
                onToggleMute={() => setMuted(m => !m)}
                saved={savedIds.has(p.id)}
                onSave={() => handleSave(p.id)}
                onPass={() => handlePass(p.id)}
                onEnquire={() => onEnquire?.(p.id)}
                onDetail={() => onPropertyDetail(p.id)}
              />
            </div>
          ))}
        </div>

        {/* Desktop up/down nav (TikTok web style) */}
        <div className="hidden md:flex flex-col gap-3 absolute -right-16 top-1/2 -translate-y-1/2">
          <button
            onClick={() => scrollByCard(-1)}
            aria-label="Previous property"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <ChevronUp size={20} />
          </button>
          <button
            onClick={() => scrollByCard(1)}
            aria-label="Next property"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <ChevronDown size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
