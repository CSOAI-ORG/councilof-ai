"use client";

import { useState } from "react";
import {
  Shield,
  Scale,
  Zap,
  ArrowRight,
  Globe,
  Brain,
  Lock,
  Cpu,
  CheckCircle2,
  Sliders,
  Play,
  FileText,
  Award,
  Terminal,
  Database,
  ExternalLink,
  Activity,
  Sparkles,
  TrendingUp,
  Layers
} from "lucide-react";
import CouncilOSPage from "./os/page";

export default function HomePage() {
  // Slider states for the Interactive Hero
  const [modelWeight, setModelWeight] = useState(75);
  const [riskTolerance, setRiskTolerance] = useState(15);
  const [activeTab, setActiveTab] = useState<"arena" | "matrix" | "telemetry" | "sims">("arena");

  return (
    <div className="relative bg-background text-foreground space-y-24 pb-20">
      {/* ========================================================================= */}
      {/* SECTION 1: COUNCIL OS IN-FRAME HERO (LIVE COCKPIT ON LAND) */}
      {/* ========================================================================= */}
      <section className="relative border-b border-border bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  Council OS &bull; Live Interactive Cockpit
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                    LIVE EVALUATION SURFACE
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground">Attach models, evaluate GSPC axes, and mint cryptographic Ed25519 cards in real time.</p>
              </div>
            </div>
            <a
              href="/os"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-sm"
            >
              Open Full Screen <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Embedded Council OS Container */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
            <CouncilOSPage />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: INTERACTIVE SLIDER HERO & MODEL RISK SIMULATOR */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Multi-Agent Governance Substrate
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Cryptographic AI Verification & <br />
              <span className="bg-gradient-to-r from-brand-400 via-indigo-400 to-safety-400 bg-clip-text text-transparent">
                Living Governance Benchmarks
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Eliminate opaque compliance checklists. Deploy AI systems with deterministic BFT multi-agent consensus, SHA-256 preimages, and verifiable Ed25519 measurement cards.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="/assess"
                className="px-6 py-3.5 rounded-xl gradient-brand text-white font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-brand-500/20"
              >
                <Zap className="w-4 h-4" /> Run 5-Min Readiness Assessment &rarr;
              </a>
              <a
                href="/verify"
                className="px-6 py-3.5 rounded-xl bg-card border border-border text-foreground font-semibold text-sm hover:bg-accent transition-colors flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-brand-400" /> Verify Any Card
              </a>
            </div>
          </div>

          {/* Interactive Sliders Card */}
          <div className="lg:col-span-5 rounded-2xl bg-card border border-border p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-400" /> Risk & Safety Threshold Tuner
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 font-mono">
                EU AI Act Annex III
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-muted-foreground">Autonomous Capability Threshold</span>
                <span className="text-brand-400 font-mono">{modelWeight}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={modelWeight}
                onChange={(e) => setModelWeight(Number(e.target.value))}
                className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-muted-foreground">Allowed Tail-Risk Harm Tolerance (CVaR)</span>
                <span className="text-rose-400 font-mono">{riskTolerance}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(Number(e.target.value))}
                className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            <div className="p-4 rounded-xl bg-background border border-border space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recommended Audit Tier:</span>
                <span className="text-foreground font-bold">{modelWeight > 60 ? "HIGH RISK (Tier 3)" : "LIMITED RISK (Tier 2)"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Byzantine Quorum Requirement:</span>
                <span className="text-emerald-400 font-bold">{modelWeight > 60 ? "23 of 33 Agents" : "17 of 33 Agents"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mandated Watermarking:</span>
                <span className="text-indigo-400 font-bold">C2PA v2.1 + Ed25519 Sigil</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: WHAT WE ACTUALLY DO — VERIFIABLE OUTCOMES WITH ASSETS */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            Verified Capabilities & Outcomes
          </div>
          <h2 className="text-3xl sm:text-4xl font-black">
            What We Actually Deliver
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Explore our five foundational pillars: the Colosseum arena, the 22-axis living benchmark, real-world on-chain asset controls, and agent literacy training.
          </p>
        </div>

        {/* 4 Pillars Grid with High-Quality Generated Imagery */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Pillar 1: Colosseum Arena */}
          <div className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-brand-500/50 transition-all shadow-md flex flex-col">
            <div className="relative h-56 overflow-hidden bg-slate-900">
              <img
                src="/images/coliseum_hero_arena.jpg"
                alt="Coliseum Humans vs AI Pairwise Alignment"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <span className="absolute bottom-3 left-4 text-xs font-bold px-2.5 py-1 rounded bg-indigo-600 text-white shadow-sm">
                Colosseum Pairwise Arena
              </span>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Humans vs. AI Alignment Evaluation</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Rigorous pairwise double-blind testing of model responses against human gold-standard alignment keys. Deterministic metrics reveal when models over-block or hallucinate under pressure.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs font-semibold text-brand-400">
                <span>Run 24/7 on RTX 3090 Pod</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Pillar 2: Living GSPC Benchmark */}
          <div className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-brand-500/50 transition-all shadow-md flex flex-col">
            <div className="relative h-56 overflow-hidden bg-slate-900">
              <img
                src="/images/coliseum_logic_duel.jpg"
                alt="Living 22 Axis GSPC Matrix"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <span className="absolute bottom-3 left-4 text-xs font-bold px-2.5 py-1 rounded bg-emerald-600 text-white shadow-sm">
                22-Axis Living Matrix
              </span>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">GSPC (Governance &bull; Safety &bull; Provenance &bull; Continuity)</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  15 measured canonical axes + 7 unmeasured declared slots over 893 frozen split items. Wilson 95% confidence intervals and paired McNemar separation tests distinguish true wins from ties.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs font-semibold text-emerald-400">
                <span>Zero Unsubstantiated Grades</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Pillar 3: On-Chain RWA Asset Controls */}
          <div className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-brand-500/50 transition-all shadow-md flex flex-col">
            <div className="relative h-56 overflow-hidden bg-slate-900">
              <img
                src="/images/verifiable_evidence_card.jpg"
                alt="XRPL & Ethereum RWA Asset Telemetry"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <span className="absolute bottom-3 left-4 text-xs font-bold px-2.5 py-1 rounded bg-amber-600 text-white shadow-sm">
                RWA Provenance & Telemetry
              </span>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">On-Chain Control Facts & Account Verification</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Deterministic inspection of 6 institutional tokenized instruments (RLUSD, Ondo OUSG, OpenEden TBILL) covering RequireAuth, GlobalFreeze, and cryptographic root identity domains.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs font-semibold text-amber-400">
                <span>Read Directly from Mainnet</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Pillar 4: Training Simulators & MCP Live Drift */}
          <div className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-brand-500/50 transition-all shadow-md flex flex-col">
            <div className="relative h-56 overflow-hidden bg-slate-900">
              <img
                src="/images/literacy_training_arena.jpg"
                alt="Gamified Training Simulations & MCP Drift Engine"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <span className="absolute bottom-3 left-4 text-xs font-bold px-2.5 py-1 rounded bg-cyan-600 text-white shadow-sm">
                Training & MCP Live Monitor
              </span>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Gamified Literacy & Real-Time MCP Telemetry</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Interactive simulation labs for legal and engineering teams to model EU AI Act enforcement incidents, coupled with 341 FastMCP tool connectors monitoring liveness drift.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs font-semibold text-cyan-400">
                <span>Interactive Learning Simulators</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: POSITIVE OUTCOMES & END-USER USP GRID */}
      {/* ========================================================================= */}
      <section className="py-16 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold">Tangible Outcomes for Enterprise Teams</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Transform regulatory ambiguity into mathematically verifiable, automated operational peace of mind.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-background border border-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-foreground">Zero Exposure to €35M Fines</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automate Article 50 watermarking and Annex III risk classification before European AI Office statutory enforcement deadlines hit.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-background border border-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-foreground">Cryptographic Receipts (Ed25519)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every audit and model output comes with a 3KB signed measurement card that third-party auditors can verify in any browser offline.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-background border border-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-foreground">Multi-Model Deliberation (DSH)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Coordinate decisions across DeepSeek V4 Pro, local Ollama, and GPU clusters via the unified DeepSeek Harness console.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
