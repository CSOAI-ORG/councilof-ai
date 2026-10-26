import { EUNOMIA_AXES } from "@/data/eunomia";
import { useBoardCount } from "@/lib/boardCount";

/**
 * Financial-axis indices — three proposed index measures, none a signed result.
 * The living board (GET /api/gspc) carries cited component facts in their place
 * (ai-adoption-components, labour-components, humanoid-labour-index), each "not an index";
 * this page does not type their state. C-2026-0826-05: the MEASURED-INDEX-v0.1 sticker stays withdrawn.
 * A n=10 harness gold set exists as reference input only — not a living-board MEASURED stamp.
 * Measurement, not certification. Empty stays empty until a NEW signed card exists.
 */
const INDEXES = ["ai-economy-index", "human-labour", "humanoid-labour"];

export default function EunomiaIndices() {
  const axes = EUNOMIA_AXES.filter((a) => INDEXES.includes(a.axis));
  // Derived from GET /api/gspc — this line used to carry a typed count and it rotted.
  const board = useBoardCount();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">Financial-axis indices — UNMEASURED as indices</h1>
      <p className="mt-1 text-sm text-emerald-300/80">
        Three proposed index measures · living board GET /api/gspc is authority · {board.public_count}
        {!board.live && " (last recorded observation — the endpoint wins)"}
      </p>
      <p className="mt-2 text-xs text-slate-400">
        None of these three is measured as an index, and none is a signed result. The living board does
        not carry them as indices: in their place it carries cited component facts (ai-adoption-components,
        labour-components, humanoid-labour-index), each stated on its row as not an index. Read those rows&apos;
        current state on GET /api/gspc. C-2026-0826-05 stands: MEASURED-INDEX-v0.1 was an over-claim, and the
        v0.1 sticker stays withdrawn. A n=10 harness gold set exists as a reference input only. Empty stays
        empty until missing series + formula are published and a NEW signed card exists.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-1">
        {axes.map((a) => (
          <div key={a.axis} className="rounded-xl border border-emerald-400/20 bg-[#0d241b] p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-200">{a.axis}</span>
              <span className="rounded-full border border-slate-500/40 bg-slate-500/10 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                UNMEASURED · not board-quotable
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{a.instrument} · {a.seat}</p>
            <div className="mt-3 flex flex-col gap-1 font-mono text-sm">
              {a.strong && (
                <span><span className="text-slate-300">{a.strong.acc.toFixed(3)}</span><span className="text-slate-500"> harness strong (7b)</span> <span className="text-slate-400">95% CI [{a.strong.ci[0].toFixed(3)}, {a.strong.ci[1].toFixed(3)}] — reference input, not MEASURED</span></span>
              )}
              {a.baseline && (
                <span><span className="text-slate-400">{a.baseline.acc.toFixed(3)}</span><span className="text-slate-500"> harness baseline (0.5b)</span> <span className="text-slate-400">95% CI [{a.baseline.ci[0].toFixed(3)}, {a.baseline.ci[1].toFixed(3)}]</span></span>
              )}
            </div>
            <p className="mt-2 text-[10px] font-mono text-slate-500">
              labels: {a.labels.join(" / ")} · harness gold set is not a living-board cell (generate_eunomia_items.py)
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Honest reading</h2>
      <div className="mt-3 rounded-xl border border-slate-600/40 bg-[#0d241b] p-4 text-xs text-slate-400">
        <p className="mt-1">
          • Living board authority is GET /api/gspc. It carries component facts, not these indices. A harness
          n=10 run does not write MEASURED. Cite the board, not this page, for row status.
        </p>
        <p className="mt-1">
          • C-2026-0826-05: the MEASURED-INDEX-v0.1 sticker stays withdrawn. Eurostat / labour reference
          components are inputs, not an index.
        </p>
        <p className="mt-1">
          • Item counts n=10 are the harness gold set. Wilson half-width is wide. None of these numbers is a
          board-quotable accuracy.
        </p>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Register: <a href="/registers" className="text-emerald-300 underline">/registers</a> · catalog:{" "}
        <a href="/financial-catalog/" className="text-emerald-300 underline">/financial-catalog/</a> · verify any signed
        card free at <a href="/gspc-verify" className="text-emerald-300 underline">/gspc-verify</a>
      </p>
    </div>
  );
}
