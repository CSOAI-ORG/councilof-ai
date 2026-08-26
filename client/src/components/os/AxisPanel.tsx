import { useEffect, useState } from "react";
import {
  countOf, fetchAxes, hasInterval, hasMacroF1, publicCaption, quotable, wilson,
  type Axis, type AxisStatus, type InLaneAxis,
} from "@/lib/gspcAxes";

/**
 * AxisPanel — every published GSPC axis, live from GET /api/gspc.
 *
 * The invariant, enforced by `quotable()`: an axis shows a score ONLY when its
 * status is MEASURED. In-lane rows (slot15, human-vs-ai) stay in a separate
 * strip — they are not board rows and are not counted in totals.public_count.
 */

const TONE: Record<AxisStatus, string> = {
  MEASURED: "border-emerald-300 bg-emerald-50 text-emerald-700",
  UNMEASURED: "border-sky-300 bg-sky-50 text-sky-700",
  DRAFT: "border-amber-300 bg-amber-50 text-amber-700",
  SPEC: "border-violet-300 bg-violet-50 text-violet-700",
  PLANNED: "border-slate-300 bg-slate-100 text-slate-500",
};

function AxisCard({ a }: { a: Axis }) {
  const scored = quotable(a);
  const withCI = hasInterval(a);
  // `scored` guarantees a.accuracy is a real number — see quotable() in gspcAxes.
  const [lo, hi] = scored ? wilson(a.accuracy as number, a.n) : [0, 0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold text-slate-900">{a.axis}</div>
          <div className="font-mono text-[11px] text-slate-500">{a.bench}</div>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${TONE[a.status] ?? TONE.PLANNED}`}>
          {a.status}
        </span>
      </div>

      {scored ? (
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-emerald-600">{(a.accuracy as number).toFixed(3)}</span>
            <span className="text-[11px] text-slate-500">accuracy · n={a.n}</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-slate-500">
            {/* No macro F1 published (jail, swarm) prints nothing — never 0.000. */}
            {hasMacroF1(a) ? `macro F1 ${(a.macro_f1 as number).toFixed(3)}` : "no macro F1 published"}
            {withCI
              ? ` · Wilson 95% [${lo.toFixed(3)}, ${hi.toFixed(3)}]`
              : " · n<30 usable — no interval"}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          {/* Two different absences, and they are not the same fact. An axis with
              a bank but no accuracy (provenance-controls: MEASURED, n=6, a mainnet
              read, not a model comparison) is not an axis with no bank at all. */}
          <div className="text-sm font-medium text-slate-500">
            {a.status === "MEASURED" && a.n > 0 ? "Measured, but no accuracy published" : "No score — not earned"}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            {a.n
              ? a.status === "MEASURED"
                ? `Item bank n=${a.n} — this axis publishes no accuracy, so none is shown`
                : `Item bank n=${a.n}`
              : "No item bank yet (n=0)"}
          </div>
        </div>
      )}

      <p className="mt-2 text-[12px] leading-snug text-slate-500">{a.task}</p>
    </div>
  );
}

export default function AxisPanel() {
  const [axes, setAxes] = useState<Axis[]>([]);
  const [inLane, setInLane] = useState<InLaneAxis[]>([]);
  const [caption, setCaption] = useState("Counts from GET /api/gspc");
  const [source, setSource] = useState<"wire" | "snapshot" | "loading">("loading");

  useEffect(() => {
    const ac = new AbortController();
    fetchAxes(ac.signal).then((r) => {
      const c = countOf(r.axes);
      setAxes(r.axes);
      setInLane(r.inLane);
      setCaption(publicCaption(r.publicCount, c.measured, c.total));
      setSource(r.source);
    });
    return () => ac.abort();
  }, []);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-xl font-bold text-slate-900">The living GSPC board</h2>
        {/* fetchAxes() falls back to the bundled AXES snapshot when /api/gspc
            does not answer, but nothing here used to say so — the page showed
            stale figures under a caption claiming they came off the wire. */}
        <p className="text-[13px] text-slate-500">
          {source === "loading" ? "Reading GET /api/gspc…" : caption}
          {" · "}Only a MEASURED axis shows a number. Empty cells stay empty.
          {source === "snapshot" && (
            <>
              {" "}
              <em className="text-amber-800">
                (GET /api/gspc did not answer — these are the last recorded figures bundled with
                the page, not a live read. The endpoint is the authority.)
              </em>
            </>
          )}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {axes.map((a) => (
          <AxisCard key={a.axis} a={a} />
        ))}
      </div>
      {inLane.length > 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-5">
          <h3 className="text-sm font-bold text-slate-800">In-lane — not board rows</h3>
          <p className="mt-1 text-[12px] text-slate-500">
            Published on GET /api/gspc as measured_in_lane. Not counted in totals.public_count.
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {inLane.map((r) => (
              <li key={r.axis} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">{r.axis}</span>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wide text-slate-500">{r.status}</span>
                </div>
                <p className="mt-1 text-[12px] text-slate-500">{r.bench || r.task}</p>
                {r.n > 0 && (
                  <p className="mt-2 font-mono text-[13px] tabular-nums text-slate-700">
                    {typeof r.accuracy === "number" ? `${r.accuracy.toFixed(3)} · ` : "no accuracy published · "}n={r.n}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
