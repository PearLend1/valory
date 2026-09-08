import { ArrowLeft, ShieldCheck, UserRoundSearch } from 'lucide-react';
import { useLocation } from 'wouter';

export default function SellerAgentComingSoon() {
  const [, navigate] = useLocation();

  return (
    <main className="min-h-screen bg-slate-950 pt-16">
      <div className="max-w-lg mx-auto px-4 pt-10 pb-20">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mb-8 flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to valuation
        </button>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-7 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
            <UserRoundSearch size={25} className="text-amber-400" />
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
            Controlled beta
          </p>
          <h1 className="text-2xl font-bold text-white">
            Agent matching is being prepared
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Valory has not shared your valuation or contact details with an estate agent.
            Introductions will remain disabled until the consent, data-retention and agent-verification processes are ready.
          </p>

          <div className="mt-6 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-left">
            <ShieldCheck size={17} className="mt-0.5 flex-shrink-0 text-emerald-400" />
            <p className="text-xs leading-relaxed text-emerald-200">
              Your property details stay within the valuation flow at this stage. No agent introduction has been requested.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 h-12 w-full rounded-xl bg-amber-500 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400"
          >
            Return to Valory
          </button>
        </section>
      </div>
    </main>
  );
}
