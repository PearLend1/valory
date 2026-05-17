import { useState } from 'react';
import { useSearch, useLocation } from 'wouter';
import {
  Home, Building, Building2, Layers,
  ArrowRight, ChevronLeft, MapPin, Shield, Check,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────

type Step = 1 | 2 | 3;

interface FormState {
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  tenure: string;
  sqft: string;
  condition: string;
  parking: string;
  garden: string;
  knownIssues: string;
  epcRating: string;
  timeline: string;
  reason: string;
  expectation: string;
}

// ─── Option data ─────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: 'detached',      label: 'Detached',       Icon: Home },
  { value: 'semi-detached', label: 'Semi-detached',  Icon: Building },
  { value: 'terraced',      label: 'Terraced',       Icon: Building2 },
  { value: 'flat',          label: 'Flat / Apartment', Icon: Layers },
];

const TENURE_OPTIONS = [
  { value: 'freehold',          label: 'Freehold',          desc: 'You own the property and the land outright' },
  { value: 'leasehold',         label: 'Leasehold',         desc: 'You own the property for a fixed term' },
  { value: 'share-of-freehold', label: 'Share of freehold', desc: 'Shared ownership of the land with other leaseholders' },
];

const CONDITION_OPTIONS = [
  { value: 'good',       label: 'Good',       desc: 'Well maintained — move-in ready with no immediate work needed' },
  { value: 'ok',         label: 'OK',         desc: 'Average condition — functional but may benefit from some updating' },
  { value: 'needs-work', label: 'Needs work', desc: 'Requires attention — significant renovation or repairs needed' },
];

const PARKING_OPTIONS = [
  { value: 'none',      label: 'None' },
  { value: 'on-street', label: 'On-street' },
  { value: 'driveway',  label: 'Driveway' },
  { value: 'garage',    label: 'Garage' },
];

const GARDEN_OPTIONS = [
  { value: 'none',       label: 'None' },
  { value: 'front',      label: 'Front only' },
  { value: 'rear',       label: 'Rear only' },
  { value: 'front-rear', label: 'Front & rear' },
];

const EPC_RATINGS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'unknown'];

const EPC_COLORS: Record<string, string> = {
  A:       'border-green-500/60  bg-green-500/10  text-green-400',
  B:       'border-green-500/60  bg-green-500/10  text-green-400',
  C:       'border-lime-500/60   bg-lime-500/10   text-lime-400',
  D:       'border-yellow-500/60 bg-yellow-500/10 text-yellow-400',
  E:       'border-orange-500/60 bg-orange-500/10 text-orange-400',
  F:       'border-orange-600/60 bg-orange-500/10 text-orange-500',
  G:       'border-red-500/60    bg-red-500/10    text-red-400',
  unknown: 'border-slate-600/60  bg-slate-700/30  text-slate-400',
};

const TIMELINE_OPTIONS = [
  { value: 'now',   label: 'Ready now',        desc: "I'm ready to sell immediately or very soon" },
  { value: '3m',    label: 'Within 3 months',  desc: 'Targeting a sale in the near term' },
  { value: '3-6m',  label: '3–6 months',       desc: 'Taking my time to prepare and find the right agent' },
  { value: '6-12m', label: '6–12 months',      desc: 'Planning ahead — not in a rush' },
];

const REASON_OPTIONS = [
  { value: 'upsizing',    label: 'Upsizing' },
  { value: 'downsizing',  label: 'Downsizing' },
  { value: 'relocation',  label: 'Relocation' },
  { value: 'separation',  label: 'Separation' },
  { value: 'probate',     label: 'Probate' },
  { value: 'other',       label: 'Other' },
];

const STEP_LABELS: Record<Step, string> = {
  1: 'Property basics',
  2: 'Condition & features',
  3: 'Timeline & goals',
};

// ─── Shared style helpers ─────────────────────────────────────

const tileCls = (selected: boolean) =>
  [
    'relative border rounded-xl text-left transition-all duration-200 cursor-pointer',
    selected
      ? 'border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/20 text-white'
      : 'border-slate-700/60 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-800/80 text-slate-300',
  ].join(' ');

const pillCls = (selected: boolean) =>
  [
    'h-11 rounded-xl border text-sm font-bold transition-all duration-200',
    selected
      ? 'border-amber-500/60 bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
      : 'border-slate-700/60 bg-slate-900/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800/80',
  ].join(' ');

// ─── Component ───────────────────────────────────────────────

