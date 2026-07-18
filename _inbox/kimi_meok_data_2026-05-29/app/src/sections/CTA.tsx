import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTA() {
  return (
    <section className="relative py-24 bg-[#0f1923]">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[800px] h-[400px] rounded-full bg-[#00bca8]/5 blur-[150px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00788820] border border-[#00788840] mb-6">
          <Sparkles className="h-4 w-4 text-[#00bca8]" />
          <span className="text-xs text-[#00bca8] tracking-wide">Launching Q3 2026</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#e2e8f0] mb-6">
          Start Building with{' '}
          <span className="gradient-text">MEOK DATA</span>
        </h2>

        <p className="text-lg text-[#8899aa] mb-8 max-w-2xl mx-auto">
          Join the waitlist for early access to the Pro tier. Free tier available now for all MEOK AI Labs ecosystem users.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/login">
            <Button size="lg" className="bg-[#00bca8] text-[#0f1923] hover:bg-[#00d4be] font-semibold">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline" className="border-[#00788860] text-[#a0b0c0] hover:text-[#00bca8]">
              Explore Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
