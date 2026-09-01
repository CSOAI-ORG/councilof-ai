import { lazy, Suspense, useEffect, useState } from "react";
import { fetchAxes, quotable, type AxesState } from "@/lib/gspcAxes";
import { FOCUS, MEASURE, SP, SURFACE, TYPE } from "./glass";

/**
 * LobbyMatrixPane — Industry × Regulation matrix inside Council OS.
 *
 * WRAPS the existing RelevanceMap visual ("INDUSTRY → CSOAI BRIDGES → FRAMEWORKS")
 * from /map. Does NOT rebuild the SVG. Living drivers (GET /api/gspc) sit beside
 * the archive visual, not as a fork.
 *
 * Authority: GET /api/gspc. If this pane disagrees with the API, the API wins.
 * This is a printer of the living board, not a simulation, not certification.
 */

const RelevanceMap = lazy(() => import("@/pages/RelevanceMap"));

export default function LobbyMatrixPane({ onOpenSpace }: { onOpenSpace?: (axis: string) => void }) {
  const [state, setState] = useState<Pick<AxesState, "axes" | "source" | "loading" | "publicCount">>({
    axes: [],
    source: "snapshot",
    loading: true,
    publicCount: undefined,
  });

  useEffect(() => {
    const ac = new AbortController();
    fetchAxes(ac.signal).then((r) => setState({ ...r, loading: false }));
    return () => ac.abort();
  }, []);

  const measured = state.axes.filter(quotable).length;
  const total = state.axes.length;
  const empty = total - measured;

  return (
    <section aria-labelledby="coai-matrix-h" className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>Industry × Regulation</p>
      <h2 id="coai-matrix-h" className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900">
        What governs what
      </h2>
      
      <p className={`mt-3 ${MEASURE} ${TYPE.body}`}>
        Printer of the living board. Not a simulation. Not certification.{" "}
        <span className="font-semibold">Cite GET /api/gspc as the authority.</span>{" "}
        If this page disagrees with the API, the API wins.
      </p>

      {/* Living drivers from GET /api/gspc */}
      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2">
        <p className="text-[11px] font-semibold text-emerald-800">Living board state</p>
        <p className="text-[12px] text-emerald-700 font-mono">
          {state.loading
            ? "Reading GET /api/gspc…"
            : state.source === "wire" && state.publicCount
              ? state.publicCount
              : state.source === "wire"
                ? `${total} axis · ${measured} measured · ${empty} empty`
                : "Offline fallback — this build's snapshot"}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {!state.loading && state.axes.slice(0, 8).map((a) => (
            <span
              key={a.axis}
              className={`rounded px-1.5 py-0.5 text-[9px] font-mono ${
                quotable(a)
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {a.axis}: {quotable(a) ? "MEASURED" : "UNMEASURED"}
            </span>
          ))}
          {!state.loading && state.axes.length > 8 && (
            <span className="text-[9px] text-slate-400">+{state.axes.length - 8} more</span>
          )}
        </div>
      </div>

      {/* The existing RelevanceMap visual — NOT rebuilt */}
      <div className="mt-6 rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5">
          <p className="text-[10px] font-semibold text-amber-800">
            Archive visual from /map — 6 industries · 12 bridges (the fun one we already had)
          </p>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm">Loading relevance map…</div>}>
            <RelevanceMap />
          </Suspense>
        </div>
      </div>

      {/* Links to living data sources */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
        <a href="/industries" className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
          <span className="font-semibold text-slate-700">industries.ts</span>
          <span className="block text-slate-500">15 sectors</span>
        </a>
        <a href="/crosswalk" className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
          <span className="font-semibold text-slate-700">east-west-v1.json</span>
          <span className="block text-slate-500">Crosswalk</span>
        </a>
      </div>

      <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50/50 p-4">
        <p className={`${TYPE.section} text-sky-800`}>For regulators</p>
        <p className={`mt-2 ${TYPE.body}`}>
          Regulators can <strong>aim</strong> a draft rule against this matrix. They cannot get a verdict from it.
        </p>
        <ul className={`mt-3 space-y-2 ${TYPE.muted}`}>
          <li>
            <strong>Matrix cells</strong> — MEASURED / UNMEASURED / REPORTED from GET /api/gspc + existing crosswalk.
            Empty stays empty.
          </li>
          <li>
            <strong>Draft provisions</strong> — may open PRACTICE / unsigned sim only.
            <span className="mt-1 block rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900">
              Unsigned training. Never quoted. Not a measurement. Not legal advice. Not a conformity mark.
            </span>
          </li>
          <li>
            <strong>When law changes</strong> — the living-law path is re-measure + delta card. The old card stays.
            The simulation is not that path.
          </li>
        </ul>
        <p className={`mt-3 ${TYPE.fine}`}>
          We do not certify. We do not predict. We do not tell a regulator what to write.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="/map"
          className={`${SURFACE} rounded-lg px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-100 ${FOCUS}`}
        >
          Full relevance map →
        </a>
        <a
          href="/crosswalk"
          className={`${SURFACE} rounded-lg px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-100 ${FOCUS}`}
        >
          Open crosswalk →
        </a>
        <a
          href="/gspc-arena"
          className={`${SURFACE} rounded-lg px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-100 ${FOCUS}`}
        >
          Open Council Space →
        </a>
        <a
          href="/api/gspc"
          target="_blank"
          rel="noreferrer"
          className={`${SURFACE} rounded-lg px-4 py-2 text-[12px] font-semibold text-emerald-700 transition hover:bg-emerald-50 ${FOCUS}`}
        >
          GET /api/gspc ↗
        </a>
      </div>
    </section>
  );
}
