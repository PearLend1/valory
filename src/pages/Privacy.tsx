import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-950 text-foreground">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-accent hover:text-accent/80">
              <ChevronLeft size={16} />
              Back
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-white">Privacy Policy</h1>
          <div className="w-16" />
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">Privacy Policy</h2>
            <p className="text-slate-400 text-sm">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-foreground/75 text-base leading-relaxed">
              This privacy policy explains how Valory collects, uses, and protects your personal information. 
              Full policy coming soon — contact{' '}
              <a href="mailto:hello@valory.co.uk" className="text-accent hover:text-accent/80 transition-colors">
                hello@valory.co.uk
              </a>{' '}
              with any questions.
            </p>
          </div>

          <div className="border-t border-slate-800 pt-8">
            <Link href="/">
              <Button className="bg-accent hover:bg-accent/90 text-slate-950 font-bold">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
