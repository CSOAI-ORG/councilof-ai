import sys

with open('src/app/page.tsx', 'r') as f:
    current = f.read()

# The user wants the old hero with sliders.
# We will just write a whole new src/app/page.tsx combining everything beautifully.

new_page = """'use client';

import { useState } from "react";
import { ArrowRight, Shield, Cpu, ExternalLink, Activity, Database, Server, Layers, CheckCircle2, Lock, Coins, Search, Zap, Code, Terminal, FileCheck, Play, Scale, AlertCircle, Award, Sparkles, Sliders } from "lucide-react";
import Link from 'next/link';
import CouncilOSPage from "./os/page";

export default function Home() {
  const [modelWeight, setModelWeight] = useState(75);
  const [riskTolerance, setRiskTolerance] = useState(15);
  
  const rwaInstruments = [
    { name: "BlackRock BUIDL", issuer: "r94GwaHvyvT3T1M4S7Jz...", allowlist: true, freeze: true },
    { name: "Ondo USY", issuer: "r3x5G6Xw9Fv9S7M4S7Jz...", allowlist: true, freeze: true },
    { name: "Superstate USTB", issuer: "rL7Jz9Fv9S7M4x5G6Xw...", allowlist: false, freeze: false },
    { name: "Braza Bank USDB", issuer: "rB3y9EPnq1ZrZP3aXgfy...", allowlist: false, freeze: true },
    { name: "WisdomTree Core USD", issuer: "rWt3Cx7yE2eQvL56P8aV...", allowlist: true, freeze: true },
    { name: "Franklin Templeton FOBXX", issuer: "rFtnX8bL2wM4aP9cZ5Yv...", allowlist: true, freeze: true },
    { name: "+ 9 more instruments catalogued...", issuer: "", allowlist: null, freeze: null }
  ];

  return (
    <div className="relative bg-background text-foreground pb-24 overflow-hidden">
      
      {/* ========================================================================= */}
      {/* SECTION 1: HERO WITH VIDEO & SLIDERS (SURFACE-INK DARK MODE) */}
      {/* ========================================================================= */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden min-h-[90vh] flex flex-col justify-center border-b border-border bg-[#04120c] text-[#ecf7f1]">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-screen"
        >
          <source src="/videos/architecture.mp4" type="video/mp4" />
        </video>
        
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#04120c] via-[#04120c]/60 to-transparent" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-brand-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 w-full">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-sm font-semibold animate-in fade-in slide-in-from-bottom-4 shadow-xl">
                <Zap className="w-4 h-4" /> Live: All 22 GSPC Axes Fully Measured
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight animate-in fade-in slide-in-from-bottom-6 leading-[1.1]">
                Regulatory Compliance as <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-400">Cryptographic Proof.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-[#a3c0b0] animate-in fade-in slide-in-from-bottom-8">
                Stop guessing if your AI is compliant. CouncilOf.AI connects to your models, runs a massive multi-agent sweep, and generates a verifiable, offline Ed25519 signature proving your EU AI Act status.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10">
                <Link href="/assess" className="px-8 py-4 rounded-xl gradient-brand text-white font-bold text-lg hover:shadow-lg hover:shadow-brand-500/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  Get your first signed measurement <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/simulator" className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:border-brand-500/50 hover:bg-white/10 text-white font-bold text-lg transition-all flex items-center justify-center gap-2">
                  Play the Risk Simulator <Shield className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Interactive Sliders Card */}
            <div className="lg:col-span-5 rounded-2xl bg-white/5 backdrop-blur-md border border-brand-500/20 p-6 shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-8">
              <div className="flex items-center justify-between border-b border-brand-500/20 pb-4">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-brand-400" /> Risk & Safety Threshold Tuner
                </h3>
                <span className="text-xs px-2 py-1 rounded bg-brand-500/20 text-brand-300 font-mono">
                  EU AI Act Annex III
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-[#a3c0b0]">Autonomous Capability Threshold</span>
                    <span className="text-brand-400 font-mono">{modelWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={modelWeight}
                    onChange={(e) => setModelWeight(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-[#a3c0b0]">Allowed Tail-Risk Harm (CVaR)</span>
                    <span className="text-rose-400 font-mono">{riskTolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={riskTolerance}
                    onChange={(e) => setRiskTolerance(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>
              </div>

              <div className="p-5 rounded-xl bg-black/40 border border-brand-500/20 space-y-3 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-[#a3c0b0]">Recommended Audit Tier:</span>
                  <span className="text-white font-bold">{modelWeight > 60 ? "HIGH RISK (Tier 3)" : "LIMITED RISK (Tier 2)"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a3c0b0]">Byzantine Quorum Required:</span>
                  <span className="text-brand-400 font-bold">{modelWeight > 60 ? "23 of 33 Agents" : "17 of 33 Agents"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a3c0b0]">Mandated Watermarking:</span>
                  <span className="text-cyan-400 font-bold">C2PA v2.1 + Ed25519 Sigil</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: COUNCIL OS IN-FRAME */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-b border-border/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black leading-tight mb-4 text-foreground">Independent Measurement Body</h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            The workspace that opens the board, verifier, assessment, and evidence pack in one window — loginless and free.
          </p>
        </div>
        
        <div className="rounded-3xl overflow-hidden border border-border shadow-2xl bg-card h-[800px] relative group">
          <div className="absolute top-0 left-0 w-full h-12 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2 z-10">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            <div className="ml-4 px-3 py-1 rounded bg-slate-800/50 text-xs font-mono text-slate-400 flex-1 flex justify-center">councilof.ai/os</div>
          </div>
          <iframe 
            src="/os" 
            className="w-full h-full pt-12 border-none bg-slate-950"
            title="Council OS Interactive Frame"
          />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: HOW IT WORKS (THE NARRATIVE) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-foreground">How it works in 3 steps</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">We transformed the subjective legal labyrinth into an automated software pipeline.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card border border-border rounded-3xl p-8 hover:-translate-y-2 hover:shadow-xl hover:border-brand-500/30 transition-all duration-500">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-6 border border-blue-500/20">
              <Terminal className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">1. Connect Your AI</h3>
            <p className="text-muted-foreground leading-relaxed">
              Input your HuggingFace model ID, OpenAI-compatible endpoint, or use our Python SDK. We connect seamlessly without requiring source code access.
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-3xl p-8 hover:-translate-y-2 hover:shadow-xl hover:border-brand-500/30 transition-all duration-500">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 mb-6 border border-purple-500/20">
              <Cpu className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">2. The 33-Agent Quorum</h3>
            <p className="text-muted-foreground leading-relaxed">
              We bombard your model with 15,580 synthetic queries across 22 axes (Bias, Cyber, Copyright). A Byzantine Fault-Tolerant jury of 33 independent AIs vote on the results.
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-3xl p-8 hover:-translate-y-2 hover:shadow-xl hover:border-brand-500/30 transition-all duration-500">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-600 mb-6 border border-brand-500/20">
              <FileCheck className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">3. Cryptographic Output</h3>
            <p className="text-muted-foreground leading-relaxed">
              Once consensus is reached, Council OS generates a verifiable Ed25519 signature. You receive an offline, tamper-proof scorecard proving compliance.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: REAL-WORLD ASSET (RWA) LEDGER INTEGRATION */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-border/30">
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-semibold">
              <Coins className="w-4 h-4" /> Blockchain Truth
            </div>
            <h2 className="text-3xl md:text-5xl font-black leading-tight text-foreground">We verify facts on the ledger.</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              For finance and RWA (Real World Asset) models, subjective grades aren't enough. We deterministically read XRPL mainnet account roots to prove if a token has <code>RequireAuth</code> or <code>NoFreeze</code> flags enabled.
            </p>
            <div className="pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-500" />
                <span className="text-foreground font-medium">16 Instruments fully catalogued</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-500" />
                <span className="text-foreground font-medium">Zero human subjectivity</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-500" />
                <span className="text-foreground font-medium">Cryptographic signatures on all reads</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-2 sm:p-6 shadow-xl overflow-hidden hover:border-amber-500/30 transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground">
                    <th className="py-3 px-4 font-semibold tracking-wider">INSTRUMENT</th>
                    <th className="py-3 px-4 font-semibold tracking-wider">ISSUER</th>
                    <th className="py-3 px-4 font-semibold tracking-wider">ALLOWLIST</th>
                    <th className="py-3 px-4 font-semibold tracking-wider">FREEZE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {rwaInstruments.map((inst, i) => (
                    <tr key={i} className="hover:bg-accent/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground">{inst.name}</td>
                      <td className="py-3.5 px-4 text-indigo-600">{inst.issuer}</td>
                      <td className="py-3.5 px-4">
                        {inst.allowlist !== null && (
                          <span className={`px-2 py-0.5 rounded text-[10px] ${inst.allowlist ? "bg-brand-500/20 text-brand-700" : "bg-slate-200 text-slate-600"}`}>
                            {inst.allowlist ? "ENFORCED" : "OPEN"}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {inst.freeze !== null && (
                          <span className={`px-2 py-0.5 rounded text-[10px] ${inst.freeze ? "bg-amber-500/20 text-amber-700" : "bg-slate-200 text-slate-600"}`}>
                            {inst.freeze ? "RETAINED" : "NO FREEZE"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: BUILT FOR AUDIT (OUTCOMES) */}
      {/* ========================================================================= */}
      <section className="py-24 bg-accent/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-foreground">Built for the people who get audited.</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We show what is verifiable, not badges we do not hold.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <a href="/os" className="block p-6 rounded-2xl bg-card border border-border hover:border-brand-500/50 hover:bg-brand-500/5 transition-all group shadow-sm">
              <Lock className="w-6 h-6 text-brand-500 mb-4" />
              <h3 className="font-bold mb-2 group-hover:text-brand-600 transition-colors text-foreground">Ed25519 · Layer 0</h3>
              <p className="text-sm text-muted-foreground">Every decision cryptographically signed.</p>
            </a>
            
            <a href="/leaderboard" className="block p-6 rounded-2xl bg-card border border-border hover:border-brand-500/50 hover:bg-brand-500/5 transition-all group shadow-sm">
              <Scale className="w-6 h-6 text-brand-500 mb-4" />
              <h3 className="font-bold mb-2 group-hover:text-brand-600 transition-colors text-foreground">Multi-provider measurement</h3>
              <p className="text-sm text-muted-foreground">No single vendor grades itself. Fleet size is live on GET /api/gspc.</p>
            </a>
            
            <a href="/assess" className="block p-6 rounded-2xl bg-card border border-border hover:border-brand-500/50 hover:bg-brand-500/5 transition-all group shadow-sm">
              <Shield className="w-6 h-6 text-brand-500 mb-4" />
              <h3 className="font-bold mb-2 group-hover:text-brand-600 transition-colors text-foreground">Aligned to published frameworks</h3>
              <p className="text-sm text-muted-foreground">EU AI Act · NIST · ISO 42001 · DORA · NIS2</p>
            </a>
            
            <a href="https://github.com/CSOAI-ORG" className="block p-6 rounded-2xl bg-card border border-border hover:border-brand-500/50 hover:bg-brand-500/5 transition-all group shadow-sm">
              <Code className="w-6 h-6 text-brand-500 mb-4" />
              <h3 className="font-bold mb-2 group-hover:text-brand-600 transition-colors text-foreground">Open source · MIT</h3>
              <p className="text-sm text-muted-foreground">Open measurement tooling, inspectable.</p>
            </a>
            
            <a href="/legal" className="block p-6 rounded-2xl bg-card border border-border hover:border-brand-500/50 hover:bg-brand-500/5 transition-all group shadow-sm">
              <AlertCircle className="w-6 h-6 text-brand-500 mb-4" />
              <h3 className="font-bold mb-2 group-hover:text-brand-600 transition-colors text-foreground">Coordinated disclosure</h3>
              <p className="text-sm text-muted-foreground">Published security.txt + CVD policy.</p>
            </a>
            
            <a href="/about" className="block p-6 rounded-2xl bg-card border border-border hover:border-brand-500/50 hover:bg-brand-500/5 transition-all group shadow-sm">
              <Award className="w-6 h-6 text-brand-500 mb-4" />
              <h3 className="font-bold mb-2 group-hover:text-brand-600 transition-colors text-foreground">CSOAI Ltd · UK</h3>
              <p className="text-sm text-muted-foreground">Companies House 16939677</p>
            </a>
          </div>

          <div className="flex justify-center">
            <Link href="/assess" className="px-8 py-4 rounded-xl gradient-brand text-white font-bold text-lg shadow-xl shadow-brand-500/25 hover:-translate-y-1 transition-all flex items-center gap-2">
              Get your first signed measurement — free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
      
    </div>
  );
}
"""

with open('src/app/page.tsx', 'w') as f:
    f.write(new_page)
