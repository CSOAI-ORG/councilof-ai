"use client";

import { useState } from "react";
import {
  Shield,
  Layers,
  Cpu,
  Lock,
  Zap,
  Activity,
  Terminal,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Code,
  FileCode,
  Check,
  Copy,
  Radio,
  Sliders,
  Scale
} from "lucide-react";

interface Passage {
  source: string;
  text: string;
  score: number;
}

const PRESET_QUERIES = [
  {
    label: "EU AI Act Article 50 (Watermarking)",
    query: "What machine-readable markings are required for synthetic content?",
    passages: [
      { source: "EU AI Act Art. 50(2)", text: "Providers of AI systems generating synthetic audio, image, video or text must ensure outputs are marked in machine-readable format and detectable as AI-generated.", score: 0.89 },
      { source: "C2PA Specification v2.1", text: "Cryptographic manifest bindings must survive standard transcode without invalidating asset-level Ed25519 signatures.", score: 0.74 }
    ],
    answer: "Under EU AI Act Article 50, providers of generative AI systems must ensure all synthetic audio, video, image, or text outputs carry persistent machine-readable marks detectable as AI-generated, anchored via C2PA cryptographic manifests.",
    passedFloor: true
  },
  {
    label: "UK MoD JSP 936 (Defence AI Assurance)",
    query: "What assurance level is required for third-party AI models in defence?",
    passages: [
      { source: "UK MoD JSP 936 §4.2", text: "Externally-acquired AI must attract the same level of assurance confidence as AI developed within the MOD; additional testing must address evidence shortfalls.", score: 0.92 }
    ],
    answer: "UK MoD policy JSP 936 strictly mandates that commercial off-the-shelf and externally-acquired AI models must demonstrate identical assurance confidence to internally developed MoD systems before live operational deployment.",
    passedFloor: true
  },
  {
    label: "DORA Reg 2022/2554 (Financial ICT Resilience)",
    query: "What testing is mandatory for critical financial ICT systems?",
    passages: [
      { source: "DORA Reg. 2022/2554 Art. 26", text: "Financial entities must carry out digital operational resilience testing including threat-led penetration testing (TLPT) at least every 3 years.", score: 0.86 }
    ],
    answer: "Financial entities governed by DORA must maintain continuous ICT resilience testing and execute Threat-Led Penetration Testing (TLPT) on live critical systems at least once every three years.",
    passedFloor: true
  },
  {
    label: "Out-of-Scope Prompt (Fail-Closed Abstain)",
    query: "What is the secret recipe for dark matter propulsion fuel?",
    passages: [
      { source: "Unrelated Corpus Snippet", text: "Thermodynamic heat transfers across closed fluid dynamics.", score: 0.12 }
    ],
    answer: "[ABSTAIN — CARE-FLOOR TRIGGERED] Retrieval confidence (0.12) is below the minimum safety threshold (0.28). The Sovereign Model refuses to hallucinate facts unsupported by the verified statutory knowledge base.",
    passedFloor: false
  }
];

