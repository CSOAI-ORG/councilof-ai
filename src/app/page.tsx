'use client';

import { Shield, Users, Scale, Zap, ArrowRight, Globe, Brain, Lock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative">
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-8">
              <Shield className="w-3.5 h-3.5" />
              Enterprise AI Governance
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6">
              <span className="text-foreground">The Global Standard for</span>
              <br />
              <span className="bg-gradient-to-r from-brand-400 to-safety-400 bg-clip-text text-transparent">
                AI Safety
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
              Multi-AI consensus governance for enterprises. Deploy AI agents with confidence using Byzantine fault-tolerant verification, regulatory compliance, and an auditable agent catalogue.
            </p>
            <div className="flex items-center justify-center gap-2 mb-10">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-brand-500/10 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 777}`} alt="User" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-semibold text-brand-400">
                <span className="text-foreground">1,578 downloads/mo</span> &middot; Trusted by AI governance teams
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/catalogue" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl gradient-brand text-white font-semibold text-base hover:opacity-90 transition-opacity shadow-lg shadow-brand-500/25">
                <Brain className="w-5 h-5" />
                Agent Catalogue
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="/pricing" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-card border border-border text-foreground font-semibold text-base hover:bg-accent transition-colors">
                <Scale className="w-5 h-5" />
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center">
            Enterprise <span className="text-brand-400">AI Governance</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Multi-AI Consensus', desc: 'Byzantine fault-tolerant voting across multiple AI models ensures decisions are verified and trustworthy.' },
              { icon: Globe, title: 'Agent Catalogue', desc: 'Discover, verify, and deploy pre-audited AI governance agents with cryptographic proof of compliance.' },
              { icon: Lock, title: 'Regulatory Compliance', desc: 'Built-in support for EU AI Act, NIST RMF, ISO 42001, and GDPR with automated audit trails.' },
              { icon: Brain, title: 'Verification Engine', desc: 'Submit AI models for verification. Receive cryptographic proof of safety and compliance.' },
              { icon: Scale, title: 'Audit Trails', desc: 'Immutable compliance records with cryptographic signatures for every decision and deployment.' },
              { icon: Users, title: 'Enterprise SSO', desc: 'SAML, OIDC, and enterprise identity provider integration for seamless team governance.' },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl bg-card border border-border p-6 hover:border-brand-500/30 transition-colors">
                <feature.icon className="w-8 h-8 text-brand-400 mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Part of <span className="text-brand-400">CSOAI</span> Governance Framework
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            councilof.ai is the enterprise gateway to the full CSOAI governance ecosystem, including safetyof.ai, proofof.ai, and 9 compliance domains.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['councilof.ai', 'safetyof.ai', 'proofof.ai', 'csoai.org', 'agisafe.ai'].map((domain) => (
              <span key={domain} className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-mono">
                {domain}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to deploy <span className="text-brand-400">governed AI</span>?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join enterprises building AI on a foundation of trust, verification, and multi-AI consensus.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/pricing" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-brand-500/25">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/verify" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-accent border border-border text-foreground font-semibold hover:bg-accent/80 transition-colors">
              Verify an Agent
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
