import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'wouter';
import { ChevronLeft, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function BetaSignup() {
  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Seller' as 'Seller' | 'Buyer' | 'Agent',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createSignup = trpc.betaSignups.create.useMutation({
    onSuccess: () => {
      setStep('confirmation');
      toast.success('Thank you for signing up!');
    },
    onError: (error) => {
      toast.error('Failed to submit signup. Please try again.');
      console.error(error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await createSignup.mutateAsync({
        name: formData.name,
        email: formData.email,
        role: formData.role,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-foreground">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-accent hover:text-accent/80">
              <ChevronLeft size={16} />
              Back
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-white">Beta Signup</h1>
          <div className="w-16" />
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">
        {step === 'form' ? (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">Join the Beta</h2>
              <p className="text-foreground/75 text-base">
                Be among the first to experience Valory. Sign up for early access.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-900/50 border-slate-700 text-foreground placeholder:text-slate-500"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-900/50 border-slate-700 text-foreground placeholder:text-slate-500"
                  required
                />
              </div>

              {/* Role */}
              <div className="space-y-3">
                <Label className="text-foreground font-medium">I am a... *</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Seller', 'Buyer', 'Agent'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({ ...formData, role })}
                      className={`p-3 rounded-lg border-2 transition-all font-medium ${
                        formData.role === role
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-slate-700 bg-slate-900/50 text-foreground/70 hover:border-slate-600'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent hover:bg-accent/90 text-slate-950 font-bold h-12"
              >
                {isSubmitting ? 'Signing up...' : 'Sign Up for Beta'}
              </Button>

              <p className="text-xs text-foreground/50 text-center">
                We'll keep you updated on Valory's progress and send you early access when available.
              </p>
            </form>
          </div>
        ) : (
          <div className="space-y-8 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-accent" />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-white">Thank You!</h2>
              <p className="text-foreground/75 text-lg max-w-md mx-auto">
                We've received your beta signup. Check your email for updates and early access information.
              </p>
            </div>

            <Link href="/">
              <Button className="bg-accent hover:bg-accent/90 text-slate-950 font-bold">
                Back to Home
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