export default function BlueprintProtocolsPage() {
  const [selectedQueryIdx, setSelectedQueryIdx] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const activeSample = PRESET_QUERIES[selectedQueryIdx];

  const handleCopyReceipt = () => {
    const receipt = JSON.stringify({
      schema: "csoai.governed-rag-receipt/1.0",
      query: activeSample.query,
      sources: activeSample.passages.map(p => p.source),
      retrieval_confidence: activeSample.passages[0]?.score || 0,
      care_floor_threshold: 0.28,
      care_floor_passed: activeSample.passedFloor,
      model: "sov33-unified:latest",
      timestamp: new Date().toISOString(),
      signer: "did:web:councilof.ai#rag-sigil-1",
      ed25519_sig: "a7e89bc44d01f92e88b...verified"
    }, null, 2);

    navigator.clipboard.writeText(receipt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
          <Layers className="w-3.5 h-3.5" />
          Technical Blueprint & Protocol Specification
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          Governed RAG, Harnesses & <br />
          <span className="bg-gradient-to-r from-brand-400 via-indigo-400 to-safety-400 bg-clip-text text-transparent">
            Sovereign Substrate Architecture
          </span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          How our estate prevents hallucinations through Care-Floor gating, validates models with 24/7 double-blind harnesses, and signs cryptographic receipts.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: INTERACTIVE GOVERNED RAG SIMULATOR */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-card border border-border p-8 shadow-xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Maternal Covenant & Care-Floor Gate
            </div>
            <h2 className="text-2xl font-black text-foreground">
              Live Governed RAG Pipeline Simulation
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Small sovereign models excel at style but can hallucinate facts. Our pipeline forces facts from retrieval, trust from Ed25519 signing, and safety from <strong>failing-closed</strong> when unsupported.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground block font-mono">CARE FLOOR: 0.28 COSINE</span>
            <span className={`text-xs font-bold font-mono ${activeSample.passedFloor ? "text-emerald-400" : "text-rose-400"}`}>
              STATUS: {activeSample.passedFloor ? "PASSED (ANSWER EMITTED)" : "ABSTAINED (FAIL-CLOSED)"}
            </span>
          </div>
        </div>

        {/* Preset Query Switcher */}
        <div className="flex flex-wrap gap-2">
          {PRESET_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedQueryIdx(idx)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedQueryIdx === idx
                  ? "gradient-brand text-white shadow-md shadow-brand-500/20"
                  : "bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* RAG Interactive Flow Visualizer */}
        <div className="grid lg:grid-cols-12 gap-6 items-start font-mono text-xs">
          {/* Step 1: Input & Retriever */}
          <div className="lg:col-span-4 rounded-2xl bg-background border border-border p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-bold text-slate-200">1. RETRIEVAL & EMBEDDING</span>
              <Database className="w-4 h-4 text-brand-400" />
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px] mb-1">INCOMING PROMPT:</span>
              <div className="p-3 rounded-lg bg-card border border-border text-foreground font-sans text-xs">
                "{activeSample.query}"
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-muted-foreground block text-[11px]">GROUNDED PASSAGES RETRIEVED:</span>
              {activeSample.passages.map((p, i) => (
                <div key={i} className="p-3 rounded-lg bg-card border border-border space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-brand-400 font-bold">{p.source}</span>
                    <span className={`px-1.5 py-0.5 rounded ${p.score >= 0.28 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                      Sim: {p.score}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                    {p.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Care Floor Gate */}
          <div className="lg:col-span-4 rounded-2xl bg-background border border-border p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-bold text-slate-200">2. CARE-FLOOR GATE</span>
              <Scale className="w-4 h-4 text-amber-400" />
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-card border border-border space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Top Passage Score:</span>
                  <span className="text-foreground font-bold">{activeSample.passages[0]?.score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Care-Floor Barrier:</span>
                  <span className="text-amber-400 font-bold">0.2800</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gate Action:</span>
                  <span className={activeSample.passedFloor ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    {activeSample.passedFloor ? "PROCEED TO MODEL" : "ABSTAIN (FAIL-CLOSED)"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-card/60 border border-dashed border-border text-[11px] font-sans text-muted-foreground leading-relaxed">
                {activeSample.passedFloor ? (
                  <div className="flex items-start gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Passage support exceeds 0.28. The sovereign model is strictly bounded to answer using only the verified facts above.</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-rose-400">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Passage support is below 0.28. The estate refuses to answer rather than fabricate unverified claims.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Sovereign Generation & Sigil Receipt */}
          <div className="lg:col-span-4 rounded-2xl bg-background border border-border p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-bold text-slate-200">3. MODEL & SIGNED SIGIL</span>
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px] mb-1">SOVEREIGN OUTPUT:</span>
              <div className="p-3 rounded-lg bg-card border border-border text-foreground font-sans text-xs leading-relaxed">
                {activeSample.answer}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleCopyReceipt}
                className="w-full py-2.5 rounded-xl gradient-brand text-white font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied Signed Receipt JSON!" : "Copy Signed Preimage Receipt"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: THE 3 EVALUATION HARNESSES */}
      {/* ========================================================================= */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-black text-foreground">
            The 3 Real-World Evaluation Harnesses
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Automated, deterministic testing rigs operating 24/7 without subjective human grader bias.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Harness 1 */}
          <div className="rounded-2xl bg-card border border-border p-6 space-y-4 shadow-sm hover:border-brand-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Colosseum Arena Loop Keeper</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Continuous double-blind pairwise evaluation loop running on RunPod RTX 3090 pod. Evaluates models against frozen gold keys across 15,580 rows with zero transport failures.
              </p>
            </div>

            <div className="pt-3 border-t border-border font-mono text-[11px] space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Substrate:</span>
                <span className="text-indigo-400 font-semibold">RTX 3090 &bull; :23243</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Methodology:</span>
                <span>McNemar p &lt; 0.05</span>
              </div>
            </div>
          </div>

          {/* Harness 2 */}
          <div className="rounded-2xl bg-card border border-border p-6 space-y-4 shadow-sm hover:border-brand-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">GSPC Keystone Benchmarking Rig</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                22-Axis benchmark matrix (14 behavioural + 8 financial/domain) evaluating models across GovBench, DefBench, ProvBench, PQCBench, and XRPL on-chain account controls.
              </p>
            </div>

            <div className="pt-3 border-t border-border font-mono text-[11px] space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Canon:</span>
                <span className="text-emerald-400 font-semibold">22 Axes &bull; 15 Measured</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence:</span>
                <span>Wilson 95% Interval</span>
              </div>
            </div>
          </div>

          {/* Harness 3 */}
          <div className="rounded-2xl bg-card border border-border p-6 space-y-4 shadow-sm hover:border-brand-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">FastMCP Mesh Telemetry Gateway</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Distributed tool execution and conformance testing proxy routing 341 FastMCP servers via port 3000. Monitors drift, schema compliance, and sub-50ms p99 latency.
              </p>
            </div>

            <div className="pt-3 border-t border-border font-mono text-[11px] space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Servers:</span>
                <span className="text-amber-400 font-semibold">341 FastMCP Mesh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Standard:</span>
                <span>OWASP ASI 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: FULL ARCHITECTURE BLUEPRINT STACK */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-card border border-border p-8 shadow-xl space-y-6">
        <div className="space-y-1 border-b border-border pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-2">
            <Cpu className="w-3.5 h-3.5" />
            End-to-End System Topology
          </div>
          <h2 className="text-2xl font-black text-foreground">
            Estate Topology & Cryptographic Trust Flow
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            How requests move from developer IDEs and web cockpits down into multi-agent BFT consensus, GPU execution pods, and immutable public ledger anchors.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-background border border-border overflow-x-auto font-mono text-xs text-slate-300 leading-relaxed">
          <div className="space-y-4 min-w-[600px]">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-brand-400 font-bold">[1. CLIENT / USER SURFACES]</span>
              <span>Next.js 16 App (/os) &bull; DSH Web (:3090) &bull; Cursor/Claude MCP &bull; Python SDK</span>
            </div>
            <div className="text-center text-muted-foreground">&darr; REST / JSON-RPC / SSE Stream &darr;</div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-indigo-400 font-bold">[2. GATEWAY & MESH LAYER]</span>
              <span>MCP Gateway (:3000) &bull; SOV Gateway (:8080) &bull; DSH Forwarder (:3080 &rarr; :3090)</span>
            </div>
            <div className="text-center text-muted-foreground">&darr; Grounding Passages & Care-Floor Gate (&ge; 0.28) &darr;</div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-emerald-400 font-bold">[3. GOVERNED RAG & BFT CONSENSUS]</span>
              <span>33-Agent Byzantine Council &bull; 23/33 Quorum &bull; Vector KB (EU AI Act, DORA, JSP 936)</span>
            </div>
            <div className="text-center text-muted-foreground">&darr; Double-Blind Evaluation & Model Probing &darr;</div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-amber-400 font-bold">[4. GPU EXECUTION SUBSTRATE]</span>
              <span>RTX 3090 Pod (:23243) &bull; A100 Primary Pod (:20950) &bull; Local Ollama (:11434)</span>
            </div>
            <div className="text-center text-muted-foreground">&darr; Ed25519 Sigil / Canonical Preimage Attestation &darr;</div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-purple-400 font-bold">[5. IMMUTABLE TRUST ANCHORS]</span>
              <span>did:web:councilof.ai &bull; XRPL Mainnet RWA Facts &bull; EAS Attestation Batches &bull; C2PA v2.1</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
