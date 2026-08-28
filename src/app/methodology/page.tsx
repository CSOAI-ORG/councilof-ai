"use client";

import { Shield, Scale, Activity, Lock, Search } from "lucide-react";

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-[#04120c] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>Core Doctrine
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 font-heading">
            Measurement, Not Certification.
          </h1>
          <p className="text-lg text-emerald-100/80 mb-8 max-w-2xl mx-auto">
            We do not certify. No conformity mark, no badge, no seal. We do not sell a grade. We measure AI systems against frozen statute and issue signed, independently verifiable evidence.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="flex gap-6">
            <div className="shrink-0 mt-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Search className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">1. Unmeasured is a First-Class State</h3>
              <p className="text-muted-foreground leading-relaxed">
                We do not publish a number we did not measure. If an AI system cannot be evaluated for a specific axis due to API limitations or unsupported modalities, we publish an explicitly empty cell. We do not extrapolate, and we do not guess.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="shrink-0 mt-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Scale className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">2. No LLM-as-a-Judge</h3>
              <p className="text-muted-foreground leading-relaxed">
                We do not let a model judge a model. Every verdict is deterministic code executed against pre-written, human-verified gold labels. Subjective evaluation introduces drift and bias, which contradicts the core premise of statutory measurement.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="shrink-0 mt-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Lock className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">3. Cryptographic Provenance</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every measurement pack we issue is a 3KB JSON document signed using Ed25519. The signature validates against our published public key (`did:web:csoai.org`). You do not need our permission or our API to verify a claim—you only need the public key.
              </p>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
