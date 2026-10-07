import { lazy, Suspense, useEffect, useState } from "react";
import { fetchAxes, type AxesState, type Axis } from "@/lib/gspcAxes";
import { FOCUS, MEASURE, SP, SURFACE, TYPE } from "./glass";

/**
 * LobbyMatrixPane — Industry × Regulation matrix inside Council OS.
 *
 * WRAPS the existing RelevanceMap visual ("INDUSTRY → CSOAI BRIDGES → FRAMEWORKS")
 * from /map. Does NOT rebuild the SVG. Living drivers (GET /api/gspc) sit beside
 * the archive visual, not as a fork.
 *
 * Authority: GET /api/gspc. If this pane disagrees with the API, the API wins.
 * A relevance map, not a simulation and not certification.
 */

const RelevanceMap = lazy(() => import("@/pages/RelevanceMap"));

/** Matrix state is the axis's published state, never an inference from whether it has a score. */
export function matrixAxisState(axis: Pick<Axis, "status">): Axis["status"] {
  return axis.status;
}

/** Derive the line from the returned axis array so stale prose cannot hide an empty slot. */
export function matrixBoardSummary(axes: Pick<Axis, "status">[]): string {
  const total = axes.length;
  const measured = axes.filter((axis) => matrixAxisState(axis) === "MEASURED").length;
  const unmeasured = total - measured;
  return `${total} ${total === 1 ? "axis" : "axes"} · ${measured} measured · ${unmeasured} unmeasured`;
}

/** The same counts in plain words for the pane face (no axis ids). UNMEASURED stays a stated number. */
export function matrixBoardPlain(axes: Pick<Axis, "status">[]): string {
  const total = axes.length;
  const measured = axes.filter((axis) => matrixAxisState(axis) === "MEASURED").length;
  return `${total} ${total === 1 ? "test" : "tests"} on the board · ${measured} with published results · ${total - measured} not measured yet`;
}

export default function LobbyMatrixPane({ onOpenSpace }: { onOpenSpace?: (axis: string) => void }) {
  const [state, setState] = useState<Pick<AxesState, "axes" | "source" | "loading">>({
    axes: [],
    source: "snapshot",
    loading: true,
  });

  useEffect(() => {
    const ac = new AbortController();
    fetchAxes(ac.signal).then((r) => setState({ ...r, loading: false }));
    return () => ac.abort();
  }, []);

  return (
    <section aria-labelledby="coai-matrix-h" className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>Industry × Regulation</p>
      <h1 id="coai-matrix-h" className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900">
        What governs what
      </h1>
      
      <p className={`mt-3 ${MEASURE} ${TYPE.body}`}>
        Which rules apply to which industry. Pick an industry below to see them. This is a map of
        relevance, not a compliance verdict and not certification.
      </p>

      {/* Living drivers from GET /api/gspc: one plain line. Tools audit retest, 6 Oct 2026: the raw
          axis ids (machinery-conformity: MEASURED …) in 9 px type were jargon on a stranger's page. */}
      <p className="mt-4 text-sm text-slate-700" data-testid="matrix-board-line">
        {state.loading
          ? "Reading the board…"
          : state.source === "wire"
            ? matrixBoardPlain(state.axes)
            : "The board could not be read just now; nothing is shown in its place."}{" "}
        <a href="/dashboard?tab=board" className={`inline-flex min-h-11 items-center font-semibold text-emerald-800 underline underline-offset-2 ${FOCUS}`}>
          Open the leaderboard
        </a>
      </p>

      {/* The existing RelevanceMap visual, embedded: its own page heading is not drawn here (the pane
          has one), and it is not boxed into a fixed-height frame, so the map keeps its width. */}
      <div className="mt-4">
        <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm">Loading relevance map…</div>}>
          <RelevanceMap embedded />
        </Suspense>
      </div>

      <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50/50 p-4">
        <p className={`${TYPE.section} text-sky-800`}>For regulators</p>
        <p className={`mt-2 ${TYPE.body}`}>
          Regulators can <strong>aim</strong> a draft rule against this matrix. They cannot get a verdict from it.
        </p>
        <ul className={`mt-3 space-y-2 ${TYPE.muted}`}>
          <li>
            <strong>Draft provisions</strong> — may open PRACTICE / unsigned sim only.
            <span className="mt-1 block rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900">
              Unsigned training. Never quoted. Not a measurement. Not legal advice. Not a conformity mark.
            </span>
          </li>
          <li>
            <strong>When law changes</strong> — the planned path is detect, approve, re-measure,
            then publish a scoped delta. That automation is not implemented; the simulation is not that path.
          </li>
        </ul>
        <p className={`mt-3 ${TYPE.fine}`}>
          We do not certify. We do not predict. We do not tell a regulator what to write.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="/map"
          className={`${SURFACE} inline-flex min-h-11 items-center rounded-lg px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-100 ${FOCUS}`}
        >
          Full relevance map →
        </a>
        <a
          href="/crosswalk"
          className={`${SURFACE} inline-flex min-h-11 items-center rounded-lg px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-100 ${FOCUS}`}
        >
          Open crosswalk →
        </a>
        <a
          href="/gspc-arena"
          className={`${SURFACE} inline-flex min-h-11 items-center rounded-lg px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-100 ${FOCUS}`}
        >
          Open Council Space →
        </a>
        <a
          href="/api/gspc"
          target="_blank"
          rel="noreferrer"
          className={`${SURFACE} inline-flex min-h-11 items-center rounded-lg px-4 py-2 text-[12px] font-semibold text-emerald-700 transition hover:bg-emerald-50 ${FOCUS}`}
          title="GET /api/gspc"
        >
          The board's raw data ↗
        </a>
      </div>
    </section>
  );
}
