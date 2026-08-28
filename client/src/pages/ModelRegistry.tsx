// Model Registry — a live view of measured model performance from GET /api/gspc.
// Reads /api/gspc (the signed measurement layer). No fabricated numbers, no demo data.
// Falls back to the bundled AXES snapshot if the API is unreachable — honest about which.

import { useEffect, useState } from "react";
import { AXES, MEASURED_ON, type Axis } from "@/lib/gspcAxes";
import { isEmbedded } from "@/lib/embed";

interface GspcAxis {
  axis: string;
  bench: string;
  task: string;
  n: number;
  accuracy: number;
  leader: string;
  separation: string | null;
  separation_p: number | null;
  interval: [number, number] | null;
  fleet_mean: number | null;
  macro_f1: number | null;
  unparsed_rate: number;
  status: string;
  dataset: string | null;
  colour: string;
  note: string;
}
interface GspcResponse {
  schema: string;
  issuer: string;
  measured_on: { date: string; model: string; note: string };
  axes: GspcAxis[];
  totals: { measured: number; unmeasured: number; total: number };
  limitations: string[];
}
interface AxesState {
  axes: Axis[];
  source: "snapshot";
  measuredOn: string;
  loading: true;
}

function useGspc(): { axes: (GspcAxis | Axis)[]; source: string; measuredOn: string; loading: boolean; error: string | null; limitations: string[]; issuer: string } {
  const [state, setState] = useState<{
    axes: (GspcAxis | Axis)[];
    source: string;
    measuredOn: string;
    loading: boolean;
    error: string | null;
    limitations: string[];
    issuer: string;
  }>({ axes: AXES, source: "snapshot", measuredOn: MEASURED_ON.date, loading: true, error: null, limitations: [], issuer: "" });

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/gspc", { signal: ac.signal })
      .then((r) => r.json())
      .then((d: GspcResponse) => {
        setState({
          axes: d.axes,
          source: "wire",
          measuredOn: d.measured_on?.date ?? "",
          loading: false,
          error: null,
          limitations: d.limitations ?? [],
          issuer: d.issuer ?? "",
        });
      })
      .catch(() => {
        setState((s) => ({ ...s, loading: false }));
      });
    return () => ac.abort();
  }, []);

  return state;
}

function fmtPct(v: number) { return (v * 100).toFixed(1) + "%"; }
function fmtCI(lo: number, hi: number) { return `[${lo.toFixed(3)}, ${hi.toFixed(3)}]`; }

const AXIS_LABEL: Record<string, string> = {
  governance: "EU AI Act",
  safety: "Safety",
  provenance: "Provenance",
  continuity: "Continuity",
  conformance: "Conformance",
  openness: "Openness",
  "machinery-conformity": "Machinery",
  care: "Care",
  "cross-reality": "XR",
  "detector-interop": "Detection",
  "art5-safeguard": "Art 5",
  swarm: "Swarm",
  affect: "Affect",
};

export default function ModelRegistry() {
  const { axes, source, measuredOn, loading, error, limitations, issuer } = useGspc();
  const framed = typeof window !== "undefined" && isEmbedded();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#04070d]">
        <div className="text-center">
          <div className="text-sm text-slate-500">reading /api/gspc…</div>
          <div className="mt-2 text-[11px] text-slate-600">If this takes too long, the bundled snapshot serves as fallback.</div>
        </div>
      </div>
    );
  }

  const wireAxes = axes.filter((a) => "leader" in a) as GspcAxis[];
  const measuredCount = wireAxes.filter((a) => a.status === "MEASURED").length;

  return (
    <div className="min-h-screen bg-[#04070d] text-slate-200">
      {/* Header */}
      <header className="border-b border-white/8 bg-[#080c14]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {!framed && (
            <a href="/os?lobby=home" className="text-[11px] uppercase tracking-[0.2em] text-emerald-400 hover:text-emerald-300">
              ← Open in Council OS
            </a>
          )}
          <h1 className={`${framed ? "" : "mt-2 "}text-3xl font-bold tracking-tight text-white`}>Model Registry</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Measured performance of AI models on the living GSPC board. Counts live in
            GET /api/gspc — this page does not type a slot number. Every cell is a
            deterministic score — no model judges another. Unmeasured cells stay empty.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span>
              {source === "wire"
                ? `live · /api/gspc · ${measuredOn} · ${measuredCount}/${wireAxes.length} measured`
                : `bundled snapshot (${measuredOn}) · /api/gspc unreachable`}
            </span>
            {issuer && <span className="text-slate-600">issuer {issuer}</span>}
            <a
              className="rounded border border-white/10 px-2.5 py-1 text-emerald-400 hover:bg-white/5"
              href="/gspc-scoreboard/"
            >
              Living board ↗
            </a>
          </div>
          {limitations.length > 0 && (
            <details className="mt-2 text-[11px] text-slate-600">
              <summary className="cursor-pointer">Limitations ({limitations.length})</summary>
              <ul className="mt-1 list-disc pl-4">
                {limitations.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            </details>
          )}
        </div>
      </header>

      {/* Axis grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wireAxes.map((a) => {
            const isMeasured = a.status === "MEASURED";
            const hasInterval = a.interval && a.interval.length === 2;
            return (
              <div
                key={a.axis}
                className="rounded-xl border border-white/8 bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: a.colour || "#34d399" }} />
                  <h3 className="truncate text-sm font-semibold text-slate-100">
                    {AXIS_LABEL[a.axis] ?? a.axis}
                  </h3>
                  <span
                    className={`ml-auto shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                      isMeasured ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-slate-600 bg-slate-800/50 text-slate-500"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">{a.bench} · n={a.n}</div>
                {isMeasured ? (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold tabular-nums text-slate-100">{a.accuracy?.toFixed(3) ?? "—"}</span>
                      <span className="text-[11px] text-slate-500">accuracy</span>
                    </div>
                    {hasInterval && (
                      <div className="text-[11px] tabular-nums text-slate-500">
                        95% {fmtCI(a.interval![0], a.interval![1])}
                      </div>
                    )}
                    {a.leader && (
                      <div className="text-[11px] text-slate-400">
                        best: <span className="font-medium text-emerald-300">{a.leader}</span>
                      </div>
                    )}
                    {a.separation === "SEPARATED" && a.separation_p != null && (
                      <div className="text-[10px] text-slate-600">
                        leader separation p={a.separation_p?.toFixed(4) ?? "—"} {a.separation_p < 0.05 ? "(significant)" : ""}
                      </div>
                    )}
                    {a.fleet_mean != null && (
                      <div className="text-[10px] text-slate-600">
                        fleet mean {a.fleet_mean?.toFixed(3) ?? "—"} · macro F1 {a.macro_f1?.toFixed(3) ?? "—"}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 text-[12px] text-slate-600 italic">
                    {a.note?.substring(0, 120) ?? "No score earned — measurement board not yet clean."}
                  </div>
                )}
                {a.dataset && (
                  <a
                    className="mt-3 block text-[11px] text-teal-400 hover:underline"
                    href={`https://huggingface.co/datasets/${a.dataset}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {a.dataset} ↗
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* Scoreboard link footnote */}
        <div className="mt-8 border-t border-white/8 pt-4 text-center text-[11px] text-slate-600">
          This page shows per-axis leaders from the live API. The living board is at{" "}
          <a className="text-emerald-400 hover:underline" href="/gspc-scoreboard/">
            /gspc-scoreboard/
          </a>
          . Measurement, not certification. Every cell recomputable.
        </div>
      </section>
    </div>
  );
}
