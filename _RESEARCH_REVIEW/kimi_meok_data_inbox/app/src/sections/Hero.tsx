import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { ArrowRight, Database, Shield, Activity } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[#0f1923]" />
      <div className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,120,136,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,120,136,0.08) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#00bca8]/5 blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#007888]/5 blur-[100px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00788820] border border-[#00788840] mb-6">
              <div className="w-2 h-2 rounded-full bg-[#00bca8] animate-pulse" />
              <span className="text-xs text-[#00bca8] tracking-wide">255+ MCP Servers Active</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#e2e8f0] leading-tight mb-6">
              The Proprietary{' '}
              <span className="gradient-text">Data Moat</span>{' '}
              for Sovereign AI
            </h1>

            <p className="text-lg text-[#8899aa] leading-relaxed mb-8 max-w-xl">
              MEOK DATA transforms our ecosystem of 255+ MCP servers into structured,
              licensable datasets across healthcare FHIR, financial services, and AI governance compliance.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link to="/login">
                <Button size="lg" className="bg-[#00bca8] text-[#0f1923] hover:bg-[#00d4be] font-semibold">
                  Start Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" variant="outline" className="border-[#00788860] text-[#a0b0c0] hover:text-[#00bca8]">
                  View Pricing
                </Button>
              </a>
            </div>

            <div className="flex gap-8">
              <div>
                <div className="text-2xl font-bold text-[#00bca8]">2.3M+</div>
                <div className="text-xs text-[#718096]">Monthly Queries</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#00bca8]">13</div>
                <div className="text-xs text-[#718096]">Governance Frameworks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#00bca8]">50+</div>
                <div className="text-xs text-[#718096]">FHIR Resource Types</div>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative bg-[#1a2a3a] rounded-lg border border-[#00788830] p-6 glow-accent">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#00788830]">
                <Database className="h-5 w-5 text-[#00bca8]" />
                <span className="text-sm font-semibold text-[#e2e8f0]">MEOK DATA API</span>
                <span className="ml-auto text-xs text-[#718096]">v1.0</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex gap-2">
                  <span className="text-[#007888]">GET</span>
                  <span className="text-[#00bca8]">/v1/governance/eu-ai-act/requirements</span>
                </div>
                <div className="bg-[#0f1923] rounded p-3 text-[#a0b0c0]">
                  <span className="text-[#718096]">// Response: 2,847 structured requirements</span>
                </div>

                <div className="flex gap-2">
                  <span className="text-[#007888]">GET</span>
                  <span className="text-[#00bca8]">/v1/healthcare/fhir/observations</span>
                </div>
                <div className="bg-[#0f1923] rounded p-3 text-[#a0b0c0]">
                  <span className="text-[#718096]">// De-identified clinical data, HIPAA Safe Harbor</span>
                </div>

                <div className="flex gap-2">
                  <span className="text-[#007888]">GET</span>
                  <span className="text-[#00bca8]">/v1/financial/mifid-ii/indicators</span>
                </div>
                <div className="bg-[#0f1923] rounded p-3 text-[#a0b0c0]">
                  <span className="text-[#718096]">// 1,234 regulatory signal mappings</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#00788830] flex items-center gap-4 text-xs text-[#718096]">
                <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-[#00bca8]" /> HMAC-SHA256 Signed</span>
                <span className="flex items-center gap-1"><Activity className="h-3 w-3 text-[#00bca8]" /> Real-time</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
