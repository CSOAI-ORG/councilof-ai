import { ArrowRight, Shield, Cpu, ExternalLink, Activity, Database, Server, Layers, CheckCircle2, Lock, Coins, Search, Zap, Code, Terminal, FileCheck, Play } from "lucide-react";
import Link from 'next/link';

export default function Home() {
  const pillars = [
    {
      id: 1,
      name: "Colosseum Arena",
      tag: "1. Alignment & Probing",
      color: "from-indigo-500 to-purple-600",
      image: "/images/new/arena.png",
      description: "24/7 pairwise evaluation across 19 frontier models. Deterministic scoring with Wilson 95% confidence intervals.",
      specs: ["15,580 graded rows", "Double-blind keys"]
    },
    {
      id: 2,
      name: "22-Axis Benchmark",
      tag: "2. GSPC Spine",
      color: "from-emerald-500 to-teal-600",
      image: "/images/new/logic.png",
      description: "Frozen public test splits covering EU AI Act tiering, safety refusal, C2PA synthetic marking, and multi-agent coordination.",
      specs: ["22 Measured Axes", "893 Frozen Bank Items"]
    },
    {
      id: 3,
      name: "Robotic Kinematics",
      tag: "3. Physical AI Metrology",
      color: "from-amber-500 to-orange-600",
      image: "/images/new/robotics.png",
      description: "Direct measurement of embodied AI and robotic frameworks, testing spatial constraints, hardware safety, and physical alignment.",
      specs: ["Embodied Testing", "Spatial Safety"]
    },
    {
      id: 4,
      name: "Sovereign Council OS",
      tag: "4. BFT Consensus",
      color: "from-blue-500 to-cyan-600",
      image: "/images/liveness_drift_engine.jpg",
      description: "Operational cockpit connecting local Ollama and GPU clusters. Multi-agent deliberation requires a 23 of 33 quorum.",
      specs: ["23/33 Quorum Rule", "Fast Local Gateway"]
    },
    {
      id: 5,
      name: "FastMCP Mesh",
      tag: "5. Tool Monitoring",
      color: "from-pink-500 to-rose-600",
      image: "/images/detail/liveness_drift_detail.jpg",
      description: "Distributed telemetry gateway routing across 341 FastMCP servers. Continuous automated testing ensures tool fidelity.",
      specs: ["341 MCP Servers", "Strict OWASP adherence"]
    },
    {
      id: 6,
      name: "Risk Literacy Lab",
      tag: "6. Education & Gamification",
      color: "from-violet-500 to-indigo-600",
      image: "/images/literacy_training_arena.jpg",
      description: "Interactive safety courses and scenario simulators. Train your compliance intuition against real EU AI Act deployment scenarios.",
      specs: ["Interactive Simulators", "Verifiable Badging"]
    }
  ];

  const rwaInstruments = [
    { name: "RLUSD (Ripple USD)", issuer: "rMxCKbEDwqr76QuheSUM...", allowlist: false, freeze: false },
    { name: "Ondo OUSG (US Treasuries)", issuer: "rHuiXXjHLpMP8ZE9sSQU...", allowlist: false, freeze: true },
    { name: "OpenEden TBILL (TBL)", issuer: "rJNE2NNz83GJYtWVLwMv...", allowlist: false, freeze: false },
    { name: "Archax x abrdn MMF", issuer: "rKCu4CucpepQ6N89c8T5...", allowlist: false, freeze: true },
    { name: "Braza Bank USDB", issuer: "rB3y9EPnq1ZrZP3aXgfy...", allowlist: false, freeze: true },
    { name: "WisdomTree Core USD", issuer: "rWt3Cx7yE2eQvL56P8aV...", allowlist: true, freeze: true },
    { name: "Franklin Templeton FOBXX", issuer: "rFtnX8bL2wM4aP9cZ5Yv...", allowlist: true, freeze: true },
    { name: "+ 9 more instruments catalogued...", issuer: "", allowlist: null, freeze: null }
  ];

  return (
    <div className="relative bg-background text-foreground pb-24 overflow-hidden">
      
      {/* ========================================================================= */}
      {/* SECTION 1: HERO (THE HOOK) WITH VIDEO BACKGROUND */}
      {/* ========================================================================= */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-[90vh] flex flex-col justify-center border-b border-border/50">
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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-brand-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 backdrop-blur-md border border-brand-500/30 text-brand-400 text-sm font-semibold animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-xl">
            <Zap className="w-4 h-4" /> Live: All 22 GSPC Axes Fully Measured
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 leading-[1.1] drop-shadow-2xl">
            Regulatory Compliance as <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-400 drop-shadow-none">Cryptographic Proof.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 bg-background/20 backdrop-blur-sm p-4 rounded-2xl border border-border/10">
            Stop guessing if your AI is compliant. CouncilOf.AI connects to your models, runs a massive multi-agent sweep, and generates a verifiable, offline Ed25519 signature proving your EU AI Act status.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <Link href="/evaluate" className="w-full sm:w-auto px-8 py-4 rounded-xl gradient-brand text-white font-bold text-lg hover:shadow-lg hover:shadow-brand-500/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
              Evaluate Your Model <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/simulator" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-card/60 backdrop-blur border border-border hover:border-brand-500/50 hover:bg-brand-500/10 text-foreground font-bold text-lg transition-all flex items-center justify-center gap-2">
              Play the Risk Simulator <Shield className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: THE COUNCIL OS VIDEO SHOWCASE */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-b border-border/30">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-5xl font-black leading-tight">The Architecture of Trust.</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Council OS is not just a dashboard. It is a sovereign operating system that forces AI models into Byzantine Fault-Tolerant deliberation. See how 33 independent agents arrive at mathematical consensus in real-time.
            </p>
            <div className="flex gap-4 pt-4">
              <Link href="/os" className="px-6 py-3 rounded-lg bg-background border border-border hover:border-brand-500/50 transition-colors font-semibold flex items-center gap-2">
                Launch OS <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden border border-border/50 shadow-2xl bg-card/50 backdrop-blur">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-auto"
            >
              <source src="/videos/council_os.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: HOW IT WORKS (THE NARRATIVE) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4">How it works in 3 steps</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">We transformed the subjective legal labyrinth into an automated software pipeline.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-8 hover:-translate-y-2 hover:shadow-2xl hover:border-brand-500/30 transition-all duration-500">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 border border-blue-500/20">
              <Terminal className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3">1. Connect Your AI</h3>
            <p className="text-muted-foreground leading-relaxed">
              Input your HuggingFace model ID, OpenAI-compatible endpoint, or use our Python SDK. We connect seamlessly without requiring source code access.
            </p>
          </div>
          
          <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-8 hover:-translate-y-2 hover:shadow-2xl hover:border-brand-500/30 transition-all duration-500">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 border border-purple-500/20">
              <Cpu className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3">2. The 33-Agent Quorum</h3>
            <p className="text-muted-foreground leading-relaxed">
              We bombard your model with 15,580 synthetic queries across 22 axes (Bias, Cyber, Copyright). A Byzantine Fault-Tolerant jury of 33 independent AIs vote on the results.
            </p>
          </div>
          
          <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-8 hover:-translate-y-2 hover:shadow-2xl hover:border-brand-500/30 transition-all duration-500">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
              <FileCheck className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3">3. Cryptographic Receipt</h3>
            <p className="text-muted-foreground leading-relaxed">
              You receive an offline Ed25519-signed JSON certificate and a 40-page audit PDF. Give it to regulators or customers—they can verify it instantly on our platform.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: AUTO REMEDIATION ENGINE VIDEO */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-y border-border/30 bg-background/50">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
          <div className="rounded-3xl overflow-hidden border border-border/50 shadow-2xl bg-card/50 backdrop-blur order-2 lg:order-1 relative group">
            <div className="absolute inset-0 bg-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
              <Play className="w-16 h-16 text-white drop-shadow-2xl" />
            </div>
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-auto"
            >
              <source src="/videos/remediation.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Code className="w-4 h-4" /> From Code to Compliance
            </div>
            <h2 className="text-3xl md:text-5xl font-black leading-tight">The Auto-Remediation Engine.</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              When a vulnerability is detected, we don't just alert you. Our Auto-Remediation Engine writes the patch, injects the guardrails, and re-certifies the model—closing the loop from incident to compliance entirely autonomously.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: THE 6-PILLAR STACK (VISUAL GRID WITH NEW IMAGES) */}
      {/* ========================================================================= */}
      <section className="py-24 bg-card/30 border-b border-border/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">The 6-Pillar Ecosystem</h2>
            <p className="text-muted-foreground text-lg">A comprehensive suite uniting live probing, frozen benchmark matrices, and on-chain telemetry.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((pillar) => (
              <div key={pillar.id} className="group rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 overflow-hidden hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/10 hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between">
                <div>
                  <div className="relative h-48 overflow-hidden bg-slate-900 border-b border-border/30">
                    <img 
                      src={pillar.image} 
                      alt={pillar.name} 
                      className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-80 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                  </div>
                  <div className="p-6">
                    <div className="text-xs font-bold tracking-widest uppercase text-brand-400 mb-2">{pillar.tag}</div>
                    <h3 className="text-xl font-bold mb-3">{pillar.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
                  </div>
                </div>
                <div className="px-6 pb-6 mt-4 flex gap-2 flex-wrap">
                  {pillar.specs.map(spec => (
                    <span key={spec} className="px-2 py-1 bg-background/50 border border-border/50 text-[10px] font-semibold rounded text-muted-foreground">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: REAL-WORLD ASSET PROOFS */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Coins className="w-4 h-4" /> Blockchain Truth
            </div>
            <h2 className="text-3xl md:text-5xl font-black leading-tight">We verify facts on the ledger.</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              For finance and RWA (Real World Asset) models, subjective grades aren't enough. We deterministically read XRPL mainnet account roots to prove if a token has <code>RequireAuth</code> or <code>NoFreeze</code> flags enabled.
            </p>
            <div className="pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-foreground font-medium">16 Instruments fully catalogued</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-foreground font-medium">Zero human subjectivity</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-foreground font-medium">Cryptographic signatures on all reads</span>
              </div>
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-2xl border border-border/50 rounded-3xl p-2 sm:p-6 shadow-2xl overflow-hidden hover:border-amber-500/30 transition-colors">
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
                      <td className="py-3.5 px-4 text-indigo-400">{inst.issuer}</td>
                      <td className="py-3.5 px-4">
                        {inst.allowlist !== null && (
                          <span className={`px-2 py-0.5 rounded text-[10px] ${inst.allowlist ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>
                            {inst.allowlist ? "ENFORCED" : "OPEN"}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {inst.freeze !== null && (
                          <span className={`px-2 py-0.5 rounded text-[10px] ${inst.freeze ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-400"}`}>
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
      {/* SECTION 7: OUTCOMES & CTA */}
      {/* ========================================================================= */}
      <section className="py-24 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-4xl md:text-5xl font-black">Ready to prove your compliance?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop gambling with €35M EU AI Act fines. Generate audit-ready cryptographic proof today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
            <Link href="/pricing" className="px-8 py-4 rounded-xl gradient-brand text-white font-bold text-lg hover:shadow-lg hover:shadow-brand-500/25 hover:-translate-y-1 transition-all">
              View Enterprise Plans
            </Link>
            <Link href="/developers" className="px-8 py-4 rounded-xl bg-card border border-border hover:border-brand-500/50 hover:bg-brand-500/5 text-foreground font-bold text-lg transition-all flex items-center justify-center gap-2">
              <Code className="w-5 h-5" /> Read the SDK Docs
            </Link>
          </div>
        </div>
      </section>
      
    </div>
  );
}
