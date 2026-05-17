import { useSearch, useLocation } from 'wouter';
import { ArrowLeft, MapPin, Loader2, Home, Building, Building2, Layers } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  detached:          'Detached',
  'semi-detached':   'Semi-detached',
  terraced:          'Terraced',
  flat:              'Flat / Apartment',
};

const TYPE_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  detached:          Home,
  'semi-detached':   Building,
  terraced:          Building2,
  flat:              Layers,
};

const CONDITION_LABELS: Record<string, string> = {
  good:        'Good condition',
  ok:          'Average condition',
  'needs-work': 'Needs work',
};

const TIMELINE_LABELS: Record<string, string> = {
  now:    'Ready now',
  '3m':   'Within 3 months',
  '3-6m': '3–6 months',
  '6-12m':'6–12 months',
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800/60 last:border-0">
      <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  );
}

export default function SellerValuationResult() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const p = new URLSearchParams(search);

  const postcode  = p.get('postcode') ?? '';
  const type      = p.get('type')     ?? '';
  const beds      = p.get('beds')     ?? '';
  const baths     = p.get('baths')    ?? '';
  const tenure    = p.get('tenure')   ?? '';
  const sqft      = p.get('sqft')     ?? '';
  const condition = p.get('condition') ?? '';
  const parking   = p.get('parking')  ?? '';
  const garden    = p.get('garden')   ?? '';
  const epc       = p.get('epc')      ?? '';
  const timeline  = p.get('timeline') ?? '';
  const reason    = p.get('reason')   ?? '';
  const expectation = p.get('expectation') ?? '';

  const TypeIcon = TYPE_ICONS[type] ?? Home;

  return (
    <div className="min-h-screen bg-slate-950 pt-16">
      <div className="max-w-lg mx-auto px-4 pt-10 pb-20">

        {/* Back link */}
        <button
          onClick={() => navigate(-1 as any)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-sm font-medium mb-8"
        >
          <ArrowLeft size={16} />
          Edit details
        </button>

        {/* Calculating animation */}
        <div className="text-center space-y-6 mb-12">
          <div className="relative mx-auto w-20 h-20">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Loader2 className="w-9 h-9 text-amber-500 animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Calculating your valuation</h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
              We're analysing comparable sales, market trends, and your property details.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/20 bg-amber-500/8 text-amber-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Stage 3 — Valuation result coming soon
          </div>
        </div>

        {/* Property summary card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <TypeIcon size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {TYPE_LABELS[type] || type || 'Your property'}
              </p>
              {postcode && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} />
                  {postcode}
                </p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="px-5">
            {beds      && <Detail label="Bedrooms"   value={beds} />}
            {baths     && <Detail label="Bathrooms"  value={baths} />}
            {tenure    && <Detail label="Tenure"     value={tenure.replace(/-/g, ' ')} />}
            {sqft      && <Detail label="Floor area" value={`${parseInt(sqft).toLocaleString()} sq ft`} />}
            {condition && <Detail label="Condition"  value={CONDITION_LABELS[condition] ?? condition} />}
            {parking   && <Detail label="Parking"    value={parking.replace(/-/g, ' ')} />}
            {garden    && <Detail label="Garden"     value={garden.replace(/-/g, ' ')} />}
            {epc       && <Detail label="EPC"        value={epc === 'unknown' ? 'Unknown' : `Band ${epc}`} />}
            {timeline  && <Detail label="Timeline"   value={TIMELINE_LABELS[timeline] ?? timeline} />}
            {reason    && <Detail label="Reason"     value={reason.charAt(0).toUpperCase() + reason.slice(1)} />}
            {expectation && (
              <Detail
                label="Expectation"
                value={`£${parseInt(expectation).toLocaleString()}`}
              />
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-8 leading-relaxed">
          Your details are private and never shared without your permission.
        </p>
      </div>
    </div>
  );
}
