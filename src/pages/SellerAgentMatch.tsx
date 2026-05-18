import { useState } from 'react';
import { useSearch } from 'wouter';
import {
  ArrowLeft, MapPin, CheckCircle2, ChevronRight,
  Home, Building, Building2, Layers, Star, Clock, TrendingUp,
  Shield, User, Mail, Phone,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import type { MatchedAgent } from '../../mock-data';

const TYPE_LABELS: Record<string, string> = {
  detached:        'Detached',
  'semi-detached': 'Semi-detached',
  terraced:        'Terraced',
  flat:            'Flat / Apartment',
};

const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  detached:        Home,
  'semi-detached': Building,
  terraced:        Building2,
  flat:            Layers,
};

const AVATAR_COLOURS = [
  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'bg-blue-500/20 text-blue-400 border-blue-500/30',
];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function QualityDots({ score }: { score: number }) {
  const filled = Math.round((score / 100) * 5);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={10}
          className={i < filled ? 'text-amber-400 fill-amber-400' : 'text-slate-700 fill-slate-700'}
        />
      ))}
      <span className="text-xs text-slate-500 ml-1">{score}/100</span>
    </div>
  );
}

function AgentCard({
  agent,
  index,
  requested,
  onRequest,
}: {
  agent: MatchedAgent;
  index: number;
  requested: boolean;
  onRequest: () => void;
}) {
  const avatarCls = AVATAR_COLOURS[index % AVATAR_COLOURS.length];

  return (
    <div
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 font-bold text-sm ${avatarCls}`}>
          {initials(agent.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{agent.name}</p>
          <p className="text-xs text-slate-400">{agent.title} · {agent.agency}</p>
          <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
            <MapPin size={9} />
            {agent.coverageLabel}
          </p>
        </div>
        <QualityDots score={agent.qualityScore} />
      </div>

      {/* Stats row */}
      <div className="px-5 pb-4 grid grid-cols-2 gap-3">
        <div className="bg-slate-950/60 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <TrendingUp size={13} className="text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-white">{agent.propertiesSoldLocal}</p>
            <p className="text-[10px] text-slate-500 leading-tight">sales in area</p>
          </div>
        </div>
        <div className="bg-slate-950/60 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <Clock size={13} className="text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-white">{agent.avgSaleTimeDays} days</p>
            <p className="text-[10px] text-slate-500 leading-tight">avg to sell</p>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="px-5 pb-4">
        <p className="text-xs text-slate-500 leading-relaxed">{agent.bio}</p>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {agent.specialisms.map(s => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border border-slate-700 text-slate-500">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        {requested ? (
          <div className="h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold">
            <CheckCircle2 size={15} />
            Introduction requested
          </div>
        ) : (
          <button
            onClick={onRequest}
            className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            Request introduction
            <ChevronRight size={14} className="opacity-70" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function SellerAgentMatch() {
  const search = useSearch();
  const p = new URLSearchParams(search);

  const postcode  = p.get('postcode')  ?? '';
  const type      = p.get('type')      ?? '';
  const beds      = p.get('beds')      ?? '';
  const estimate  = p.get('estimate')  ?? '';
  const low       = p.get('low')       ?? '';
  const high      = p.get('high')      ?? '';

  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agents, setAgents] = useState<MatchedAgent[] | null>(null);
  const [requested, setRequested] = useState<Set<number>>(new Set());

  const submitLead = trpc.seller.submitLead.useMutation({
    onSuccess(data) {
      if (data.success) setAgents(data.agents);
    },
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2)  e.name  = 'Please enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email';
    if (form.phone.replace(/\D/g, '').length < 9) e.phone = 'Please enter a valid phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    submitLead.mutate({
      name:     form.name.trim(),
      email:    form.email.trim(),
      phone:    form.phone.trim(),
      postcode: postcode || 'unknown',
      estimate: estimate ? parseInt(estimate) : undefined,
      type:     type || undefined,
      beds:     beds ? parseInt(beds) : undefined,
    });
  };

  const TypeIcon = TYPE_ICONS[type] ?? Home;

  return (
    <div className="min-h-screen bg-slate-950 pt-16">
      <div className="max-w-lg mx-auto px-4 pt-10 pb-24 space-y-6">

        {/* Back */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back to valuation
        </button>

        {/* Valuation context chip */}
        {estimate && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <TypeIcon size={15} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-0.5">Your valuation</p>
              <p className="text-sm font-bold text-white">
                £{parseInt(estimate).toLocaleString('en-GB')}
                {low && high && (
                  <span className="text-slate-500 font-normal">
                    {' '}· £{parseInt(low).toLocaleString('en-GB')}–£{parseInt(high).toLocaleString('en-GB')}
                  </span>
                )}
              </p>
              {(postcode || type || beds) && (
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                  {postcode && <><MapPin size={9} />{postcode} · </>}
                  {beds && `${beds}-bed `}
                  {TYPE_LABELS[type] || type}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Section header */}
        <div>
          <h1 className="text-xl font-bold text-white">Get matched with local agents</h1>
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
            We'll match you with the highest-rated agents who specialise in your area.
            No spam — they only contact you once you request an introduction.
          </p>
        </div>

        {/* Contact form (hidden once submitted) */}
        {!agents && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Your name
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Full name"
                  autoComplete="name"
                  value={form.name}
                  onChange={set('name')}
                  className="w-full h-12 bg-slate-950 border border-slate-700/60 rounded-xl pl-9 pr-4 text-white placeholder:text-slate-600 text-sm outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
              </div>
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                  className="w-full h-12 bg-slate-950 border border-slate-700/60 rounded-xl pl-9 pr-4 text-white placeholder:text-slate-600 text-sm outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Phone
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                <input
                  type="tel"
                  placeholder="07700 900000"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  className="w-full h-12 bg-slate-950 border border-slate-700/60 rounded-xl pl-9 pr-4 text-white placeholder:text-slate-600 text-sm outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
              </div>
              {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
            </div>

            <div className="flex items-start gap-2 pt-1">
              <Shield size={12} className="text-amber-500/50 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Your details are shared only with agents you specifically request an introduction from.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitLead.isPending}
              className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed active:bg-amber-600 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {submitLead.isPending ? 'Finding agents…' : 'Show me matched agents'}
              {!submitLead.isPending && <ChevronRight size={16} className="opacity-70" />}
            </button>
          </div>
        )}

        {/* Agent cards — revealed after submit */}
        {agents && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Matched agents</p>
                <p className="text-sm text-white font-semibold mt-0.5">
                  {agents.length} agents covering {postcode || 'your area'}
                </p>
              </div>
              <span className="text-xs text-slate-600">Ranked by quality</span>
            </div>

            {agents.map((agent, i) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                index={i}
                requested={requested.has(agent.id)}
                onRequest={() => setRequested(prev => new Set(prev).add(agent.id))}
              />
            ))}

            <div className="text-center pt-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                Agents are ranked by pricing accuracy, marketing quality, and local expertise — not by how much they pay us.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
