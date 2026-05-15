import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Bell, Shield, BarChart3, Users, Check, Star,
  Zap, TrendingUp, Clock, ChevronRight, Home as HomeIcon
} from "lucide-react";

export default function AgentLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ===== NAV ===== */}
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
          <div className="flex items-center gap-4">
            <Link href="/agents/register">
              <Button className="btn-copper text-sm px-5 h-9">
                Register free
                <ArrowRight className="ml-1.5 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(173,120,80,0.15),_transparent_70%)]" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent/8 rounded-full blur-3xl animate-pulse" />

        <div className="relative max-w-5xl mx-auto px-4 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-accent text-xs font-semibold tracking-wide">
            <Users className="w-3.5 h-3.5" />
            For Estate Agents & Agencies
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight">
            The smarter way to
            <span className="block bg-gradient-to-r from-accent via-rose-400 to-amber-500 bg-clip-text text-transparent">
              find serious sellers
            </span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Valory sellers have already accepted a transparent valuation and actively want to move. No cold leads. No wasted time. Just pre-qualified vendors ready to be matched with quality agents.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/agents/register">
              <Button size="lg" className="btn-copper px-8 h-13 text-base">
                Register your agency free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#how-it-works" className="flex items-center gap-2 text-foreground/60 hover:text-accent transition-colors text-sm font-medium">
              How it works
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Quick trust stats */}
          <div className="flex flex-wrap items-center justify-center gap-10 pt-8 text-sm text-foreground/55">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              <span>Pre-qualified leads only</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              <span>No cold calling required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              <span>Free to register</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-4xl md:text-5xl font-bold text-white">How Valory works for agents</h2>
            <p className="text-foreground/55 max-w-xl mx-auto">Every lead you receive has already gone through Valory's structured seller journey.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                step: "01",
                icon: TrendingUp,
                title: "Seller gets a transparent valuation",
                desc: "Sellers complete a 9-step structured questionnaire. Valory generates a four-layer valuation — not just a number, but a breakdown they can trust.",
              },
              {
                step: "02",
                icon: Check,
                title: "Seller locks in and builds their profile",
                desc: "Once they accept the valuation, sellers complete their launch profile: photos, description, preferences. This signals genuine intent.",
              },
              {
                step: "03",
                icon: Bell,
                title: "You're notified and matched",
                desc: "Premium agents get early anonymised signals when a valuation is accepted. All agents receive full details once the profile is complete.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="card-cinematic border border-accent/15 rounded-2xl p-7 space-y-5 relative overflow-hidden">
                <div className="absolute top-5 right-5 text-5xl font-black text-foreground/5 select-none">{step}</div>
                <div className="w-11 h-11 bg-accent/15 rounded-xl flex items-center justify-center border border-accent/25">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">{title}</h3>
                  <p className="text-sm text-foreground/55 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY VALORY vs PORTALS ===== */}
      <section className="py-20 border-b border-border/50 bg-gradient-to-b from-card/20 to-background">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-4xl font-bold text-white">Why Valory vs traditional portals</h2>
            <p className="text-foreground/55 max-w-xl mx-auto">Portals give you listings. Valory gives you motivated sellers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Traditional portals */}
            <div className="card-cinematic border border-border/40 rounded-2xl p-7 space-y-4">
              <h3 className="text-base font-bold text-foreground/50 uppercase tracking-wider text-sm">Traditional portals</h3>
              <ul className="space-y-3">
                {[
                  "Pay to advertise, no guaranteed leads",
                  "Cold leads who might not be ready to sell",
                  "Speed wins — first to call gets the instruction",
                  "No insight into seller intent or readiness",
                  "Compete on marketing spend",
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground/50">
                    <div className="w-4 h-4 rounded-full border border-foreground/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <div className="w-1.5 h-0.5 bg-foreground/30 rounded" />
                    </div>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Valory */}
            <div className="card-cinematic border border-accent/30 rounded-2xl p-7 space-y-4 glow-copper-sm">
              <h3 className="text-base font-bold text-accent tracking-wider text-sm uppercase">Valory</h3>
              <ul className="space-y-3">
                {[
                  "Sellers have already accepted a valuation and want to proceed",
                  "Leads are pre-qualified with confirmed intent",
                  "Compete on quality — accuracy, marketing, responsiveness",
                  "Full transparency on seller expectations and timeline",
                  "Rank by merit, not spend",
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground/75">
                    <div className="w-4 h-4 bg-accent/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 border border-accent/30">
                      <Check className="w-2.5 h-2.5 text-accent" />
                    </div>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TIER COMPARISON ===== */}
      <section className="py-20 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-4xl font-bold text-white">Choose your plan</h2>
            <p className="text-foreground/55 max-w-xl mx-auto">Start free and upgrade when you're ready for early access leads.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Standard */}
            <div className="card-cinematic border border-border/40 rounded-2xl p-8 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">Standard</h3>
                  <span className="px-2 py-0.5 bg-foreground/10 text-foreground/50 text-xs rounded font-medium">Free</span>
                </div>
                <p className="text-sm text-foreground/50">For agents starting with Valory</p>
              </div>
              <ul className="space-y-3">
                {[
                  "Notified when seller profile is complete",
                  "Access to seller's full profile and contact details",
                  "Coverage area preferences",
                  "Agency profile listing",
                  "Valory quality ranking",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground/65">
                    <Check className="w-4 h-4 text-foreground/40 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/agents/register">
                <Button variant="outline" className="w-full border-accent/30 text-accent hover:bg-accent/10">
                  Register free
                </Button>
              </Link>
            </div>

            {/* Premium */}
            <div className="card-cinematic border border-accent/40 rounded-2xl p-8 space-y-6 relative glow-copper-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-background text-xs font-bold rounded-full">
                RECOMMENDED
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">Premium</h3>
                  <span className="px-2 py-0.5 bg-accent/15 text-accent text-xs rounded font-semibold border border-accent/30">Early access</span>
                </div>
                <p className="text-sm text-foreground/50">For agents who want first-mover advantage</p>
              </div>
              <ul className="space-y-3">
                {[
                  "Everything in Standard",
                  "Early anonymised signals when valuation accepted",
                  "Lead before the profile is public-ready",
                  "Priority placement in agent matching",
                  "Performance insights dashboard",
                  "Dedicated account support",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                    <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/agents/register">
                <Button className="btn-copper w-full">
                  Register & enquire about Premium
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <p className="text-xs text-foreground/35 text-center">Contact us for Premium pricing</p>
            </div>

          </div>
        </div>
      </section>

      {/* ===== REGISTER CTA ===== */}
      <section className="py-24 bg-gradient-to-r from-accent/20 via-primary/20 to-accent/20 border-y border-accent/20">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-7">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Ready to find your next instruction?
          </h2>
          <p className="text-foreground/65 max-w-xl mx-auto">
            Register your agency in minutes. We'll confirm your coverage area and have you receiving leads within 2 working days.
          </p>
          <Link href="/agents/register">
            <Button size="lg" className="btn-copper px-10 h-14 text-lg">
              Register your agency
              <ArrowRight className="ml-3 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-foreground/40 text-xs">Free to register. No commitment required.</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-10 bg-slate-950 border-t border-border/20">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-7 h-7 bg-accent/20 rounded-lg flex items-center justify-center border border-accent/30">
                <span className="text-accent font-bold text-xs">V</span>
              </div>
              <span className="font-bold text-white">Valory</span>
            </div>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-foreground/40">
            <Link href="/" className="hover:text-accent transition-colors">Home</Link>
            <Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-accent transition-colors">Contact</Link>
          </div>
          <p className="text-xs text-foreground/30">© 2025 Valory</p>
        </div>
      </footer>
    </div>
  );
}
