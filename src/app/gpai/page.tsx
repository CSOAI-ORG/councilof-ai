"use client";

import { Shield, FileCheck, Lock, Activity, Scale, CheckCircle2 } from "lucide-react";
import Link from 'next/link';

export default function GpaiPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-[#04120c] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>EU AI Act Compliance
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 font-heading">
            GPAI Evidence Pack
          </h1>
          <p className="text-lg text-emerald-100/80 mb-8 max-w-2xl mx-auto">
            Build the evidence index for a General-Purpose AI (GPAI) system. Map live model capabilities directly against statutory requirements.
          </p>
          <Link href="/os" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30">
            Open Council OS
          </Link>
        </div>
      </section>
      
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl border border-border bg-card">
            <Scale className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-xl font-bold mb-3">Statutory Mapping</h3>
            <p className="text-muted-foreground mb-4">Every technical test is deterministically mapped to the specific articles of the EU AI Act.</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Article 50 (Transparency)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Article 53 (Copyright)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Systemic Risk Evaluation</li>
            </ul>
          </div>
          
          <div className="p-8 rounded-2xl border border-border bg-card">
            <Lock className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-xl font-bold mb-3">Cryptographic Proof</h3>
            <p className="text-muted-foreground mb-4">Your evidence pack isn't just a PDF. It is an immutable, Ed25519-signed JSON record proving exactly what the AI did on the day of testing.</p>
            <div className="p-4 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
              "signature": "3b4f...e8a2",<br />
              "algorithm": "Ed25519",<br />
              "verified_at": "2026-08-28T00:00:00Z"
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
