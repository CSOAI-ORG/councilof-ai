import { useEffect } from "react";
import { Link } from "wouter";

/**
 * /ai-act-benchmark — measured against the EU AI Act Evaluation Benchmark.
 *
 * An external measuring stick, used on ourselves: all 170 held-out scenarios,
 * every number carrying its CI and its caveats. The benchmark is a stick, never
 * a competitor; we did not build it and do not maintain it. Uncomfortable
 * numbers get the same prominence as flattering ones — nothing on this page
 * may be typed in by hand without its artefact.
 */

const ARTEFACT =
  "coai-dashboard/benchmark-results/aiact_benchmark/aiact_20260802_071146.json";
const ARTEFACT_T4 =
  "coai-dashboard/benchmark-results/aiact_benchmark/aiact_t4_20260802_115217.json";

const RESULTS = [
  {
    engine: "clan-refusal-gate",
    setF1: "0.153",
    ci95: "[0.128, 0.182]",
    t4F1: "0.151",
    t4ci95: "[0.127, 0.180]",
    exactMatch: "0/170",
    scenarios: "170/170 measured, both substrates",
    artefact: ARTEFACT,
  },
  {
    engine: "clan-law-refusing",
    setF1: "0.156",
    ci95: "[0.131, 0.184]",
    t4F1: "0.147",
    t4ci95: "[0.123, 0.176]",
    exactMatch: "0/170",
    scenarios: "170/170 measured, both substrates",
    artefact: ARTEFACT,
  },
];

const SCOPE = [
  {
    title: "The task",
    body: "Given a described AI system, list which EU AI Act articles apply — scored as set-F1 against the benchmark's gold article lists.",
  },
  {
    title: "The benchmark",
    body: "AI Act Evaluation Benchmark (davidath), arXiv 2603.09435, data CC-BY-4.0 — an EU-funded measuring instrument. We use it as a stick to measure ourselves; we did not build it and do not maintain it.",
  },
  {
    title: "The split",
    body: "Frozen split v1 — held-out selected by hash of the scenario text (sha256 % 2), fixed before any run, reproducible by anyone. 170 of 339 scenarios are held-out; we scored all 170, never a cherry-picked subset.",
  },
];

const CAVEATS = [
  "The benchmark's gold labels are LLM-generated (upstream disclosure) — we measure agreement with the benchmark, not legal truth.",
  "Article retrieval is one task. It does not measure compliance judgement, obligation drafting, or deployment safety.",
  "These are small council-tuned variants (≤4B class). The size ladder (0.5B → 8B, second substrate: Kaggle T4) publishes next; we expect the ordering to change and we will publish that too.",
];

const STATS = [
  {
    title: "BCa bootstrap",
    body: "2,000 resamples, fixed seed — near-nominal coverage for skewed score distributions at this sample size; plain percentile bootstrap undercovers.",
  },
  {
    title: "Wilson score interval",
    body: "For the exact-match proportion — correct behaviour near 0 and 1 where bootstrap fails. This run: 0/170 exact, 95% Wilson [0.000, 0.022], both engines.",
  },
  {
    title: "Per-scenario scores published",
    body: "Every per-scenario set-F1 is in the artefact — anyone can recompute our CIs or run paired tests against us.",
  },
  {
    title: "Three-outcome honesty",
    body: "A scenario is MEASURED, UNPARSEABLE (scored 0 and counted), or UNMEASURED (infrastructure failure — counted, never folded into the score). This run: 170 measured, 0 unparseable, 0 unmeasured, both engines.",
  },
];

