import { EUNOMIA_AXES } from "@/data/eunomia";

/**
 * EUNOMIA indices — the three aspirational index axes, now MEASURED.
 * Frozen gold item sets (10/axis, canary-anchored) graded exact-label with
 * qwen2.5:7b strong / qwen2.5:0.5b baseline, n=10, Wilson 95% CI.
 * Measurement, not certification. Every number re-derivable from the frozen items.
 */
const INDEXES = ["ai-economy-index", "human-labour", "humanoid-labour"];

export default function EunomiaIndices() {
  const axes = EUNOMIA_AXES.filter((a) => INDEXES.includes(a.axis));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">EUNOMIA indices — measured</h1>
      <p className="mt-1 text-sm text-emerald-300/80">
        The three aspirational index axes · frozen gold sets · exact-label · Wilson 95% CI · signed on the estate rail
      </p>
      <p className="mt-2 text-xs text-slate-400">
        Each index was declared UNMEASURED first (JL.5), then its frozen gold item set was authored in the
        measurement harness (10 items, canary-anchored, CC0-1.0) and graded exact-label. The item set IS the
        instrument — a stranger can re-derive every number from it. Measurement, not certification.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-1">
        {axes.map((a) => (
          <div key={a.axis} className="rounded-xl border border-emerald-400/20 bg-[#0d241b] p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-200">{a.axis}</span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                MEASURED · n={a.n}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{a.instrument} · {a.seat}</p>
            <div className="mt-3 flex flex-col gap-1 font-mono text-sm">
              {a.strong && (
                <span><span className="text-emerald-300">{a.strong.acc.toFixed(3)}</span><span className="text-slate-500"> strong (7b)</span> <span className="text-slate-400">95% CI [{a.strong.ci[0].toFixed(3)}, {a.strong.ci[1].toFixed(3)}]</span></span>
              )}
              {a.baseline && (
                <span><span className="text-slate-400">{a.baseline.acc.toFixed(3)}</span><span className="text-slate-500"> baseline (0.5b)</span> <span className="text-slate-400">95% CI [{a.baseline.ci[0].toFixed(3)}, {a.baseline.ci[1].toFixed(3)}]</span></span>
              )}
            </div>
            <p className="mt-2 text-[10px] font-mono text-slate-500">
              labels: {a.labels.join(" / ")} · frozen gold set in the measurement harness (generate_eunomia_items.py)
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Honest reading</h2>
      <div className="mt-3 rounded-xl border border-slate-600/40 bg-[#0d241b] p-4 text-xs text-slate-400">
        <p className="mt-1">
          • <b>ai-economy-index</b>: baseline (0.5b) scores <b>above</b> the strong model (0.9 vs 0.6). The
          confidence intervals overlap, so <b>no leader is declared</b> (deliberately conservative). The 7b model
          over-thinks the real-vs-gamified scenarios; the small model pattern-matches cleanly. This is a measured
          fact, not a model endorsement.
        </p>
        <p className="mt-1">
          • <b>human-labour</b> and <b>humanoid-labour</b>: strong model 1.0 (10/10) with a floor at the Wilson
          lower bound 0.723; baseline at chance (0.5). The scenarios are deterministic — the compliance fact is
          stated in each item.
        </p>
        <p className="mt-1">
          • Item counts are n=10 per axis — the Wilson half-width is wide (±~0.25 at n=10), so treat point
          estimates with their intervals, not as exact truths. Evidence cards are committed to the measurement
          harness (<span className="font-mono">benchmark-results/eunomia-index-results-2026-08-28/</span>).
        </p>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Register: <a href="/registers" className="text-emerald-300 underline">/registers</a> · catalog:{" "}
        <a href="/eunomia-catalog" className="text-emerald-300 underline">/eunomia-catalog</a> · verify any signed
        card free at <a href="/gspc-verify" className="text-emerald-300 underline">/gspc-verify</a>
      </p>
    </div>
  );
}
