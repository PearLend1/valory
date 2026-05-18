import { useSearch, useLocation } from 'wouter';
import {
  ArrowLeft, MapPin, Loader2, Home, Building, Building2, Layers,
  TrendingUp, CheckCircle2, Users, ChevronRight, AlertCircle,
  BarChart3, Info,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

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

const CONDITION_LABELS: Record<string, string> = {
  good:        'Good condition',
  ok:          'Average condition',
  'needs-work': 'Needs work',
};

const CONFIDENCE_CONFIG: Record<string, { label: string; colour: string; bg: string; border: string }> = {
  High:   { label: 'High confidence',   colour: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  Medium: { label: 'Medium confidence', colour: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30'   },
  Low:    { label: 'Low confidence',    colour: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30'  },
};

function fmt(n: number) {
  return '£' + Math.round(n).toLocaleString('en-GB');
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-800/60 last:border-0">
      <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.FC<any>; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Icon size={13} className="text-amber-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function SellerValuationResult() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const p = new URLSearchParams(search);

  const postcode  = p.get('postcode')    ?? '';
  const type      = p.get('type')        ?? '';
  const beds      = p.get('beds')        ?? '';
  const baths     = p.get('baths')       ?? '';
  const tenure    = p.get('tenure')      ?? '';
  const sqft      = p.get('sqft')        ?? '';
  const condition = p.get('condition')   ?? '';
  const parking   = p.get('parking')     ?? '';
  const garden    = p.get('garden')      ?? '';
  const epc       = p.get('epc')         ?? '';
  const timeline  = p.get('timeline')    ?? '';
  const reason    = p.get('reason')      ?? '';
  const expectation = p.get('expectation') ?? '';

  const typeBucket: 'house' | 'flat' | 'other' =
    type === 'flat' ? 'flat' : type ? 'house' : 'other';

  const postcodeOutcode = postcode.trim().split(' ')[0].toUpperCase();

  const valuationQuery = trpc.valuation.estimateWithExplanation.useQuery(
    {
      typeBucket,
      beds:            beds ? parseInt(beds) : undefined,
      areaSqm:         sqft ? parseFloat(sqft) * 0.0929 : undefined,
      postcode:        postcode.length >= 5 ? postcode : undefined,
      postcodeOutcode: postcodeOutcode || undefined,
      area:            postcodeOutcode || undefined,
    },
    { enabled: true, retry: 1, staleTime: 5 * 60 * 1000 }
  );

  const TypeIcon = TYPE_ICONS[type] ?? Home;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (valuationQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 pt-16 flex flex-col items-center justify-center px-4">
        <div className="relative w-20 h-20 mb-8">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Loader2 className="w-9 h-9 text-amber-500 animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Calculating your valuation</h1>
        <p className="text-slate-400 text-sm text-center max-w-xs leading-relaxed">
          Analysing comparable sales, market trends, and your property details…
        </p>
      </div>
    );
  }

  // ── Error / no comps ─────────────────────────────────────────────────────
  const result = valuationQuery.data;
  if (!result || !result.success || result.error) {
    const msg = (result && !result.success && result.error)
      ? result.error
      : 'We couldn\'t generate a valuation. Please check your postcode and try again.';

    return (
      <div className="min-h-screen bg-slate-950 pt-16">
        <div className="max-w-lg mx-auto px-4 pt-10 pb-20">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-sm font-medium mb-8"
          >
            <ArrowLeft size={16} />
            Edit details
          </button>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto">
              <AlertCircle size={24} className="text-orange-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Valuation unavailable</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{msg}</p>
            <button
              onClick={() => window.history.back()}
              className="mt-2 w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors"
            >
              Edit property details
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { valuation, explanation } = result.data!;
  const conf = CONFIDENCE_CONFIG[valuation.confidence] ?? CONFIDENCE_CONFIG.Medium;
  const range = valuation.highBand - valuation.lowBand;
  const rangePct = Math.round((range / valuation.estimate) * 100);

  // ── Success ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 pt-16">
      <div className="max-w-lg mx-auto px-4 pt-10 pb-28 space-y-5">

        {/* Back */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Edit details
        </button>

        {/* Hero estimate card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Top bar */}
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <TypeIcon size={15} className="text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {TYPE_LABELS[type] || 'Your property'}
                </p>
                {postcode && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} />
                    {postcode}
                  </p>
                )}
              </div>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${conf.colour} ${conf.bg} ${conf.border}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {conf.label}
            </div>
          </div>

          {/* Estimate */}
          <div className="px-5 pt-6 pb-5 text-center space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Estimated value</p>
            <p className="text-4xl font-black text-white tracking-tight">{fmt(valuation.estimate)}</p>
            <p className="text-sm text-slate-400 mt-1">
              {fmt(valuation.lowBand)} – {fmt(valuation.highBand)}
            </p>
            <p className="text-xs text-slate-600 mt-1">±{rangePct}% range · {valuation.compsUsed} comparable {valuation.compsUsed === 1 ? 'sale' : 'sales'}</p>
          </div>

          {/* Range bar */}
          <div className="px-5 pb-5">
            <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                style={{ left: '0%', right: '0%' }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-amber-500 shadow"
                style={{ left: `${((valuation.estimate - valuation.lowBand) / (valuation.highBand - valuation.lowBand)) * 100}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-600">{fmt(valuation.lowBand)}</span>
              <span className="text-xs text-slate-600">{fmt(valuation.highBand)}</span>
            </div>
          </div>
        </div>

        {/* Headline */}
        {explanation.headline && (
          <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl px-5 py-4">
            <p className="text-sm text-amber-300 font-medium leading-relaxed">{explanation.headline}</p>
          </div>
        )}

        {/* Seller expectation comparison */}
        {expectation && (
          <div className={`rounded-2xl border px-5 py-4 flex items-start gap-3 ${
            parseInt(expectation) > valuation.highBand
              ? 'bg-orange-500/8 border-orange-500/20'
              : parseInt(expectation) < valuation.lowBand
              ? 'bg-emerald-500/8 border-emerald-500/20'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <Info size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-0.5">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Your expectation</p>
              <p className="text-sm text-white font-semibold">£{parseInt(expectation).toLocaleString()}</p>
              {parseInt(expectation) > valuation.highBand && (
                <p className="text-xs text-orange-400 leading-relaxed mt-1">
                  Your expectation is above our estimated range. A local agent can help you understand the gap.
                </p>
              )}
              {parseInt(expectation) < valuation.lowBand && (
                <p className="text-xs text-emerald-400 leading-relaxed mt-1">
                  Your expectation is below our estimated range — you may be able to achieve more.
                </p>
              )}
              {parseInt(expectation) >= valuation.lowBand && parseInt(expectation) <= valuation.highBand && (
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  Your expectation is within our estimated range.
                </p>
              )}
            </div>
          </div>
        )}

        {/* How we calculated */}
        {explanation.howWeCalculated && (
          <Section icon={BarChart3} title="How we calculated this">
            <p className="text-sm text-slate-400 leading-relaxed">{explanation.howWeCalculated}</p>
          </Section>
        )}

        {/* What could move it */}
        {explanation.whatCouldMoveIt && (
          <Section icon={TrendingUp} title="What could change the value">
            <p className="text-sm text-slate-400 leading-relaxed">{explanation.whatCouldMoveIt}</p>
          </Section>
        )}

        {/* Confidence statement */}
        {explanation.confidenceStatement && (
          <Section icon={Info} title="Confidence level">
            <p className="text-sm text-slate-400 leading-relaxed">{explanation.confidenceStatement}</p>
          </Section>
        )}

        {/* Property summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Property details</p>
          </div>
          <div className="px-5">
            {beds      && <SummaryRow label="Bedrooms"   value={beds} />}
            {baths     && <SummaryRow label="Bathrooms"  value={baths} />}
            {tenure    && <SummaryRow label="Tenure"     value={tenure.replace(/-/g, ' ')} />}
            {sqft      && <SummaryRow label="Floor area" value={`${parseInt(sqft).toLocaleString()} sq ft`} />}
            {condition && <SummaryRow label="Condition"  value={CONDITION_LABELS[condition] ?? condition} />}
            {parking   && <SummaryRow label="Parking"    value={parking.replace(/-/g, ' ')} />}
            {garden    && <SummaryRow label="Garden"     value={garden.replace(/-/g, ' ')} />}
            {epc       && <SummaryRow label="EPC rating" value={epc === 'unknown' ? 'Unknown' : `Band ${epc.toUpperCase()}`} />}
            {timeline  && <SummaryRow label="Timeline"   value={timeline.replace(/-/g, ' ')} />}
            {reason    && <SummaryRow label="Reason"     value={reason.charAt(0).toUpperCase() + reason.slice(1)} />}
          </div>
        </div>

        {/* Important note */}
        {explanation.importantNote && (
          <p className="text-xs text-slate-600 text-center leading-relaxed px-2">{explanation.importantNote}</p>
        )}

      </div>

      {/* Fixed CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800/80 px-4 py-4 space-y-2.5">
        <button
          onClick={() => {
            const q = new URLSearchParams();
            if (postcode)              q.set('postcode',  postcode);
            if (type)                  q.set('type',      type);
            if (beds)                  q.set('beds',      beds);
            q.set('estimate', String(Math.round(valuation.estimate)));
            q.set('low',      String(Math.round(valuation.lowBand)));
            q.set('high',     String(Math.round(valuation.highBand)));
            navigate(`/sell/agents?${q}`);
          }}
          className="w-full h-13 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Users size={16} />
          Get matched with local agents
          <ChevronRight size={15} className="opacity-70" />
        </button>
        <div className="flex items-center justify-center gap-1.5">
          <CheckCircle2 size={12} className="text-slate-600" />
          <p className="text-xs text-slate-600">Free · No obligation · Your details stay private</p>
        </div>
      </div>
    </div>
  );
}
