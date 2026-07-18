'use client';

import { Sparkles, ArrowRight, Shield, Wrench, Users } from 'lucide-react';
import { vertical } from '@/lib/vertical';

export default function HomePage() {
  return (
    <div className="relative">
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              Part of the CSOAI ecosystem
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6">
              <span className="text-foreground">{vertical.tagline}</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              {vertical.description}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href={vertical.ctaPrimary.href} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl gradient-brand text-white font-semibold text-base hover:opacity-90 transition-opacity shadow-lg shadow-brand-500/25">
                {vertical.ctaPrimary.text}
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href={vertical.ctaSecondary.href} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-card border border-border text-foreground font-semibold text-base hover:bg-accent transition-colors">
                {vertical.ctaSecondary.text}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center">
            Built for <span className="text-brand-400">{vertical.name.split('.')[0]}</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {vertical.features.map((feature) => (
              <div key={feature.title} className="rounded-xl bg-card border border-border p-6 hover:border-brand-500/30 transition-colors">
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
            AI-Powered Construction Equipment Hire & Fleet Management
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            From instant quotes and availability checks to HSE-compliant safety lists and transport estimates — every workflow is governed by the CSOAI framework.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="rounded-xl border border-border p-6">
              <Shield className="w-6 h-6 text-brand-400 mx-auto mb-3" />
              <div className="text-2xl font-bold">CPCS / NPORS</div>
              <p className="text-sm text-muted-foreground">Operator card verification</p>
            </div>
            <div className="rounded-xl border border-border p-6">
              <Wrench className="w-6 h-6 text-brand-400 mx-auto mb-3" />
              <div className="text-2xl font-bold">LOLER / PUWER</div>
              <p className="text-sm text-muted-foreground">Maintenance & inspection tracking</p>
            </div>
            <div className="rounded-xl border border-border p-6">
              <Users className="w-6 h-6 text-brand-400 mx-auto mb-3" />
              <div className="text-2xl font-bold">Hire Ready</div>
              <p className="text-sm text-muted-foreground">Contract compliance on every job</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Part of the <span className="text-brand-400">CSOAI</span> ecosystem
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Every tool is attested, every checkout is compliant, every deployment is hive-aware.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {vertical.ecosystem.map((domain) => (
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
            Ready to put AI to work?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join the sovereign AI economy. Verified, governed, and ready to scale.
          </p>
          <a href={vertical.ctaPrimary.href} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-brand-500/25">
            {vertical.ctaPrimary.text}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
