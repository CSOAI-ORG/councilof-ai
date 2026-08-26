/**
 * SpectrumView — 8-lens spectrum display.
 *
 * Each lens is an independent measurement axis. No composite score.
 * The differentiator is highlighted (highest delta at lowest cost).
 */

interface Lens {
  id: string;
  name: string;
  score: number | null;
  n: number;
  cost: number;
  differentiator?: boolean;
  tag: "[MEASURED]" | "[LEAD]" | "[GREENFIELD]" | "[INCOMPLETE]";
}

const LENSES: Lens[] = [
  { id: "protection", name: "Protection (deterministic gate) — REFUTED", score: -20.0, n: 6, cost: 0.011, tag: "[MEASURED]" },
  { id: "composition", name: "Composition gain", score: 12.21, n: 195, cost: 0.003, tag: "[MEASURED]" },
  { id: "kb-exact", name: "KB exact-match", score: 19.64, n: 14, cost: 0.002, differentiator: true, tag: "[MEASURED]" },
  { id: "care-cost", name: "Care_cost", score: 0.667, n: 7, cost: 0.001, tag: "[MEASURED]" },
  { id: "provbench", name: "ProvBench durability (%)", score: 17.14, n: 105, cost: 0, tag: "[MEASURED]" },
  { id: "pqc", name: "PQC signing", score: null, n: 1, cost: 0, tag: "[MEASURED]" },
  { id: "cross-model", name: "Cross-model spread", score: 40.0, n: 4, cost: 0.008, tag: "[MEASURED]" },
  { id: "greenfield", name: "Greenfield coverage", score: null, n: 0, cost: 0, tag: "[GREENFIELD]" },
];

const TAG_BADGE: Record<Lens["tag"], string> = {
  "[MEASURED]": "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  "[LEAD]": "border-amber-400/40 bg-amber-500/10 text-amber-200",
  "[GREENFIELD]": "border-emerald-500/25 bg-emerald-500/5 text-emerald-100/60",
  "[INCOMPLETE]": "border-amber-400/40 bg-amber-500/10 text-amber-200",
};

export function SpectrumView() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-emerald-50">8-lens spectrum</h2>
      <p className="mt-1 text-[13px] text-emerald-100/60">
        Each lens is an independent measurement. No composite score — ever.
        The most robust survivor is highlighted; refuted claims stay on the board.
      </p>
      <div className="mt-4 grid gap-2">
        {LENSES.map((lens) => (
          <div
            key={lens.id}
            className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 rounded-lg border px-3 py-2.5 ${
              lens.differentiator
                ? "border-amber-400/50 border-l-2 bg-amber-400/5"
                : "border-emerald-500/20 bg-[#05140d]"
            }`}
          >
            <span className={`font-mono text-[13px] ${lens.differentiator ? "font-semibold text-emerald-50" : "text-emerald-100/80"}`}>
              {lens.name}
              {lens.differentiator && (
                <span className="ml-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                  differentiator
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
        ))}
      </div>
      <p className="mt-2 text-[11px] text-emerald-100/60">
        The protection (deterministic-gate) lens once read +34.84 (n=31) and was our largest
        published number. Re-measured on one self-consistent run it fires 6 times, not 31, at
        −20.00 [−65.26, +25.26] (n=6) — the +34.84 was overfitting to its own battery, now
        refuted in the ledger. KB exact-match (+19.64, n=14) survived and is the most robust.
        Every n&lt;20 labelled lower bound.
      </p>
    </section>
  );
}