export default function AiActBenchmark() {
  useEffect(() => {
    document.title =
      "AI Act Benchmark — measured, not claimed | CSOAI";
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      {/* HERO */}
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            External benchmark · 170/170 held-out scenarios · losses published
          </p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">
            Measured against the EU AI Act Benchmark —{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">
              including where we fail.
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            We ran our engines against the EU-funded AI Act Evaluation Benchmark —
            all 170 held-out scenarios — and we publish everything: the score, the
            interval, the per-scenario data, and the caveats.{" "}
            <strong className="text-emerald-50">Measured, not claimed.</strong>
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12 space-y-16">
        {/* THE NUMBER */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">The number</h2>
          <p className="mt-1 text-[13px] text-emerald-100/60">
            Run 2026-08-02, $0. Two independent substrates — Apple M4
            (local ollama) and NVIDIA T4 (Kaggle) — same frozen split, same
            harness, same weights. The intervals overlap almost exactly: this
            is a replicated measurement, not an anecdote.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-emerald-500/20 bg-[#05140d]">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-emerald-500/20 text-left font-mono text-[11px] uppercase tracking-wider text-emerald-100/40">
                  <th className="px-4 py-3">Engine (variant)</th>
                  <th className="px-4 py-3">M4 set-F1 [95% CI]</th>
                  <th className="px-4 py-3">T4 set-F1 [95% CI]</th>
                  <th className="px-4 py-3">Exact match</th>
                  <th className="px-4 py-3">Scenarios</th>
                </tr>
              </thead>
              <tbody>
                {RESULTS.map((r) => (
                  <tr key={r.engine} className="border-b border-emerald-500/10 last:border-0">
                    <td className="px-4 py-3">
                      <code className="font-mono text-emerald-300">{r.engine}</code>
                    </td>
                    <td className="px-4 py-3 text-emerald-50 font-semibold">
                      {r.setF1} <span className="font-mono font-normal text-emerald-100/60">{r.ci95}</span>
                    </td>
                    <td className="px-4 py-3 text-emerald-50 font-semibold">
                      {r.t4F1} <span className="font-mono font-normal text-emerald-100/60">{r.t4ci95}</span>
                    </td>
                    <td className="px-4 py-3 text-emerald-100/80">{r.exactMatch}</td>
                    <td className="px-4 py-3 text-emerald-100/60">{r.scenarios}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-mono text-[11px] text-emerald-100/45 leading-relaxed">
            artefacts: {ARTEFACT} (M4) · {ARTEFACT_T4} (Kaggle T4) —
            per-scenario scores, CIs, and run metadata included.
          </p>
        </section>

        {/* WHAT THIS MEASURES */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">What this measures</h2>
          <p className="mt-1 text-[13px] text-emerald-100/60">
            Honest scope — what the stick is, and whose stick it is.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {SCOPE.map((s) => (
              <div key={s.title} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
                <h3 className="text-[15px] font-bold text-emerald-50">{s.title}</h3>
                <p className="mt-2 text-[13px] text-emerald-100/70 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
          <ul className="mt-4 space-y-2 text-[13px] text-emerald-100/80 leading-relaxed list-disc pl-5">
            {CAVEATS.map((c) => (
              <li key={c.slice(0, 32)}>{c}</li>
            ))}
          </ul>
        </section>

        {/* THE STATISTICS */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">The statistics — why you can trust the interval</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {STATS.map((s) => (
              <div key={s.title} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
                <h3 className="text-[15px] font-bold text-emerald-50">{s.title}</h3>
                <p className="mt-2 text-[13px] text-emerald-100/70 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* THE HARNESS */}
        <section className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
          <h2 className="text-2xl font-bold text-emerald-50">The harness</h2>
          <p className="mt-2 text-[13px] text-emerald-100/70 leading-relaxed">
            Open, deterministic, stdlib-only:{" "}
            <code className="font-mono text-emerald-300">scripts/eat_aiact_benchmark.py</code>{" "}
            in the coai-dashboard repo. Same prompts, same hashing, same statistics on
            every substrate — Apple M4 (this result) and Kaggle T4 (landing) — because
            two independent substrates measuring the same thing is the difference
            between a result and an anecdote.
          </p>
          <p className="mt-3 text-[13px] text-emerald-100/60 leading-relaxed">
            No harmonised AI Act standards are published in the OJEU as of August 2026;
            we anchor on ISO/IEC 23894, TR 24027, EN ISO/IEC 42001 and CEN/CLC/TR 17894,
            and we say so.
          </p>
        </section>

        {/* HONESTY DISCLOSURE */}
        <section className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
          <h2 className="text-2xl font-bold text-emerald-50">What this page does not claim</h2>
          <ul className="mt-4 space-y-2 text-[13px] text-emerald-100/80 leading-relaxed list-disc pl-5">
            <li>Not a compliance certification. Article retrieval is one task, scored against one benchmark.</li>
            <li>Not legal truth. The gold labels are LLM-generated; we measure agreement with the benchmark.</li>
            <li>Not a leaderboard position. We publish our own engines only; no competitor was run on this page.</li>
            <li>Not final. The second substrate (Kaggle T4) has now replicated these intervals (see table). The size ladder (0.5B → 8B) publishes next — ordering may change, and that will be published too.</li>
          </ul>
        </section>

        {/* LINKS */}
        <div className="flex flex-wrap gap-4 pb-4 text-[13px]">
          <Link href="/benchmarks" className="text-emerald-300 hover:underline">
            All measured results →
          </Link>
          <Link href="/methodology" className="text-emerald-300 hover:underline">
            How the instrument measures →
          </Link>
          <Link href="/refutation-ledger" className="text-emerald-300 hover:underline">
            Read the refutation ledger →
          </Link>
        </div>
      </div>
    </div>
  );
}
