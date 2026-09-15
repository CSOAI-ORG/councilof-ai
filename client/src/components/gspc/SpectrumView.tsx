/**
 * SpectrumView — the eight-lens research record.
 *
 * Each lens is an independent, dated experiment. No composite score. These are
 * NOT the board's current production method: the board is GET /api/gspc, with
 * its own rows, methods and sample rules. Every row here is labelled with what
 * it is — a historical experiment, a worked illustration, a refuted claim or a
 * capability that is planned and not built — so a reader can tell a small-n
 * research figure from a production measurement and from a rechecked artifact.
 */

type LensKind =
  | "historical experiment"
  | "illustrative arithmetic"
  | "refuted claim"
  | "planned capability";

interface Lens {
  id: string;
  name: string;
  score: number | null;
  n: number;
  cost: number;
  differentiator?: boolean;
  tag: "[MEASURED]" | "[LEAD]" | "[GREENFIELD]" | "[INCOMPLETE]" | "[REFUTED]";
  kind: LensKind;
  /** Where the figure came from, in one line. Dates are the experiment's, not today's. */
  basis: string;
}

const LENSES: Lens[] = [
  {
    id: "protection",
    name: "Protection (deterministic gate)",
    score: -20.0,
    n: 6,
    cost: 0.011,
    tag: "[REFUTED]",
    kind: "refuted claim",
    basis: "Once +34.84 (n=31); re-measured on one self-consistent run at −20.00 [−65.26, +25.26] (n=6). Overfitting to its own battery; in the refutation ledger.",
  },
  {
    id: "composition",
    name: "Composition gain",
    score: 12.21,
    n: 195,
    cost: 0.003,
    tag: "[MEASURED]",
    kind: "historical experiment",
    basis: "A dated research run; not a board row. Units: percentage-point delta over the base model.",
  },
  {
    id: "kb-exact",
    name: "KB exact-match",
    score: 19.64,
    n: 14,
    cost: 0.002,
    differentiator: true,
    tag: "[MEASURED]",
    kind: "historical experiment",
    basis: "Survived re-measurement; n=14 is below the n≥30 board floor, so it is a lower bound, not a board figure.",
  },
  {
    id: "care-cost",
    name: "Care_cost",
    score: 0.667,
    n: 7,
    cost: 0.001,
    tag: "[INCOMPLETE]",
    kind: "illustrative arithmetic",
    basis: "The worked example above: 0.667 × (1 − 0.00) on a 7-item seed set. Not a measurement of any named model; the measured care axis and its real n are on the board.",
  },
  {
    id: "provbench",
    name: "ProvBench durability (%)",
    score: 17.14,
    n: 105,
    cost: 0,
    tag: "[MEASURED]",
    kind: "historical experiment",
    basis: "A dated provenance-durability run; superseded for public ranking by the board's provenance row.",
  },
  {
    id: "pqc",
    name: "PQC signing",
    score: null,
    n: 1,
    cost: 0,
    tag: "[INCOMPLETE]",
    kind: "planned capability",
    basis: "No PQC signer or runtime is built or published (claims register CR-006); ML-DSA-65 is scaffolded only. The single n is a scaffold check, not a measurement.",
  },
  {
    id: "cross-model",
    name: "Cross-model spread",
    score: 40.0,
    n: 4,
    cost: 0.008,
    tag: "[MEASURED]",
    kind: "historical experiment",
    basis: "Four models on one dated run; a lower bound on spread, never a ranking.",
  },
  {
    id: "greenfield",
    name: "Greenfield coverage",
    score: null,
    n: 0,
    cost: 0,
    tag: "[GREENFIELD]",
    kind: "planned capability",
    basis: "No run exists. The empty cell is the finding.",
  },
];

const TAG_BADGE: Record<Lens["tag"], string> = {
  "[MEASURED]": "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  "[LEAD]": "border-amber-400/40 bg-amber-500/10 text-amber-200",
  "[GREENFIELD]": "border-emerald-500/25 bg-emerald-500/5 text-emerald-100/60",
  "[INCOMPLETE]": "border-amber-400/40 bg-amber-500/10 text-amber-200",
  "[REFUTED]": "border-rose-400/40 bg-rose-500/10 text-rose-200",
};

const KIND_BADGE: Record<LensKind, string> = {
  "historical experiment": "border-sky-400/40 bg-sky-500/10 text-sky-200",
  "illustrative arithmetic": "border-slate-400/40 bg-slate-500/10 text-slate-200",
  "refuted claim": "border-rose-400/40 bg-rose-500/10 text-rose-200",
  "planned capability": "border-amber-400/40 bg-amber-500/10 text-amber-200",
};

export function SpectrumView() {
  return (
    <section aria-labelledby="eight-lens-h" data-testid="eight-lens-record">
      <h2 id="eight-lens-h" className="text-2xl font-bold text-emerald-50">Eight-lens research record</h2>
      <p className="mt-1 text-[13px] text-emerald-100/60">
        Dated experiments, kept on the page with their labels. Each lens is an independent
        figure — no composite score, ever. None of these is the board&apos;s current production
        method: the board is GET /api/gspc, and its rows carry their own method, n and interval.
        Every entry says whether it is a historical experiment, a worked illustration, a refuted
        claim or a planned capability.
      </p>
      <div className="mt-4 grid gap-2">
        {LENSES.map((lens) => (
          <div
            key={lens.id}
            className={`rounded-lg border px-3 py-2.5 ${
              lens.differentiator
                ? "border-amber-400/50 border-l-2 bg-amber-400/5"
                : "border-emerald-500/20 bg-[#05140d]"
            }`}
          >
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4">
              <span className={`font-mono text-[13px] ${lens.differentiator ? "font-semibold text-emerald-50" : "text-emerald-100/80"}`}>
                {lens.name}
                {lens.differentiator && (
                  <span className="ml-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                    most robust survivor
                  </span>
                )}
              </span>
              <span className="font-mono text-[13px] tabular-nums text-emerald-100/80">
                {lens.score !== null ? lens.score.toFixed(2) : "—"}
              </span>
              <span className="font-mono text-[11px] text-emerald-100/60">
                n={lens.n}
                {lens.n > 0 && lens.n < 20 && (
                  <span className="ml-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                    lower bound
                  </span>
                )}
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${TAG_BADGE[lens.tag]}`}>
                {lens.tag}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-emerald-100/60">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${KIND_BADGE[lens.kind]}`}>
                {lens.kind}
              </span>
              <span>{lens.basis}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-emerald-100/60">
        The protection (deterministic-gate) lens once read +34.84 (n=31) and was our largest
        published number. Re-measured on one self-consistent run it fires 6 times, not 31, at
        −20.00 [−65.26, +25.26] (n=6) — the +34.84 was overfitting to its own battery, now
        refuted in the ledger. KB exact-match (+19.64, n=14) survived and is the most robust.
        Every n&lt;20 labelled lower bound. A content-addressed result or an independently
        rechecked artifact is a different thing again: those live on the board and in the signed
        card index, not in this research record.
      </p>
    </section>
  );
}
