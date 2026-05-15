import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Check, Building2, User, MapPin, Star, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4;

interface FormData {
  // Step 1: Agency
  agencyName: string;
  branchPostcode: string;
  websiteUrl: string;
  // Step 2: Personal
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  // Step 3: Coverage
  coverageArea: string;
  // Step 4: Tier
  tier: "standard" | "premium";
}

const INITIAL: FormData = {
  agencyName: "", branchPostcode: "", websiteUrl: "",
  fullName: "", jobTitle: "", email: "", phone: "",
  coverageArea: "",
  tier: "standard",
};

const STEPS = [
  { num: 1, label: "Agency details", icon: Building2 },
  { num: 2, label: "Your details", icon: User },
  { num: 3, label: "Coverage area", icon: MapPin },
  { num: 4, label: "Plan", icon: Star },
];

export default function AgentRegistration() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);

  const createRegistration = trpc.agentRegistrations.create.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => toast.error(err.message || "Something went wrong. Please try again."),
  });

  const update = (key: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const canProceed = () => {
    if (step === 1) return form.agencyName.trim() && form.branchPostcode.trim();
    if (step === 2) return form.fullName.trim() && form.email.trim() && form.phone.trim();
    if (step === 3) return form.coverageArea.trim();
    return true;
  };

  const handleSubmit = () => {
    createRegistration.mutate(form);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto border-2 border-accent/40 glow-copper-sm">
            <Check className="w-8 h-8 text-accent" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white">You're registered!</h1>
            <p className="text-foreground/65 leading-relaxed">
              Thanks, <span className="text-white font-semibold">{form.fullName}</span>. We'll review your registration and be in touch within <span className="text-accent font-semibold">2 working days</span> to complete your setup.
            </p>
          </div>
          <div className="card-cinematic border border-accent/20 rounded-xl p-5 text-left space-y-3">
            <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">What happens next</p>
            {[
              "We verify your agency details",
              "We confirm your coverage area and set up your profile",
              "You start receiving matched leads",
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-foreground/65">
                <div className="w-5 h-5 bg-accent/15 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-accent text-xs font-bold">{i + 1}</div>
                {s}
              </div>
            ))}
          </div>
          <Link href="/">
            <Button className="btn-copper px-6">Back to Valory</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          {step > 1 ? (
            <button onClick={() => setStep(s => (s - 1) as Step)} className="flex items-center gap-1.5 text-slate-400 hover:text-accent transition-colors">
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Back</span>
            </button>
          ) : (
            <Link href="/agents">
              <button className="flex items-center gap-1.5 text-slate-400 hover:text-accent transition-colors">
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">For agents</span>
              </button>
            </Link>
          )}
          <span className="text-sm font-semibold text-accent tracking-wide">VALORY</span>
          <div className="w-16 text-right text-xs text-foreground/40">Step {step} of 4</div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-10">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map(({ num, label, icon: Icon }) => (
              <div key={num} className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                  num < step ? "bg-accent border-accent" :
                  num === step ? "bg-accent/20 border-accent" :
                  "bg-slate-800 border-slate-700"
                }`}>
                  {num < step ? (
                    <Check className="w-4 h-4 text-background" />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${num === step ? "text-accent" : "text-foreground/30"}`} />
                  )}
                </div>
                <span className={`text-xs hidden sm:block ${num === step ? "text-accent font-semibold" : "text-foreground/30"}`}>{label}</span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Agency details */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-white text-center">Tell us about your agency</h1>
              <p className="text-foreground/50 text-sm text-center">We'll use this to set up your Valory profile.</p>
            </div>
            <div className="card-cinematic border border-accent/15 rounded-2xl p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-foreground/80 text-sm">Agency name <span className="text-accent">*</span></Label>
                <Input
                  placeholder="e.g. Foxtons, Springfield Properties"
                  value={form.agencyName}
                  onChange={e => update("agencyName", e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-foreground/30 focus:border-accent"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/80 text-sm">Branch postcode <span className="text-accent">*</span></Label>
                <Input
                  placeholder="e.g. BS1 4QA"
                  value={form.branchPostcode}
                  onChange={e => update("branchPostcode", e.target.value.toUpperCase())}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-foreground/30 focus:border-accent uppercase tracking-wider"
                  maxLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/80 text-sm">Website <span className="text-foreground/35">(optional)</span></Label>
                <Input
                  placeholder="https://youragency.co.uk"
                  value={form.websiteUrl}
                  onChange={e => update("websiteUrl", e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-foreground/30 focus:border-accent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Personal details */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto">
                <User className="w-6 h-6 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-white text-center">Your details</h1>
              <p className="text-foreground/50 text-sm text-center">We'll use this to reach you about leads.</p>
            </div>
            <div className="card-cinematic border border-accent/15 rounded-2xl p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label className="text-foreground/80 text-sm">Full name <span className="text-accent">*</span></Label>
                  <Input
                    placeholder="Sarah Johnson"
                    value={form.fullName}
                    onChange={e => update("fullName", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-foreground/30 focus:border-accent"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-foreground/80 text-sm">Job title <span className="text-foreground/35">(optional)</span></Label>
                  <Input
                    placeholder="Sales Director, Valuer..."
                    value={form.jobTitle}
                    onChange={e => update("jobTitle", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-foreground/30 focus:border-accent"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-foreground/80 text-sm">Email address <span className="text-accent">*</span></Label>
                  <Input
                    type="email"
                    placeholder="sarah@youragency.co.uk"
                    value={form.email}
                    onChange={e => update("email", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-foreground/30 focus:border-accent"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-foreground/80 text-sm">Phone number <span className="text-accent">*</span></Label>
                  <Input
                    type="tel"
                    placeholder="07700 900000"
                    value={form.phone}
                    onChange={e => update("phone", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-foreground/30 focus:border-accent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Coverage area */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-white text-center">Where do you operate?</h1>
              <p className="text-foreground/50 text-sm text-center">We'll only send you leads from your coverage area.</p>
            </div>
            <div className="card-cinematic border border-accent/15 rounded-2xl p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-foreground/80 text-sm">Coverage postcodes or areas <span className="text-accent">*</span></Label>
                <textarea
                  placeholder="e.g. BS1, BS2, Bristol City Centre, Clifton, Redland..."
                  value={form.coverageArea}
                  onChange={e => update("coverageArea", e.target.value)}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 text-white placeholder:text-foreground/30 focus:border-accent rounded-lg px-3 py-2.5 text-sm resize-none outline-none focus:ring-1 focus:ring-accent/50 transition-colors"
                />
                <p className="text-xs text-foreground/35">List as many postcodes, towns, or areas as you like.</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Tier selection */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto">
                <Star className="w-6 h-6 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-white text-center">Which plan suits you?</h1>
              <p className="text-foreground/50 text-sm text-center">You can upgrade at any time.</p>
            </div>
            <div className="space-y-4">
              {/* Standard */}
              <button
                onClick={() => update("tier", "standard")}
                className={`w-full text-left card-cinematic border rounded-2xl p-6 transition-all duration-200 ${
                  form.tier === "standard" ? "border-accent/50 bg-accent/5 glow-copper-sm" : "border-slate-700 hover:border-slate-500"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">Standard</span>
                      <span className="px-2 py-0.5 bg-foreground/10 text-foreground/50 text-xs rounded">Free</span>
                    </div>
                    <p className="text-sm text-foreground/50">Notified when a seller's full profile is complete.</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    form.tier === "standard" ? "border-accent" : "border-slate-600"
                  }`}>
                    {form.tier === "standard" && <div className="w-2.5 h-2.5 bg-accent rounded-full" />}
                  </div>
                </div>
              </button>

              {/* Premium */}
              <button
                onClick={() => update("tier", "premium")}
                className={`w-full text-left card-cinematic border rounded-2xl p-6 transition-all duration-200 relative ${
                  form.tier === "premium" ? "border-accent/60 bg-accent/8 glow-copper" : "border-accent/25 hover:border-accent/40"
                }`}
              >
                <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-accent text-background text-xs font-bold rounded-full">RECOMMENDED</div>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">Premium</span>
                      <span className="px-2 py-0.5 bg-accent/15 text-accent text-xs rounded border border-accent/25">Early access</span>
                    </div>
                    <p className="text-sm text-foreground/55">Get anonymised signals before a profile is complete. Pricing on request.</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    form.tier === "premium" ? "border-accent" : "border-slate-600"
                  }`}>
                    {form.tier === "premium" && <div className="w-2.5 h-2.5 bg-accent rounded-full" />}
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          <Button
            onClick={() => {
              if (step < 4) setStep(s => (s + 1) as Step);
              else handleSubmit();
            }}
            disabled={!canProceed() || createRegistration.isPending}
            className="btn-copper flex-1 h-12"
          >
            {createRegistration.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</>
            ) : step < 4 ? (
              <>Continue <ArrowRight className="ml-2 w-4 h-4" /></>
            ) : (
              <>Register your agency <ArrowRight className="ml-2 w-4 h-4" /></>
            )}
          </Button>
        </div>

        <p className="text-xs text-foreground/30 text-center mt-4">
          By registering you agree to Valory's{" "}
          <Link href="/terms" className="text-foreground/50 hover:text-accent underline">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-foreground/50 hover:text-accent underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