export default function SellerValuation() {
  const search = useSearch();
  const postcode = new URLSearchParams(search).get('postcode')?.toUpperCase() ?? '';
  const [, navigate] = useLocation();

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>({
    propertyType: '', bedrooms: '', bathrooms: '', tenure: '', sqft: '',
    condition: '', parking: '', garden: '', knownIssues: '', epcRating: '',
    timeline: '', reason: '', expectation: '',
  });
  const [showErrors, setShowErrors] = useState(false);

  const set = (field: keyof FormState) => (value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const toggle = (field: keyof FormState) => (value: string) =>
    setForm(prev => ({ ...prev, [field]: prev[field] === value ? '' : value }));

  const isStepValid = () => {
    if (step === 1) return !!(form.propertyType && form.bedrooms && form.bathrooms && form.tenure);
    if (step === 2) return !!form.condition;
    if (step === 3) return !!form.timeline;
    return false;
  };

  const handleNext = () => {
    if (!isStepValid()) { setShowErrors(true); return; }
    setShowErrors(false);
    if (step < 3) setStep(s => (s + 1) as Step);
    else handleSubmit();
  };

  const handleBack = () => {
    setShowErrors(false);
    if (step > 1) setStep(s => (s - 1) as Step);
  };

  const handleSubmit = () => {
    const q = new URLSearchParams();
    if (postcode) q.set('postcode', postcode);
    q.set('type', form.propertyType);
    q.set('beds', form.bedrooms);
    q.set('baths', form.bathrooms);
    q.set('tenure', form.tenure);
    if (form.sqft) q.set('sqft', form.sqft);
    q.set('condition', form.condition);
    if (form.parking) q.set('parking', form.parking);
    if (form.garden) q.set('garden', form.garden);
    if (form.knownIssues) q.set('issues', form.knownIssues);
    if (form.epcRating) q.set('epc', form.epcRating);
    q.set('timeline', form.timeline);
    if (form.reason) q.set('reason', form.reason);
    if (form.expectation) q.set('expectation', form.expectation);
    navigate(`/sell/valuation?${q}`);
  };

  return (
    <div className="min-h-screen bg-slate-950">

      {/* ─── Sticky progress bar (sits directly below global Header h-16) ─── */}
      <div className="sticky top-16 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-medium tracking-wide">
              STEP {step} OF 3
            </span>
            <span className="text-xs font-bold text-amber-500 tracking-wide uppercase">
              {STEP_LABELS[step]}
            </span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Scrollable form content ─────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 pt-8 pb-36">

        {/* Postcode chip */}
        {postcode && (
          <div className="flex items-center gap-2 mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold tracking-wider">
              <MapPin size={11} />
              {postcode}
            </span>
            <span className="text-slate-600 text-xs">Property location</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 1 — Property basics
        ══════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">

            {/* Property type */}
            <section className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Property type <span className="text-amber-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PROPERTY_TYPES.map(({ value, label, Icon }) => {
                  const sel = form.propertyType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('propertyType')(value)}
                      className={`${tileCls(sel)} p-4 flex items-center gap-3`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${sel ? 'bg-amber-500/20' : 'bg-slate-800'}`}>
                        <Icon size={17} className={sel ? 'text-amber-400' : 'text-slate-500'} />
                      </div>
                      <span className="font-medium text-sm leading-tight">{label}</span>
                      {sel && <Check size={13} className="text-amber-400 ml-auto flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {showErrors && !form.propertyType && (
                <p className="text-xs text-red-400">Please select a property type</p>
              )}
            </section>

            {/* Bedrooms */}
            <section className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Bedrooms <span className="text-amber-500">*</span>
              </label>
              <div className="flex gap-2">
                {['1', '2', '3', '4', '5', '6+'].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set('bedrooms')(n)}
                    className={`${pillCls(form.bedrooms === n)} flex-1`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {showErrors && !form.bedrooms && (
                <p className="text-xs text-red-400">Please select number of bedrooms</p>
              )}
            </section>

            {/* Bathrooms */}
            <section className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Bathrooms <span className="text-amber-500">*</span>
              </label>
              <div className="flex gap-2">
                {['1', '2', '3', '4+'].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set('bathrooms')(n)}
                    className={`${pillCls(form.bathrooms === n)} flex-1`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {showErrors && !form.bathrooms && (
                <p className="text-xs text-red-400">Please select number of bathrooms</p>
              )}
            </section>

            {/* Tenure */}
            <section className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Tenure <span className="text-amber-500">*</span>
              </label>
              <div className="space-y-2">
                {TENURE_OPTIONS.map(({ value, label, desc }) => {
                  const sel = form.tenure === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('tenure')(value)}
                      className={`${tileCls(sel)} w-full p-4 flex items-center justify-between gap-4`}
                    >
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${sel ? 'text-white' : 'text-slate-200'}`}>{label}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                      {sel && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                          <Check size={11} className="text-slate-950" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {showErrors && !form.tenure && (
                <p className="text-xs text-red-400">Please select a tenure type</p>
              )}
            </section>

            {/* Floor area (optional) */}
            <section className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Floor area{' '}
                <span className="text-slate-600 font-normal normal-case tracking-normal">
                  — optional, in sq ft
                </span>
              </label>
              <input
                type="number"
                placeholder="e.g. 1,200"
                value={form.sqft}
                onChange={e => set('sqft')(e.target.value)}
                className="w-full h-12 bg-slate-900 border border-slate-700/60 rounded-xl px-4 text-white placeholder:text-slate-600 text-sm outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
            </section>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 2 — Condition & features
        ══════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">

            {/* Condition */}
            <section className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Overall condition <span className="text-amber-500">*</span>
              </label>
              <div className="space-y-2">
                {CONDITION_OPTIONS.map(({ value, label, desc }) => {
                  const sel = form.condition === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('condition')(value)}
                      className={`${tileCls(sel)} w-full p-4 flex items-center justify-between gap-4`}
                    >
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${sel ? 'text-white' : 'text-slate-200'}`}>{label}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                      {sel && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                          <Check size={11} className="text-slate-950" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {showErrors && !form.condition && (
                <p className="text-xs text-red-400">Please select a condition</p>
              )}
            </section>

            {/* Parking */}
            <section className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Parking
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PARKING_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggle('parking')(value)}
                    className={`${tileCls(form.parking === value)} p-3.5 text-center text-sm font-medium`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Garden */}
            <section className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Garden
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GARDEN_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggle('garden')(value)}
                    className={`${tileCls(form.garden === value)} p-3.5 text-center text-sm font-medium`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Known issues (optional) */}
            <section className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Known issues or damage{' '}
                <span className="text-slate-600 font-normal normal-case tracking-normal">— optional</span>
              </label>
              <textarea
                placeholder="e.g. Roof needs attention, damp in the basement, boiler is 15+ years old..."
                value={form.knownIssues}
                onChange={e => set('knownIssues')(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 text-sm outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none leading-relaxed"
              />
            </section>

            {/* EPC rating (optional) */}
            <section className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                EPC rating{' '}
                <span className="text-slate-600 font-normal normal-case tracking-normal">— optional</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {EPC_RATINGS.map(r => {
                  const sel = form.epcRating === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggle('epcRating')(r)}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all duration-200 ${
                        sel
                          ? EPC_COLORS[r]
                          : 'border-slate-700/60 bg-slate-900/60 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {r === 'unknown' ? 'Unknown' : `Band ${r}`}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 3 — Timeline & goals
        ══════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">

            {/* Timeline */}
            <section className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Selling timeline <span className="text-amber-500">*</span>
              </label>
              <div className="space-y-2">
                {TIMELINE_OPTIONS.map(({ value, label, desc }) => {
                  const sel = form.timeline === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('timeline')(value)}
                      className={`${tileCls(sel)} w-full p-4 flex items-center justify-between gap-4`}
                    >
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${sel ? 'text-white' : 'text-slate-200'}`}>{label}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                      {sel && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                          <Check size={11} className="text-slate-950" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {showErrors && !form.timeline && (
                <p className="text-xs text-red-400">Please select a timeline</p>
              )}
            </section>

            {/* Reason (optional) */}
            <section className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Reason for selling{' '}
                <span className="text-slate-600 font-normal normal-case tracking-normal">— optional</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {REASON_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggle('reason')(value)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                      form.reason === value
                        ? 'border-amber-500/60 bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
                        : 'border-slate-700/60 bg-slate-900/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Price expectation (optional) */}
            <section className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Your price expectation{' '}
                <span className="text-slate-600 font-normal normal-case tracking-normal">— optional</span>
              </label>
              <p className="text-xs text-slate-500 leading-relaxed">
                If you have a figure in mind, enter it here. We use it to calibrate your valuation — it won't bias the result.
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm pointer-events-none">
                  £
                </span>
                <input
                  type="number"
                  placeholder="e.g. 350000"
                  value={form.expectation}
                  onChange={e => set('expectation')(e.target.value)}
                  className="w-full h-12 bg-slate-900 border border-slate-700/60 rounded-xl pl-8 pr-4 text-white placeholder:text-slate-600 text-sm outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </section>

            {/* Privacy note */}
            <div className="flex items-start gap-2.5 pt-2 pb-2 border-t border-slate-800/50">
              <Shield size={13} className="text-amber-500/50 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">
                Your details are private and never shared with agents without your explicit permission.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Fixed bottom action bar ──────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800/50">
        <div className="max-w-lg mx-auto px-4 py-4 flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center gap-1.5 h-12 px-5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-all text-sm font-medium flex-shrink-0"
            >
              <ChevronLeft size={18} />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-base flex items-center justify-center gap-2 hover:opacity-95 active:opacity-90 transition-opacity shadow-lg shadow-amber-500/20"
          >
            {step === 3 ? 'Get my valuation' : 'Next'}
            <ArrowRight size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}
