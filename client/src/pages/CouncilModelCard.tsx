import { useEffect } from "react";

// Council Workbench Model Card — the honest, current record of what the
// measurement engine actually is, how it serves, and what it does not
// yet claim. Written to the same RUNNING / DESIGNED / STUB honesty register
// used across the estate's internal alignment docs — nothing here overstates
// what is verified. See /sov3-system-card for the safety/eval record and
// /sov3-whitepaper for the architecture paper.

function Tag({ kind }: { kind: "running" | "designed" | "stub" }) {
  const cfg = {
    running: { label: "RUNNING — verified", cls: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" },
    designed: { label: "DESIGNED — not yet live", cls: "border-amber-400/40 bg-amber-500/10 text-amber-200" },
    stub: { label: "STUB — placeholder", cls: "border-rose-400/40 bg-rose-500/10 text-rose-200" },
  }[kind];
  return <span className={"rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide " + cfg.cls}>{cfg.label}</span>;
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/60">{title}</div>
      {children}
    </div>
  );
}

export default function CouncilModelCard() {
  useEffect(() => { document.title = "Council model card — architecture, status, honest limits | CSOAI"; }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-5xl px-6 pt-14 pb-8">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Model card · v1</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">
            Council Workbench — <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">a governed measurement engine</span>, not a foundation model.
          </h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            Council Workbench is a <b className="text-emerald-200">sandwich architecture</b>: open-weight base models wrapped in a
            governed, Ed25519-signed, evolving measurement engine. It is not trained from scratch and does not claim to beat
            frontier models on raw capability — its differentiator is the <b className="text-emerald-200">governed,
            auditable layer</b> around whatever base model it runs.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Tag kind="running" /> <span className="text-[12px] text-emerald-100/60">real, verified this record</span>
            <Tag kind="designed" /> <span className="text-[12px] text-emerald-100/60 ml-2">code/spec exists, not yet live</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10 space-y-5">
        <Section title="What Council Workbench is">
          <p className="text-[13px] text-emerald-100/85 leading-relaxed">
            <b>Not</b> a from-scratch foundation model. <b>Is</b> a governed wrapper: base open-weight models
            (Apache-2.0 / MIT licensed) sit inside a substrate that adds long-context state, cryptographic
            attestation of every hop, and a care-floor safety gate that runs before any answer reaches a user.
            "Organic" = it evolves/calibrates over time via memory and adapters on a frozen base; "Open" = built
            on open-weight models; "World model" = the middle keeps long-context state and perception, not just
            next-token chat.
          </p>
        </Section>

        <Section title="How it serves today">
          <div className="flex items-start gap-3">
            <Tag kind="designed" />
            <p className="text-[13px] text-emerald-100/85 leading-relaxed">
              A 3-tier inference cascade is the intended design: <b className="text-emerald-200">Oracle GenAI
              (Llama-3.3-70b-instruct, OCI-request-signed)</b> as the primary brain, falling back to a local
              Ollama instance, falling back to an offline mode. An internal record from a prior session reports
              one successful signed call to the Oracle tier — that single result has not been re-verified here,
              and a separate live check on the chat-facing endpoint found it giving inconsistent, ungrounded
              answers to basic identity questions. Treat the cascade as designed and partially exercised, not
              as a fully verified live production path, until re-tested end-to-end.
            </p>
          </div>
          <div className="mt-3 flex items-start gap-3">
            <Tag kind="designed" />
            <p className="text-[13px] text-emerald-100/85 leading-relaxed">
              A locally-hosted <code className="text-emerald-200">qwen3:30b-a3b</code> mixture-of-experts base,
              targeted at dedicated on-prem hardware (192GB Mac-class machine). This is the intended
              fully offline configuration — it is the architecture target, not yet the model answering live
              traffic.
            </p>
          </div>
        </Section>

        <Section title="Architecture components">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-emerald-300/60 text-left">
                <th className="pb-2 font-mono uppercase tracking-wide">Layer</th>
                <th className="pb-2 font-mono uppercase tracking-wide">Component</th>
                <th className="pb-2 font-mono uppercase tracking-wide">License</th>
              </tr>
            </thead>
            <tbody className="text-emerald-100/85">
              <tr className="border-t border-emerald-500/10"><td className="py-2">Reasoning / language</td><td>Qwen3-MoE family</td><td>Apache-2.0</td></tr>
              <tr className="border-t border-emerald-500/10"><td className="py-2">Long-context memory</td><td>Mamba-2 state-space (16-dim)</td><td>—</td></tr>
              <tr className="border-t border-emerald-500/10"><td className="py-2">Perception (vision)</td><td>Moondream + Zamba</td><td>open</td></tr>
              <tr className="border-t border-emerald-500/10"><td className="py-2">Chain-of-thought</td><td>DeepSeek-R1</td><td>MIT</td></tr>
              <tr className="border-t border-emerald-500/10"><td className="py-2">Voice</td><td>Kokoro-82M / Piper TTS</td><td>Apache/MIT</td></tr>
              <tr className="border-t border-emerald-500/10"><td className="py-2">Retrieval</td><td>BGE-M3 + BGE-reranker</td><td>MIT</td></tr>
              <tr className="border-t border-emerald-500/10"><td className="py-2">Attestation</td><td>Ed25519-signed measurement card, every hop signed</td><td>ours</td></tr>
            </tbody>
          </table>
        </Section>

        <Section title="What Council Workbench is NOT (binding limits)">
          <ul className="space-y-1.5 text-[13px] text-emerald-100/85">
            <li className="flex gap-2"><span className="text-rose-400">✕</span>Not a from-scratch trained foundation model — every language capability is borrowed from an open base.</li>
            <li className="flex gap-2"><span className="text-rose-400">✕</span>Not benchmarked head-to-head against frontier models (GSM8K/MMLU) — that capability grade is still open, gated on a real GPU run.</li>
            <li className="flex gap-2"><span className="text-rose-400">✕</span>Not AGI, not conscious in the literal sense — any language about emergent behaviour or "consciousness" in internal material is a metaphor for the substrate's evolving-memory design, never a literal claim.</li>
            <li className="flex gap-2"><span className="text-rose-400">✕</span>Status-check endpoints that report component health (e.g. "model loaded: true") are current placeholders, not live hardware probes — treat any such flag as informational only until it is replaced with a real probe.</li>
          </ul>
        </Section>

        <Section title="License">
          <p className="text-[13px] text-emerald-100/85 leading-relaxed">
            Council Workbench's own engine code and governance layer are CSOAI's IP. The base models it wraps are
            individually permissively licensed (Apache-2.0 / MIT — see table above); no copyleft (AGPL/GPL)
            component is used in the paid tier, by design — copyleft dependencies are quarantined to
            the fully-open free tier only, to avoid forcing the commercial stack open.
          </p>
        </Section>

        <div className="rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-5">
          <div className="text-sm font-bold text-emerald-100">Related pages</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/council-system-card" className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-emerald-500/20">System / safety card →</a>
            <a href="/workbench-paper" className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">Architecture whitepaper →</a>
            <a href="/research-transparency" className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">Research & transparency →</a>
          </div>
          <p className="mt-4 text-[11px] text-emerald-300/50">Last reviewed 2026-07-12. This card is updated whenever the serving configuration changes materially — it is not a one-time launch document.</p>
        </div>
      </section>
    </div>
  );
}
