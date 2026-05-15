import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Mail, MessageSquare } from 'lucide-react';

export default function Contact() {
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
          <h1 className="text-lg font-bold text-white">Contact Us</h1>
          <div className="w-16" />
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="space-y-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Get in Touch</h2>
            <p className="text-foreground/75 text-base leading-relaxed">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>

          {/* Contact Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* General Enquiries */}
            <div className="bg-card/50 backdrop-blur-xl border border-accent/20 rounded-2xl p-8 hover:border-accent/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-accent" />
                <h3 className="text-xl font-bold text-white">General Enquiries</h3>
              </div>
              <p className="text-foreground/75 text-sm mb-6">
                For general questions or support, reach out to us directly.
              </p>
              <a href="mailto:hello@valory.co.uk" className="text-accent hover:text-accent/80 font-medium transition-colors">
                hello@valory.co.uk
              </a>
            </div>

            {/* Agent Enquiries */}
            <div className="bg-card/50 backdrop-blur-xl border border-accent/20 rounded-2xl p-8 hover:border-accent/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-accent" />
                <h3 className="text-xl font-bold text-white">Agent Enquiries</h3>
              </div>
              <p className="text-foreground/75 text-sm mb-6">
                Interested in joining Valory as an agent?
              </p>
              <Link href="/agents/register">
                <Button className="bg-accent hover:bg-accent/90 text-slate-950 font-bold w-full">
                  Agent Registration
                </Button>
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8">
            <Link href="/">
              <Button variant="outline" className="border-accent/30 text-accent bg-accent/5 hover:bg-accent/10">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
