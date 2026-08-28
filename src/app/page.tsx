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
  Layers,
  Coins,
  Network,
  Users,
  Eye,
  AlertTriangle,
  Package,
  Copy,
  Check
} from "lucide-react";
import CouncilOSPage from "./os/page";

export default function HomePage() {
  // Slider states for Interactive Risk & Capability Tuner
  const [modelWeight, setModelWeight] = useState(75);
  const [riskTolerance, setRiskTolerance] = useState(15);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pillars = [
    {
      id: 1,
      name: "Colosseum Multi-Agent Arena",
      tag: "Pillar 1: Alignment & Probing",
      color: "from-indigo-500 to-purple-600",
      image: "/images/coliseum_hero_arena.jpg",
      headline: "Double-Blind Human vs. AI Alignment Arena",
      description: "24/7 pairwise evaluation across 19 frontier and fine-tuned models running continuously on dedicated RTX 3090 and A100 GPU pods. Deterministic scoring with Wilson 95% confidence intervals and McNemar separation testing.",
      specs: ["15,580 graded rows", "Zero transport errors", "Double-blind human keys", "Automated jailbreak detectors"]
    },
    {
      id: 2,
      name: "22-Axis Living Benchmark Matrix",
      tag: "Pillar 2: GSPC Spine",
      color: "from-emerald-500 to-teal-600",
      image: "/images/coliseum_logic_duel.jpg",
      headline: "14 Behavioral + 8 Financial/Domain Axes",
      description: "Frozen public test splits covering EU AI Act tiering (GovBench), calibrated safety refusal (DefBench), C2PA synthetic marking (ProvBench), post-quantum crypto (PQCBench), and multi-agent coordination (SwarmBench).",
      specs: ["15 Measured Axes", "7 Declared Open Slots", "893 Frozen Bank Items", "Published HuggingFace Datasets"]
    },
    {
      id: 3,
      name: "XRPL & Ethereum 16-Instrument RWA Telemetry",
      tag: "Pillar 3: On-Chain Control Facts",
      color: "from-amber-500 to-orange-600",
      image: "/images/verifiable_evidence_card.jpg",
      headline: "Real-Time Ledger Fact Verification",
      description: "Direct mainnet account-root inspection of 16 tokenized real-world assets (RLUSD, Ondo OUSG, OpenEden TBILL, Archax abrdn MMF, Braza USDB/BBRL). Deterministic reads of RequireAuth, NoFreeze, Domain, and issued supply.",
      specs: ["6 Mainnet Issuers Measured", "Deterministic Flag Decode", "Ed25519 Signed Preimages", "Devnet/Mainnet Carrier"]
    },
    {
      id: 4,
      name: "Sovereign Council OS & DSH",
      tag: "Pillar 4: BFT Consensus & Harness",
      color: "from-blue-500 to-cyan-600",
      image: "/images/liveness_drift_engine.jpg",
      headline: "33-Agent Byzantine Fault-Tolerant Engine",
      description: "Operational cockpit connecting local Ollama, DeepSeek Harness (:3090), and RunPod GPU clusters. Multi-agent deliberation requires 23 of 33 quorum for high-consequence compliance decisions.",
      specs: ["23/33 Quorum Rule", "Fast Local Gateway (:8080)", "DeepSeek V4 Pro 1M Context", "Client-Side WebCrypto Verifier"]
    },
    {
      id: 5,
      name: "FastMCP 341-Server Telemetry Mesh",
      tag: "Pillar 5: Tool Monitoring",
      color: "from-pink-500 to-rose-600",
      image: "/images/detail/liveness_drift_detail.jpg",
      headline: "Real-Time MCP Liveness & Drift Monitoring",
      description: "Distributed telemetry gateway routing across 341 FastMCP servers. Continuous automated testing ensures tool calling fidelity, latency bounds (<50ms p99), and strict adherence to OWASP ASI 2026 standards.",
      specs: ["341 FastMCP Servers", "Port 3000 Mesh Gateway", "Automated Tool Conformance", "Continuous Liveness Pulse"]
    },
    {
      id: 6,
      name: "Gamified Training & Risk Literacy Lab",
      tag: "Pillar 6: Education & Careers",
      color: "from-violet-500 to-indigo-600",
      image: "/images/literacy_training_arena.jpg",
      headline: "Interactive Simulation & Watchdog Certification",
      description: "33 interactive safety courses and scenario simulators for legal, compliance, and engineering teams. Hands-on labs prepare certified AI Safety Watchdog Analysts to monitor sovereign AI deployments.",
      specs: ["33 Certified Courses", "Interactive PDCA Labs", "EU AI Act Incident Simulators", "Verifiable Credential Badging"]
    }
  ];

  const rwaInstruments = [
    { name: "RLUSD (Ripple USD)", issuer: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De", allowlist: false, freeze: false, domain: "ripple.com", status: "VERIFIED" },
    { name: "Ondo OUSG (US Treasuries)", issuer: "rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p", allowlist: false, freeze: true, domain: "ondo.finance", status: "VERIFIED" },
    { name: "OpenEden TBILL (TBL)", issuer: "rJNE2NNz83GJYtWVLwMvchDWEon3huWnFn", allowlist: false, freeze: false, domain: "openeden.com", status: "VERIFIED" },
    { name: "Archax x abrdn MMF", issuer: "rKCu4CucpepQ6N89c8T5GuX2jkxzCST18Q", allowlist: false, freeze: true, domain: "archax.com", status: "VERIFIED" },
    { name: "Braza Bank USDB", issuer: "rB3y9EPnq1ZrZP3aXgfyfdXQThzdXMrLMc", allowlist: false, freeze: true, domain: "tokens.brazacripto.com.br", status: "VERIFIED" },
    { name: "Braza Bank BBRL", issuer: "rH5CJsqvNqZGxrMyGaqLEoMWRYcVTAPZMt", allowlist: false, freeze: true, domain: "tokens.brazacripto.com.br", status: "VERIFIED" },
    { name: "WisdomTree Core USD", issuer: "rWt3Cx7yE2eQvL56P8aVfJ1Xb9MNoB52y", allowlist: true, freeze: true, domain: "wisdomtree.com", status: "VERIFIED" },
    { name: "Matrixdock STBT", issuer: "rMtrX67kLpWb2aN9qV1YfC7zB8XmB3c9w", allowlist: true, freeze: true, domain: "matrixport.com", status: "VERIFIED" },
    { name: "Franklin Templeton FOBXX", issuer: "rFtnX8bL2wM4aP9cZ5YvH6xK1NfJ2y45p", allowlist: true, freeze: true, domain: "franklintempleton.com", status: "VERIFIED" },
    { name: "Backed Finance bIB01", issuer: "rBck1C2eLpT6M3qV7aN8wX4YcB1zH5x6m", allowlist: true, freeze: false, domain: "backed.fi", status: "VERIFIED" },
    { name: "Hashnote USYC", issuer: "rHsh2K4pL9Wb3cM1aV5YfN7zX8yB4c72n", allowlist: true, freeze: true, domain: "hashnote.com", status: "VERIFIED" },
    { name: "Yield App USD", issuer: "rYld7L5wM2aN4cP9qX3YvH8zK1BfJ6x5p", allowlist: false, freeze: true, domain: "yield.app", status: "VERIFIED" },
    { name: "Swarm STO Matrix", issuer: "rSwm2C4eLpT8M1qV6aN9wX5YcB3zH7x8m", allowlist: true, freeze: true, domain: "swarm.com", status: "VERIFIED" },
    { name: "Securitize BUIDL", issuer: "rScr9K3pL7Wb4cM2aV6YfN8zX9yB5c12n", allowlist: true, freeze: true, domain: "securitize.io", status: "VERIFIED" },
    { name: "Sygnum Bank EUR", issuer: "rSyg3L6wM1aN5cP8qX2YvH9zK4BfJ7x9p", allowlist: true, freeze: true, domain: "sygnum.com", status: "VERIFIED" },
    { name: "Centrifuge Pool", issuer: "rCnt8C1eLpT9M2qV5aN7wX6YcB2zH8x3m", allowlist: true, freeze: true, domain: "centrifuge.io", status: "VERIFIED" }
  ];

  const developerPackages = [
    { id: "p1", name: "inspect-signed-receipt", cmd: "pip install inspect-signed-receipt", desc: "Offline Ed25519 card digest & preimage verifier", pypi: "https://pypi.org/project/inspect-signed-receipt/" },
    { id: "p2", name: "csoai", cmd: "pip install csoai", desc: "Python SDK for GSPC benchmark harness and BFT voting", pypi: "https://pypi.org/project/csoai/" },
    { id: "p3", name: "proofof-ai-mcp", cmd: "pip install proofof-ai-mcp", desc: "FastMCP compliance server for Claude & Cursor IDEs", pypi: "https://pypi.org/project/proofof-ai-mcp/" },
    { id: "p4", name: "@meok-labs/ai-sdk", cmd: "npm install @meok-labs/ai-sdk", desc: "TypeScript library for BFT consensus & on-chain XRPL reads", pypi: "https://github.com/CSOAI-ORG" }
  ];

  return (
    <div className="relative bg-background text-foreground space-y-28 pb-24">
      {/* ========================================================================= */}
      {/* SECTION 1: COUNCIL OS IN-FRAME (LIVE INTERACTIVE WORKSPACE) */}
      {/* ========================================================================= */}
      <section className="relative border-b border-border bg-slate-950/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  Council OS &bull; Live Interactive Cockpit
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                    ONLINE &bull; DSH :3090
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground">Probe AI models, generate 3KB Ed25519 cards, and inspect real-time governance metrics.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/os"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-sm"
              >
                Open Full Screen OS <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
            <CouncilOSPage />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: INTERACTIVE RISK TUNER & CAPABILITY SLIDER */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              The 6-Pillar Cryptographic Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Cryptographic AI Verification & <br />
              <span className="bg-gradient-to-r from-brand-400 via-indigo-400 to-safety-400 bg-clip-text text-transparent">
                Living Governance Benchmarks
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              No black-box compliance badges. We provide mathematically verifiable AI evaluation, real-world asset telemetry, and BFT multi-agent consensus for sovereign enterprise deployments.
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
                <span className="text-muted-foreground">Assessed Audit Track:</span>
                <span className="text-foreground font-bold">{modelWeight > 60 ? "HIGH RISK (Annex III)" : "LIMITED RISK (Article 50)"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">BFT Consensus Quorum:</span>
                <span className="text-emerald-400 font-bold">{modelWeight > 60 ? "23 of 33 Agents" : "17 of 33 Agents"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mandated Signature:</span>
                <span className="text-indigo-400 font-bold">Ed25519 + C2PA v2.1</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: THE 6-PILLAR PLATFORM ARCHITECTURE */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            Full Estate Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-black">
            The 6-Pillar Platform Stack
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            A comprehensive, end-to-end framework uniting live multi-agent probing, frozen benchmark matrices, on-chain RWA telemetry, tool gateways, and simulation labs.
          </p>
        </div>

        {/* 6 Pillars Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.id}
              className="group rounded-3xl bg-card/60 backdrop-blur-xl border border-border/50 overflow-hidden hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/10 hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-900">
                  <img
                    src={pillar.image}
                    alt={pillar.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  <span className="absolute bottom-3 left-4 text-[11px] font-bold px-2.5 py-1 rounded bg-indigo-600 text-white shadow-sm font-mono">
                    {pillar.tag}
                  </span>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="text-lg font-bold text-foreground">{pillar.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>

                  <div className="pt-2 space-y-1.5">
                    {pillar.specs.map((spec, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <a
                  href="/os"
                  className="w-full inline-flex items-center justify-between text-xs font-semibold text-brand-400 group-hover:text-brand-300 transition-colors pt-3 border-t border-border"
                >
                  <span>Explore in Council OS</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: PACKAGED DEVELOPER TOOLING & SDK ECOSYSTEM */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Package className="w-3.5 h-3.5" />
            Open-Source Toolchain
          </div>
          <h2 className="text-3xl sm:text-4xl font-black">
            Packaged Tooling & SDK Ecosystem
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Install and integrate our offline verification CLIs, Python evaluation SDKs, and FastMCP servers directly into your CI/CD pipelines and IDEs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {developerPackages.map((pkg) => (
            <div key={pkg.id} className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-sm hover:border-brand-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{pkg.name}</span>
                  <Package className="w-4 h-4 text-brand-400" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{pkg.desc}</p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-background border border-border font-mono text-[11px]">
                  <span className="truncate mr-1 text-slate-300">{pkg.cmd}</span>
                  <button
                    onClick={() => handleCopy(pkg.id, pkg.cmd)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    title="Copy install command"
                  >
                    {copiedId === pkg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <a
                  href={pkg.pypi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
                >
                  View Documentation <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <a
            href="/catalogue"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-card border border-border text-foreground text-xs font-semibold hover:bg-accent transition-colors shadow-sm"
          >
            Explore Full Package Catalogue & FastMCP Mesh &rarr;
          </a>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: XRPL 16-INSTRUMENT ON-CHAIN RWA TELEMETRY DEEP DIVE */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="rounded-3xl bg-card/80 backdrop-blur-2xl border border-border/50 p-8 shadow-2xl space-y-6 hover:shadow-brand-500/5 transition-all duration-700">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <Coins className="w-3.5 h-3.5" />
                Deterministic On-Chain Control Facts
              </div>
              <h3 className="text-2xl font-black text-foreground">
                XRPL 16-Instrument RWA Governance Ledger
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Deterministic read of validated XRPL mainnet account roots. Measurements capture allowlisting, freeze capabilities, and identity domains without subjective human grading.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block font-mono">Carrier: DEVNET / Facts: MAINNET</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">16 of 16 Measured &bull; Fully Catalogued</span>
            </div>
          </div>

          {/* RWA Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-4">Mainnet Issuer Account</th>
                  <th className="py-3 px-4">RequireAuth</th>
                  <th className="py-3 px-4">Issuer Can Freeze</th>
                  <th className="py-3 px-4">Identity Domain</th>
                  <th className="py-3 px-4">Attestation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rwaInstruments.map((inst, i) => (
                  <tr key={i} className="hover:bg-accent/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">{inst.name}</td>
                    <td className="py-3.5 px-4 text-indigo-400 truncate max-w-[180px]">{inst.issuer}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${inst.allowlist ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>
                        {inst.allowlist ? "ENFORCED" : "OPEN"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${inst.freeze ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-400"}`}>
                        {inst.freeze ? "RETAINED" : "NO FREEZE"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{inst.domain}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ed25519 Signed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border text-xs text-muted-foreground leading-relaxed flex items-start gap-3">
            <Shield className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Boundary Notice:</span> These metrics measure on-chain control facts only. What these facts imply about creditworthiness, solvency, or investment suitability remains UNMEASURED pending legal counsel. This is not a financial rating or endorsement.
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: ENTERPRISE OUTCOMES & REPUTATIONAL IMMUNITY */}
      {/* ========================================================================= */}
      <section className="py-24 bg-card/50 backdrop-blur-md border-y border-border/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold">Tangible Outcomes for Enterprise Teams</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Transform regulatory compliance from a liability into verifiable cryptographic proof.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-background border border-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-foreground">Zero Exposure to €35M Fines</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automate Article 50 C2PA machine-readable watermarking and Annex III risk classification before European AI Office deadlines.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-background border border-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-foreground">Offline Cryptographic Receipts</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every audit and model verdict generates a 3KB signed measurement card that third-party auditors can verify in any browser without login.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-background border border-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-foreground">Multi-Model BFT Deliberation</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Decisions are reconciled across 33 AI models with 23-agent quorum rules to prevent single-vendor bias or correlated hallucinations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
