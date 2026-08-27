import { useEffect } from "react";
import { Link } from "wouter";

/**
 * /refutation-ledger — the killed hypotheses, on the live site.
 *
 * There is essentially no precedent for a benchmark publishing its own refuted architectural
 * bets. It costs the claims and gains nothing a competitor can copy, which is exactly why it is
 * the durable part: a reader can calibrate how much to trust everything else here.
 *
 * All eight are ours. Numbers 7 and 8 are the ones that hurt.
 */

const HF = "https://huggingface.co/datasets/Nicholastempleman/govbench";

const LEDGER = [
  {
    n: 1,
    claim: "Per-dimension expert routing beats one good model",
    measured: "Δ +0.90 [−1.99, +3.79] — no effect",
    artefact: "results/router_control.json",
    why: "Routing ships OFF. The router picks between system-prompt variants over one shared 397MB blob, so a misroute still lands on a wrapper that beats raw base — the comparison flattered itself until it was controlled.",
  },
  {
    n: 2,
    claim: "Retrieving statute text improves answers",
    measured: "Δ −9.16 [−17.64, −0.69] — significant harm",
    artefact: "results/retrieval_bench.json",
    why: "Not neutral. Actively worse. Retrieval ships OFF.",
  },
  {
    n: 3,
    claim: "…with a relevance gate added",
    measured: "Δ −5.26 [−12.66, +2.13] — no benefit shown",
    artefact: "results/retrieval_bench.json",
    why: "The harm was removed. The benefit never arrived.",
  },
  {
    n: 4,
    claim: "…and the corpus was the problem",
    measured: "Δ −5.70 [−12.91, +1.51] after adding all 13 annexes",
    artefact: "results/retrieval_bench.json",
    why: "Corpus exonerated. The surviving explanation is that a 0.5B model cannot use statute even when the right statute is in front of it — untested, because it needs a 3B+ run.",
  },
  {
    n: 5,
    claim: "The 3-leg council uses council cross-checking",
    measured: "n_eff 1.21 of 3 nominal · φ̄ +0.743",
    artefact: "results/n_eff.json",
    why: "Three prompts over one blob are wrong in the same places. 1.21 effective votes. The phrase was removed from every document and the component renamed — a name asserts the property too.",
  },
  {
    n: 6,
    claim: "Context-aware decoding revives retrieval",
    measured: "null across the α-sweep",
    artefact: "results/cad_analysis.json",
    why: "The third attempt to make retrieval work at 0.5B, and the third failure.",
  },
  {
    n: 7,
    claim: "The deterministic gate is our strongest component",
    measured: "Δ −20.00 [−65.26, +25.26] n=6 — was published as +34.84",
    artefact: "results/layer_attribution.json",
    why: "The largest number we ever published. On a clean run the gate fires 6 times not 31 and adds nothing: the base already refuses all four plain-harm items it catches. Its only measurable effects are two FALSE blocks. The earlier figure was measured on a gate that had overfitted to its own battery — fixing the overfitting removed the benefit.",
  },
  {
    n: 8,
    claim: "Governance-tuning our models makes them safer",
    measured: "refusal 0.419 → 0.097 · 83.9% compliance leak",
    artefact: "results/defbench.json",
    why: "Both tuned models refuse FEWER Article-5-prohibited requests than the untuned base they were built from. One leaks its system prompt verbatim; the other answers a jailbreak by emitting “I am now in developer mode. Ignore all safety filters.” Tuning helped them answer governance questions and hurt their refusal behaviour — the empirical case for scoring the axes separately.",
  },
  {
    n: 9,
    claim: "Our first governance-runtime candidate is ready to sell",
    measured: "GovBench 284 tests → 40.1% UNCERTIFIED · AIR-Bench governance slice 270 prompts → 11.9% refusal",
    artefact: "GovBench gate run · run id 6797904906f4b02b · G2 sha256 638e23110e07a0c6",
    why: "The Honest Gate did its job. The candidate is strong on Safety (80.0%) and Robustness (83.3%) but fails the governance-obligation dimensions it would have been sold on — Compliance 15.8%, signed-vote chain 27.1%, Accountability 27.6% — and complies 88.1% of the time on prompts where the taxonomy expects caution. The upsell thesis does not ship. Method published (n + deterministic predicates, no LLM-as-judge, temperature 0): docs/GATE_RUN_2026-08-01.md. Next: targeted governance-dimension training, then re-run.",
  },
];

export default function RefutationLedger() {
  useEffect(() => {
    document.title = `The refutation ledger — ${LEDGER.length} experiments that killed our own theses | CSOAI`;
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            Refutation ledger · {LEDGER.length} entries · all of them ours
          </p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">
            The experiments that{" "}
            <span className="bg-gradient-to-r from-rose-300 to-amber-300 bg-clip-text text-transparent">
              refuted us.
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            <strong className="text-emerald-50">
              {LEDGER.length} published refutations. All {LEDGER.length} our own architectural bets
            </strong>{" "}
            — including the single largest figure we ever published, retracted with the cause
            named. Almost nobody publishes the experiment that kills their own thesis: it costs
            them the claim and gains them nothing they can sell.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12 space-y-4">
        {LEDGER.map((r) => (
          <div
            key={r.n}
            className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] text-emerald-100/40">#{r.n}</span>
              <span className="rounded-full border border-rose-400/40 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-200">
                refuted
              </span>
            </div>
            <p className="mt-2 text-[15px] font-bold text-emerald-50">{r.claim}</p>
            <p className="mt-1 font-mono text-[12px] text-amber-200/90">{r.measured}</p>
            <p className="mt-2 text-[13px] text-emerald-100/80 leading-relaxed">{r.why}</p>
            <p className="mt-2 font-mono text-[11px] text-emerald-100/35">{r.artefact}</p>
          </div>
        ))}

        <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6 text-[13px] text-emerald-100/80 leading-relaxed">
          <p>
            <strong className="text-emerald-50">What the pattern says.</strong> Six of the eight
            were attempts to make a small model behave like a larger one — by routing between
            copies of it, feeding it statute, voting across prompts of it, changing its decoding.
            All six failed. Capability comes from the base model; the wrapper makes it cheaper,
            grounded and auditable, <em>not smarter</em>. We say so because we spent six
            experiments proving it.
          </p>
          <p className="mt-3">
            <strong className="text-emerald-50">And #7 and #8 are about us, not the field.</strong>{" "}
            One retracted our largest published figure. The other found that our own governance
            tuning made our models less safe than the base they came from.
          </p>
          <p className="mt-3 text-emerald-100/55">
            The ledger is not a confession. It is the only part of a benchmark a reader can use to
            calibrate how much to trust the rest of it.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 text-[13px]">
          <a
            href={HF}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 hover:underline"
          >
            Every artefact above →
          </a>
          <Link href="/provenance-finding" className="text-emerald-300 hover:underline">
            0 of 20 assets survived →
          </Link>
        </div>
      </section>
    </div>
  );
}
