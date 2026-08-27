import { useEffect, useState } from "react";
import {
  countOf, fetchAxes, hasInterval, publicCaption, quotable,
  type AxesState, type InLaneAxis,
} from "@/lib/gspcAxes";
import { FOCUS, MEASURE, SP, SURFACE, TYPE } from "./glass";

/**
 * LivingBoard — every published GSPC axis, live from GET /api/gspc.
 *
 * Board rows and in-lane rows are never mixed. Slot counts are not typed here;
 * the caption is totals.public_count. Empty / unearned cells stay empty.
 */

const EMPTY: Pick<AxesState, "axis" | "source" | "measuredOn" | "publicCount" | "inLane" | "loading"> = {
  axes: [],
  source: "snapshot",
  measuredOn: "",
  inLane: [],
  loading: true,
};

export default function LivingBoard({
  onOpenBoard,
  embedded,
}: {
  onOpenBoard: () => void;
  /** When true, hide the “open full board” CTA — already inside the board pane. */
  embedded?: boolean;
}) {
  const [state, setState] = useState(EMPTY);

  useEffect(() => {
    const ac = new AbortController();
    fetchAxes(ac.signal).then((r) => setState({ ...r, loading: false }));
    return () => ac.abort();
  }, []);

  const c = countOf(state.axes);
  const caption = publicCaption(state.publicCount, c.measured, c.total);

  return (
    <section aria-labelledby="coai-living-board-h" className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={TYPE.section}>Living board</p>
          <h3 id="coai-living-board-h" className="mt-1 text-[20px] font-semibold tracking-tight text-slate-900">
            Every published axis
          </h3>
          <p className={`mt-2 ${MEASURE} ${TYPE.body}`}>
            {state.loading
              ? "Reading GET /api/gspc…"
              : state.source === "wire"
                ? caption
                : "Live board unreachable — this build's snapshot. Empty cells stay empty."}
          </p>
        </div>
        {!embedded && (
          <button
            type="button"
            onClick={onOpenBoard}
            className={`rounded-xl bg-emerald-700 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-800 motion-reduce:transition-none ${FOCUS}`}
          >
            Open the full board
          </button>
        )}
      </div>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {state.axes.map((a) => {
          const scored = quotable(a);
          return (
            <li key={a.axis}>
              <button
                type="button"
                onClick={onOpenBoard}
                className={`${SURFACE} ${SP.card} flex h-full w-full flex-col items-start bg-white/85 text-left transition hover:bg-white motion-reduce:transition-none ${FOCUS}`}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-semibold text-slate-900">{a.axis}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${
                    scored ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    {a.status}
                  </span>
                </span>
                <span className={`mt-1 ${TYPE.fine}`}>{a.bench || a.task}</span>
                {scored ? (
                  <span className="mt-2 font-mono text-[13px] tabular-nums text-emerald-800">
                    {(a.accuracy * 100).toFixed(0)}
                    <span className="ml-1 text-[11px] text-slate-600">
                      n={a.n}{hasInterval(a) ? "" : " · no interval"}
                    </span>
                  </span>
                ) : (
                  <span className={`mt-2 ${TYPE.fine}`}>no score on this stamp</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {state.inLane.length > 0 && (
        <InLaneStrip rows={state.inLane} />
      )}
    </section>
  );
}

function InLaneStrip({ rows }: { rows: InLaneAxis[] }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-slate-900/15 bg-slate-50/80 p-4">
      <p className={TYPE.section}>In-lane — not board rows</p>
      <p className={`mt-1 ${TYPE.muted}`}>
        Published beside the board. Not counted in totals.public_count.
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.map((r) => (
          <li key={r.axis} className="rounded-xl border border-slate-900/8 bg-white/90 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-slate-900">{r.axis}</span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-wide text-slate-600">{r.status}</span>
            </div>
            <p className={`mt-1 ${TYPE.fine}`}>{r.bench || r.task}</p>
            {r.n > 0 && (
              <p className="mt-2 font-mono text-[12px] tabular-nums text-slate-700">
                {typeof r.accuracy === "number" && Number.isFinite(r.accuracy)
                  ? (r.accuracy * 100).toFixed(0)
                  : "unmeasured"} · n={r.n}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
