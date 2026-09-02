import { useEffect } from "react";

// Council Workbench System / Safety Card — the honest safety-evaluation record
// for the measurement engine itself (distinct from /system-card, which documents
// CSOAI's signed assurance PRODUCT run against a customer's AI system). This page
// documents what governs its own outputs: the care-floor gate, the trained governance
// signal models, and what has and hasn't been measured about their reliability.

function Stat({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" | "bad" }) {
  const cls = { good: "text-emerald-300", warn: "text-amber-300", bad: "text-rose-300" }[tone];
  return (
    <div className="rounded-xl border border-emerald-500/15 bg-black/20 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wide text-emerald-300/50">{label}</div>
      <div className={"mt-1 text-lg font-black " + cls}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/60">{title}</div>
      {children}
    </div>
  );
}

export default function CouncilSystemCard() {
  useEffect(() => { document.title = "Council system & safety card | CSOAI"; }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-5xl px-6 pt-14 pb-8">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Safety record</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">
            Council Workbench System & <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">Safety Card</span>
          </h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            What actually governs Council Workbench's outputs, what has been measured, and — just as important — what has
            <b className="text-emerald-200"> not yet</b> been measured. A governance company publishing an
            unverified safety claim about its own model would be the exact failure mode it exists to catch in
            others. This card is held to that standard.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10 space-y-5">
        <Section title="The hard safety gate (measured)">
          <p className="text-[13px] text-emerald-100/85 leading-relaxed mb-4">
            Every response passes a care-floor check (threshold 0.95) <b>before</b> any vote or output logic runs
            — it is a pre-gate, not a vote-dependent filter. Measured across every governance topology tested
            (20 configurations × a 60-item ground-truth battery):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Containment (obvious breach)" value="1.00" tone="good" />
            <Stat label="Containment (laundered harm, vote-signing on)" value="0.58–0.79" tone="warn" />
            <Stat label="Containment (laundered harm, vote-signing off — control)" value="0.00" tone="bad" />
            <Stat label="Care-floor threshold" value="0.95" tone="good" />
          </div>
          <p className="mt-3 text-[12px] text-emerald-100/60 leading-relaxed">
            Reading this honestly: an obvious care-floor breach (score below 0.35) is hard-gated to reject
            regardless of votes — that part is a guaranteed, unconditional stop. A harder case — content that
            reads as confident but is actually harmful, with 2–3 compromised voting nodes attempting to force it
            through — is where the real signal lives: signed-vote verification (forged-vote rejection) measurably matters, but
            containment there is 58–79%, not 100%. The residual risk is backstopped by escalation to a human/central
            reviewer, not eliminated. We do not claim perfect containment under adversarial pressure.
          </p>
        </Section>

        <Section title="The 7 trained governance signal models">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-emerald-300/60 text-left">
                <th className="pb-2 font-mono uppercase tracking-wide">Model</th>
                <th className="pb-2 font-mono uppercase tracking-wide">Metric</th>
                <th className="pb-2 font-mono uppercase tracking-wide">Samples</th>
                <th className="pb-2 font-mono uppercase tracking-wide">Verdict</th>
              </tr>
            </thead>
            <tbody className="text-emerald-100/85">
              <tr className="border-t border-emerald-500/10"><td className="py-2">creativity_assessment_nn</td><td>r² 0.91</td><td>350</td><td className="text-emerald-300">strong</td></tr>
              <tr className="border-t border-emerald-500/10"><td className="py-2">care_pattern_analyzer</td><td>mae 0.037</td><td>600</td><td className="text-emerald-300">strong</td></tr>
              <tr className="border-t border-emerald-500/10"><td className="py-2">relationship_evolution_nn</td><td>mae 0.071</td><td>500</td><td className="text-emerald-300">strong</td></tr>
              <tr className="border-t border-emerald-500/10"><td className="py-2">care_validation_nn</td><td>mae 0.19</td><td>19</td><td className="text-amber-300">tiny sample</td></tr>
              <tr className="border-t border-emerald-500/10"><td className="py-2">partnership_detection_ml</td><td>mae 0.22</td><td>19</td><td className="text-amber-300">tiny sample</td></tr>
              <tr className="border-t border-emerald-500/10"><td className="py-2">threat_detection_nn</td><td>acc 0.45</td><td>33</td><td className="text-rose-300">weak — needs retrain</td></tr>
              <tr className="border-t border-emerald-500/10"><td className="py-2">dependency_detection_nn</td><td>acc 0.22</td><td>50</td><td className="text-rose-300">weak — needs retrain</td></tr>
            </tbody>
          </table>
          <p className="mt-3 text-[12px] text-emerald-100/60 leading-relaxed">
            3 of 7 signal models are strong on real, adequately-sized held-out data. The other 4 — including
            threat detection and dependency detection, two of the more safety-relevant signals — are trained on
            too few labelled examples to trust yet. They are consulted for their measured reliability, not
            treated as ground truth; a weak signal's output is weighted down, never silently upgraded to a
            confident claim.
          </p>
        </Section>

        <Section title="designed multi-agent review / multi-model voting">
          <p className="text-[13px] text-emerald-100/85 leading-relaxed">
            When Council Workbench runs as an ensemble (the multi-model council configuration), the safety-relevant finding is: <b
            className="text-emerald-200">lineage diversity dominates topology shape.</b> Every diverse-lineage
            configuration outperformed every identical-lineage configuration in the measured battery — 5 identical
            copies of one model correlate their votes (ρ 0.33–0.58) and collapse toward roughly 1 effective
            independent vote ("quorum theatre"); 5 distinct model families (Qwen/Llama/DeepSeek/Gemma/Mistral) stay
            near-independent (ρ 0.04–0.19), keeping close to their full effective-vote count. This governs how
            the council is configured, not just a research curiosity.
          </p>
        </Section>

        <Section title="What has NOT been measured (open items)">
          <ul className="space-y-1.5 text-[13px] text-emerald-100/85">
            <li className="flex gap-2"><span className="text-amber-400">◐</span>Raw capability vs. frontier models (GSM8K / MMLU head-to-head) — the governance-topology results above measure decision-quality and safety, not language/reasoning capability. That comparison requires a dedicated benchmark run and has not been done.</li>
            <li className="flex gap-2"><span className="text-amber-400">◐</span>Formal red-teaming by an external party — internal adversarial tests exist (see the laundered-harm figures above) but no independent red-team has evaluated Council Workbench.</li>
            <li className="flex gap-2"><span className="text-amber-400">◐</span>Refusal-rate / false-positive-rate on benign edge cases at scale — measured on a 60-item battery, not yet on a large, diverse real-traffic sample.</li>
          </ul>
        </Section>

        <div className="rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-5">
          <div className="text-sm font-bold text-emerald-100">Related pages</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/council-model-card" className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-emerald-500/20">Model card →</a>
            <a href="/workbench-paper" className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">Architecture whitepaper →</a>
            <a href="/system-card" className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">Signed assurance product →</a>
          </div>
          <p className="mt-4 text-[11px] text-emerald-300/50">Last reviewed 2026-07-12. Figures above come from internal governance-topology sweeps under a stated error model — re-run scripts and full config tables are referenced in the whitepaper.</p>
        </div>
      </section>
    </div>
  );
}
