import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  Loader2, MapPin, Bed, Bath, ArrowRight, Home as HomeIcon,
  TrendingUp, Shield, Star, Zap, Check, Clock, Gavel, Tag,
  AlertCircle, Users, ChevronRight, BarChart3, Bell
} from "lucide-react";
import MomentumBadge from "@/components/MomentumBadge";
import { getPropertyThumbnailUrl } from "@/lib/propertyImages";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: properties, isLoading } = trpc.properties.list.useQuery({ limit: 4, offset: 0 });

  const formatPrice = (price: string | number) => {
    const num = typeof price === "string" ? parseInt(price) : price;
    if (num >= 1000000) return `£${(num / 1000000).toFixed(1)}m`;
    if (num >= 1000) return `£${Math.round(num / 1000)}k`;
    return `£${num.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ===== NAV ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-accent/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center glow-copper-sm">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-lg font-bold text-white tracking-wider">VALORY</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/sell" className="text-foreground/70 hover:text-accent transition-colors">Sell</Link>
            <Link href="/discover" className="text-foreground/70 hover:text-accent transition-colors">Buy</Link>
            <Link href="/agents" className="text-foreground/70 hover:text-accent transition-colors">For Agents</Link>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/saved">
                  <Button variant="outline" size="sm" className="border-accent/30 text-accent bg-accent/5 hover:bg-accent/10">
                    Saved
                  </Button>
                </Link>
                <span className="text-sm text-foreground/60 hidden sm:inline">Hi, {user?.name || "there"}</span>
              </>
            ) : (
              <Link href="/agents">
                <Button variant="outline" size="sm" className="border-accent/30 text-accent bg-accent/5 hover:bg-accent/10">
                  Agent login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(173,120,80,0.15),_transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(173,120,80,0.08),_transparent_70%)]" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto space-y-8 animate-slideUp">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-accent text-xs font-semibold tracking-wide mb-2">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
              Now in Beta
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight tracking-tight">
              The smarter way to
              <span className="block bg-gradient-to-r from-accent via-rose-400 to-amber-500 bg-clip-text text-transparent">
                sell or find a home
              </span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/75 max-w-2xl mx-auto leading-relaxed font-medium">
              Transparent valuations. Fair agent matching. Privacy-first design. Valory puts you in control of your property journey.
            </p>
          </div>

          {/* ===== THREE-WAY SPLIT ENTRY ===== */}
          <div className="mt-16 md:mt-20 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* I'm Selling */}
              <Link href="/sell">
                <div className="group relative bg-card/50 backdrop-blur-xl border border-accent/20 rounded-2xl p-8 hover:border-accent/50 hover:bg-card/80 transition-all duration-500 ease-out cursor-pointer glow-copper-sm hover:glow-copper h-full">
                  <div className="space-y-5">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center shadow-lg glow-copper-sm">
                      <TrendingUp className="w-6 h-6 text-background" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">I'm selling</h2>
                      <p className="text-foreground/65 text-sm leading-relaxed">
                        Get a free, transparent valuation and connect with quality agents when you're ready.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-accent font-semibold text-sm group-hover:gap-3 transition-all">
                      <span>Get your valuation</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* I'm Buying */}
              <Link href="/discover">
                <div className="group relative bg-card/50 backdrop-blur-xl border border-accent/20 rounded-2xl p-8 hover:border-accent/50 hover:bg-card/80 transition-all duration-500 ease-out cursor-pointer glow-copper-sm hover:glow-copper h-full">
                  <div className="space-y-5">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg glow-copper-sm">
                      <HomeIcon className="w-6 h-6 text-background" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">I'm buying</h2>
                      <p className="text-foreground/65 text-sm leading-relaxed">
                        Discover properties with momentum tracking, honest signals, and no pressure tactics.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-accent font-semibold text-sm group-hover:gap-3 transition-all">
                      <span>Explore properties</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* I'm an Agent */}
              <Link href="/agents">
                <div className="group relative bg-card/50 backdrop-blur-xl border border-accent/30 rounded-2xl p-8 hover:border-accent/60 hover:bg-card/80 transition-all duration-500 ease-out cursor-pointer hover:glow-copper h-full">
                  {/* Badge */}
                  <div className="absolute top-4 right-4 px-2 py-0.5 bg-accent/20 border border-accent/30 rounded-full text-accent text-xs font-bold tracking-wide">
                    AGENTS
                  </div>
                  <div className="space-y-5">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-accent rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-background" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">I'm an agent</h2>
                      <p className="text-foreground/65 text-sm leading-relaxed">
                        Get matched with serious, pre-qualified sellers in your area. Register free.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-accent font-semibold text-sm group-hover:gap-3 transition-all">
                      <span>Register your agency</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>

            </div>
          </div>

          {/* Trust Signals */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 md:gap-12 text-sm text-foreground/65 font-medium">
            <div className="flex items-center gap-2 hover:text-accent transition-colors">
              <Shield className="w-4 h-4 text-accent" />
              <span>Privacy-first</span>
            </div>
            <div className="flex items-center gap-2 hover:text-accent transition-colors">
              <Star className="w-4 h-4 text-accent" />
              <span>Quality-ranked agents</span>
            </div>
            <div className="flex items-center gap-2 hover:text-accent transition-colors">
              <Zap className="w-4 h-4 text-accent" />
              <span>Live momentum tracking</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== VALUE PROPOSITIONS ===== */}
      <section className="py-20 border-b border-border/50 bg-gradient-to-b from-background to-card/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center border border-accent/20 glow-copper-sm">
                <TrendingUp className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-bold text-xl text-white">Four-Layer Valuations</h3>
              <p className="text-foreground/65 leading-relaxed text-sm">
                Transparent estimates powered by public data, market comparables, agent insights, and platform intelligence. You see exactly what each layer contributes.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center border border-accent/20 glow-copper-sm">
                <Star className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-bold text-xl text-white">Fair Agent Ranking</h3>
              <p className="text-foreground/65 leading-relaxed text-sm">
                Agents compete on quality, not speed. We score accuracy, marketing, engagement, expertise, and responsiveness so the best agents rise to the top.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center border border-accent/20 glow-copper-sm">
                <Shield className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-bold text-xl text-white">You Stay in Control</h3>
              <p className="text-foreground/65 leading-relaxed text-sm">
                Your identity is protected until you choose to connect. No unsolicited contact, no scarcity tactics, no pressure. Just honest property data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BUYER DISCOVERY PREVIEW (compact, teaser only) ===== */}
      <section className="py-20 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">Discover Where Properties Are Actually Selling</h2>
            <p className="text-lg text-foreground/65 max-w-2xl mx-auto">
              See real buyer momentum. Watch properties build interest in real-time.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-accent" size={36} />
            </div>
          ) : properties && properties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {properties.slice(0, 4).map((property: any) => (
                  <Link key={property.id} href={`/property/${property.id}`}>
                    <div className="group relative overflow-hidden rounded-xl border border-accent/20 cursor-pointer card-cinematic hover:border-accent/50 transition-all duration-300 hover:glow-copper-sm">
                      <div className="h-40 overflow-hidden relative">
                        <img
                          src={getPropertyThumbnailUrl(property.id, property.type)}
                          alt={property.address || 'Property photo'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500/90 text-white text-[10px] font-semibold rounded-full">
                          For Sale
                        </span>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="text-xl font-bold text-accent">{formatPrice(property.price)}</div>
                        <div className="flex items-center gap-1 text-foreground/60 text-xs">
                          <MapPin size={12} className="text-accent" />
                          <span className="truncate">{property.city}, {property.postcode}</span>
                        </div>
                        <div className="flex gap-4 text-xs text-foreground/55">
                          {property.bedrooms && <span>{property.bedrooms} bed</span>}
                          {property.bathrooms && <span>{property.bathrooms} bath</span>}
                        </div>
                        {property.timelineEvents?.length > 0 && (
                          <MomentumBadge timelineEvents={property.timelineEvents} size="sm" />
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-10">
                <Link href="/discover">
                  <Button className="btn-copper px-8 py-5 text-base">
                    Explore Full Discovery Feed
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <HomeIcon className="mx-auto text-foreground/20 mb-4" size={48} />
              <p className="text-foreground/50">No properties available yet — check back soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* ===== SELLER JOURNEY ===== */}
      <section className="py-20 border-b border-border/50 bg-gradient-to-b from-card/30 to-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">Launch Your Property Into an Active Market</h2>
            <p className="text-foreground/60 max-w-2xl mx-auto">A structured journey from address to success, in five steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: MapPin, label: "Address Lookup", desc: "Postcode autocomplete. Instant verification. Your details stay private.", step: "Step 1" },
              { icon: HomeIcon, label: "Property Basics", desc: "Type, bedrooms, bathrooms. Simple structured questions. No guessing.", step: "Step 2" },
              { icon: Tag, label: "Valuation Range", desc: "Transparent estimate. See how we calculated it. Confidence level shown.", step: "Step 3" },
              { icon: Check, label: "Accept & Launch", desc: "Lock your valuation. Build your profile. Connect with matched agents.", step: "Step 4–5" },
            ].map(({ icon: Icon, label, desc, step }, i) => (
              <div key={i} className="relative card-cinematic border border-accent/20 rounded-xl p-6 space-y-4 h-full">
                <div className="w-11 h-11 bg-accent/20 rounded-lg flex items-center justify-center border border-accent/30 glow-copper-sm">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1.5">{label}</h3>
                  <p className="text-foreground/55 text-sm">{desc}</p>
                </div>
                <p className="text-xs text-accent font-semibold pt-2 border-t border-accent/10">{step}</p>
                {i < 3 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center border border-accent/30">
                      <ArrowRight className="w-3 h-3 text-accent" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/sell">
              <Button className="btn-copper px-8 py-5 text-base">
                Start Your Launch Journey
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== AGENT TEASER (new section) ===== */}
      <section className="py-20 border-b border-border/50 bg-gradient-to-br from-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-accent text-xs font-semibold">
                <Users className="w-3.5 h-3.5" />
                For Estate Agents
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Leads who have already said yes
              </h2>
              <p className="text-foreground/65 leading-relaxed">
                Every Valory seller has accepted a transparent valuation and actively wants to move. No cold leads. No wasted calls. Just serious vendors ready to be matched with quality agents.
              </p>
              <ul className="space-y-3">
                {[
                  "Pre-qualified sellers with accepted valuations",
                  "Early signals before a listing goes public",
                  "Compete on quality, not who calls first",
                  "Performance insights on your instructions",
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground/75">
                    <div className="w-5 h-5 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                    {point}
                  </li>
                ))}
              </ul>
              <Link href="/agents">
                <Button className="btn-copper px-6 py-4 text-sm mt-2">
                  Learn more & register free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Agent stat cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Bell, value: "Early alerts", label: "Premium agents receive anonymised signals before a property goes public", color: "amber" },
                { icon: Shield, value: "Privacy-first", label: "Seller identity is protected until they choose to connect with you", color: "teal" },
                { icon: BarChart3, value: "Quality metrics", label: "Your ranking is based on accuracy, speed, and seller satisfaction", color: "blue" },
                { icon: Users, value: "Fair matching", label: "You compete on merit, not budget spend. Best agents rise to the top.", color: "copper" },
              ].map(({ icon: Icon, value, label }, i) => (
                <div key={i} className="card-cinematic border border-accent/15 rounded-xl p-5 space-y-3">
                  <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20">
                    <Icon className="w-4.5 h-4.5 text-accent" />
                  </div>
                  <p className="text-sm font-bold text-white">{value}</p>
                  <p className="text-xs text-foreground/50 leading-relaxed">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SELLER CTA ===== */}
      <section className="py-24 bg-gradient-to-r from-accent/20 via-primary/20 to-accent/20 border-y border-accent/20">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-7">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Ready to see your property succeed?
          </h2>
          <p className="text-foreground/65 text-base leading-relaxed max-w-xl mx-auto">
            Get a free, transparent valuation in under two minutes. Then watch your property build momentum in an active marketplace.
          </p>
          <Link href="/sell">
            <Button size="lg" className="btn-copper px-10 h-14 text-lg">
              Get Your Free Valuation
              <ArrowRight className="ml-3 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-foreground/40 text-xs">Your details are private and never shared without your permission.</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 bg-slate-950 border-t border-border/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center border border-accent/30">
                  <span className="text-accent font-bold text-sm">V</span>
                </div>
                <span className="font-bold text-white text-lg">Valory</span>
                <span className="px-2 py-0.5 bg-accent/10 border border-accent/20 rounded text-accent text-xs font-semibold">Beta</span>
              </div>
              <p className="text-sm text-foreground/50 leading-relaxed max-w-xs">
                Property discovery and valuation platform. Transparent, fair, and privacy-first.
              </p>
            </div>
            {/* Platform */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Platform</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><Link href="/sell" className="hover:text-accent transition-colors">Sell your home</Link></li>
                <li><Link href="/discover" className="hover:text-accent transition-colors">Find a property</Link></li>
                <li><Link href="/agents" className="hover:text-accent transition-colors">For agents</Link></li>
              </ul>
            </div>
            {/* Legal */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Legal</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-accent transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-accent transition-colors">Cookie Policy</Link></li>
                <li><Link href="/contact" className="hover:text-accent transition-colors">Contact us</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-foreground/30">© 2025 Valory. All rights reserved.</p>
            <p className="text-xs text-foreground/30">Property discovery and valuation platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
