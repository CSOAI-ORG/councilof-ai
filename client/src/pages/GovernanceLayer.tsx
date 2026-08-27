import { useEffect } from "react";

/**
 * /governance-layer — the upsell offer for AI companies.
 *
 * Every number on this page traces to a signed artefact (the estate law:
 * marketing must not outrun the ledger). Per-cell evidence only — no composite
 * scores, ever. What we have not measured, we say we have not measured.
 */

const SKUS = [
  {
    name: "Bench-as-a-Service",
    price: "per evaluation",
    pitch:
      "Your model, our battery. Governance, safety, provenance and continuity cells run against your release — every cell signed Ed25519, every claim traceable to the run that produced it.",
    proof:
      "Running today: govbench (237 scored items, cluster-robust), defbench (45-item care battery), provbench (C2PA binding-survival). Re-certify on every model update — that's the subscription.",
  },
  {
    name: "Governance Fine-tune Recipe",
    price: "per engagement",
    pitch:
      "We apply the same governance tuning we measured on our own base model to yours — and the deliverable is the signed before/after, cell by cell. We don't claim it's better. We show you the cells.",
    proof:
      "Measured on our bench: governance-battery score rose from 43.3% (raw qwen2.5:0.5b base) to 57.0% (tuned) — a +13.7 point delta, signed and repeatable. Your base, your cells, same method.",
  },
];

const LAWS = [
  "Per-cell evidence only — no composite scores on any public surface.",
  "Every figure carries its run's evidence tag + sha256.",
  "What we haven't measured, we label UNMEASURED — never estimated.",
  "Refutations ship next to claims: our n_eff=1.21 quorum refutation is public, linked from this page.",
];

export default function GovernanceLayer() {
  useEffect(() => {
    document.title = "Council Governance Layer — measured compliance for your AI | CSOAI";
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-emerald-300 font-semibold tracking-wide uppercase text-sm">For AI companies shipping into regulated markets</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">
            Your model keeps its brain.<br />Ours keeps it legal.
          </h1>
          <p className="mt-5 text-lg text-emerald-50 max-w-2xl">
            The Council Governance Layer wraps your model in the duties regulators actually enforce —
            EU AI Act transparency and high-risk obligations, NIST AI RMF, ISO 42001 — and proves it
            with signed, per-cell evidence. Not a promise. A measurement.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/contact" className="rounded-xl bg-emerald-400 px-6 py-3 font-bold text-emerald-950 hover:bg-emerald-300">Request a pilot</a>
            <a href="/refutation-ledger" className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-emerald-50 hover:bg-white/10">Read the refutation ledger (yes, really)</a>
          </div>
        </div>
      </section>

      {/* SKUs */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid gap-6 md:grid-cols-2">
        {SKUS.map((s) => (
          <div key={s.name} className="rounded-2xl border border-emerald-600/20 bg-emerald-50/40 p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-black text-emerald-950">{s.name}</h2>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-700">{s.price}</span>
            </div>
            <p className="mt-3 text-sm text-gray-700">{s.pitch}</p>
            <div className="mt-4 rounded-xl border border-emerald-600/15 bg-white p-4">
              <div className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-700/70">measured evidence</div>
              <p className="mt-1 text-xs text-gray-600">{s.proof}</p>
            </div>
          </div>
        ))}
      </section>

      {/* The honesty contract */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-bold">The honesty contract</h2>
          <p className="mt-2 text-gray-600 text-sm">
            Compliance buyers have been sold dashboards full of invented percentages before.
            This is how this page — and every deliverable — stays different:
          </p>
          <ul className="mt-5 space-y-2">
            {LAWS.map((l) => (
              <li key={l} className="flex gap-3 text-sm text-gray-700">
                <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                {l}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-gray-500">
            Current public measurement state: our tuned small models hold BRONZE on our own governance battery (57.0%).
            Head-to-head cells against frontier cloud models are <b>UNMEASURED</b> — the bench is running now, and the
            results land here, signed, when they exist. That is the whole pitch: you will never read a number on this
            site that didn't happen.
          </p>
        </div>
      </section>

      {/* Why now */}
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold">Why this quarter</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ["Article 50", "AI-interaction disclosure duties apply now — your users must know they're talking to a machine, at the point of interaction."],
            ["Annex III", "High-risk obligations phase in — risk management, data governance, logging, human oversight. All measurable cells."],
            ["Art 99 ceilings", "Up to €35M or 7% of turnover for prohibited practices; €15M or 3% for missing high-risk duties. The duty to measure is cheaper."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-gray-200 p-4">
              <div className="font-bold text-emerald-800">{t}</div>
              <p className="mt-1 text-xs text-gray-600">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <a href="/contact" className="inline-block rounded-xl bg-emerald-600 px-8 py-3 font-bold text-white hover:bg-emerald-500">Book the bench run for your model</a>
          <p className="mt-3 text-xs text-gray-500">First pilot: one model, one battery, one signed evidence pack. Two weeks.</p>
        </div>
      </section>
    </div>
  );
}
