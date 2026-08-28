import { useEffect, useState } from "react";
import { fetchAxes, quotable, type AxesState, type Axis } from "@/lib/gspcAxes";
import { industries, type Industry } from "@/data/industries";
import { FOCUS, MEASURE, SP, SURFACE, TYPE } from "./glass";

/**
 * LobbyMatrixPane — Industry × Regulation matrix inside Council OS.
 *
 * A visual grid: rows are industry sectors, columns are published regimes.
 * Each cell is MEASURED / UNMEASURED / REPORTED from the living board.
 *
 * Authority: GET /api/gspc. If this pane disagrees with the API, the API wins.
 * This is a printer of the living board, not a simulation, not certification.
 */

type CellStatus = "MEASURED" | "UNMEASURED" | "REPORTED" | "EMPTY";

interface Regime {
  id: string;
  name: string;
  short: string;
}

const REGIMES: Regime[] = [
  { id: "eu", name: "EU AI Act", short: "EU" },
  { id: "uk", name: "UK/DRCF", short: "UK" },
  { id: "us-il", name: "Illinois SB 315", short: "IL" },
  { id: "cn", name: "TC260", short: "CN" },
  { id: "nist", name: "NIST/ISO", short: "NIST" },
];

const CROSSWALK_CONTROLS: Record<string, string[]> = {
  eu: ["Risk management", "Data governance", "Documentation & records", "Transparency & disclosure", "Human oversight", "Security & resilience"],
  uk: ["Security & resilience", "Transparency & disclosure", "Bias & fairness", "Accountability & governance", "Human oversight"],
  "us-il": ["Risk management", "Documentation & records", "Bias & fairness", "Security & resilience"],
  cn: ["Transparency & disclosure", "Data governance", "Human oversight", "Risk management"],
  nist: ["Govern", "Map", "Measure", "Manage"],
};

const SELECTED_INDUSTRIES: string[] = [
  "insurance",
  "government",
  "care",
  "defence",
  "critical-infrastructure",
  "media",
  "agent-rails",
];

function getIndustriesForMatrix(): Industry[] {
  return SELECTED_INDUSTRIES
    .map((slug) => industries.find((i) => i.slug === slug))
    .filter((i): i is Industry => i !== undefined);
}

function getCellStatus(
  industry: Industry,
  regime: Regime,
  axes: Axis[],
): CellStatus {
  const industryAxes = industry.axes;
  const axisLookup = new Map(axes.map((a) => [a.axis, a]));
  
  const crosswalkControls = CROSSWALK_CONTROLS[regime.id] ?? [];
  if (crosswalkControls.length === 0) return "EMPTY";

  let hasMeasured = false;
  let hasUnmeasured = false;

  for (const axisName of industryAxes) {
    const axis = axisLookup.get(axisName);
    if (axis) {
      if (quotable(axis)) {
        hasMeasured = true;
      } else {
        hasUnmeasured = true;
      }
    }
  }

  if (hasMeasured) return "MEASURED";
  if (hasUnmeasured) return "UNMEASURED";
  if (crosswalkControls.length > 0 && regime.id !== "nist") return "REPORTED";
  return "EMPTY";
}

function StatusBadge({ status }: { status: CellStatus }) {
  const styles: Record<CellStatus, string> = {
    MEASURED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    UNMEASURED: "bg-slate-100 text-slate-600 border-slate-200",
    REPORTED: "bg-amber-50 text-amber-700 border-amber-200",
    EMPTY: "bg-white text-slate-400 border-slate-100",
  };
  const labels: Record<CellStatus, string> = {
    MEASURED: "MEASURED",
    UNMEASURED: "UNMEASURED",
    REPORTED: "REPORTED",
    EMPTY: "—",
  };
  return (
    <span
      className={`rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

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

  const matrixIndustries = getIndustriesForMatrix();

  return (
    <section aria-labelledby="coai-matrix-h" className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>Industry × Regulation</p>
      <h2 id="coai-matrix-h" className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900">
        The living matrix
      </h2>
      
      <p className={`mt-3 ${MEASURE} ${TYPE.body}`}>
        Printer of the living board. Not a simulation. Not certification.{" "}
        <span className="font-semibold">Cite GET /api/gspc as the authority.</span>{" "}
        If this page disagrees with the API, the API wins.
      </p>

      <p className={`mt-2 ${TYPE.muted}`}>
        {state.loading
          ? "Reading GET /api/gspc…"
          : state.source === "wire" && state.publicCount
            ? state.publicCount
            : state.source === "wire"
              ? "Live from the board"
              : "Offline fallback — this build's snapshot"}
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Industry / Sector
              </th>
              {REGIMES.map((r) => (
                <th
                  key={r.id}
                  className="px-2 py-2 text-center font-mono text-[10px] uppercase tracking-wider text-slate-500"
                  title={r.name}
                >
                  {r.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixIndustries.map((industry) => (
              <tr
                key={industry.slug}
                className="border-b border-slate-100 transition hover:bg-slate-50/50"
              >
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-slate-900">{industry.name}</span>
                    <span className={`${TYPE.fine} line-clamp-1`}>{industry.short}</span>
                  </div>
                </td>
                {REGIMES.map((regime) => {
                  const status = getCellStatus(industry, regime, state.axes);
                  return (
                    <td key={regime.id} className="px-2 py-3 text-center">
                      <StatusBadge status={status} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <p className={TYPE.section}>Legend</p>
        <div className="mt-2 flex flex-wrap gap-4 text-[11px]">
          <div className="flex items-center gap-2">
            <StatusBadge status="MEASURED" />
            <span className="text-slate-600">Axis measured with live data</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status="UNMEASURED" />
            <span className="text-slate-600">Declared slot, no run yet</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status="REPORTED" />
            <span className="text-slate-600">Crosswalk mapped, not scored</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status="EMPTY" />
            <span className="text-slate-600">Empty — no data</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
        <p className={`${TYPE.section} text-emerald-800`}>Published crosswalk</p>
        <p className={`mt-1 ${TYPE.muted}`}>
          The east-west crosswalk at <code className="font-mono text-[10px]">/crosswalk/east-west-v1.json</code>{" "}
          maps four regimes (EU, UK, Illinois SB 315, TC260). NIST/ISO coverage is described, not
          crosswalked — this page says which is which.
        </p>
        <p className={`mt-2 ${TYPE.fine}`}>
          Determination stays with authorities. Crosswalk maps obligations; it is not a conformity
          opinion, certificate, or legal verdict.
        </p>
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
          href="/crosswalk"
          className={`${SURFACE} rounded-lg px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-100 ${FOCUS}`}
        >
          Open full crosswalk →
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
