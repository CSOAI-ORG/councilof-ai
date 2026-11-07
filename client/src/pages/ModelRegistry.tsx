// Model Registry — a live view of measured model performance from GET /api/gspc.
// Reads /api/gspc (the signed measurement layer). No fabricated numbers, no demo data.
// Falls back to the bundled AXES snapshot if the API is unreachable — honest about which.

import { useEffect, useState } from "react";
import { AXES, MEASURED_ON } from "@/lib/gspcAxes";
import { isEmbedded } from "@/lib/embed";

export interface GspcAxis {
  axis: string;
  bench: string;
  task: string;
  n: number;
  accuracy?: number | null;
  leader?: string;
  separation?: string | null;
  separation_p?: number | null;
  interval?: [number, number] | null;
  fleet_mean?: number | null;
  macro_f1?: number | null;
  unparsed_rate?: number;
  status: string;
  dataset?: string | null;
  colour: string;
  note?: string;
  kind?: string;
  public_leader_state?: string;
}
interface GspcResponse {
  schema: string;
  issuer: string;
  measured_on: { date: string; model: string; note: string };
  axes: GspcAxis[];
  totals: { public_count?: string; measured_axes?: number; unmeasured_axes?: number; axes?: number };
  limitations: string[];
}
export const MODEL_REGISTRY_TIMEOUT_MS = 15_000;
const STATUS = new Set(["MEASURED", "UNMEASURED", "DRAFT", "SPEC", "PLANNED"]);
const object = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
const optionalText = (value: unknown) =>
  value == null || typeof value === "string";
const fraction = (value: unknown) =>
  value == null ||
  (typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1);

/** Validate every field this view renders before calling array/string/number methods.
 * Additional evidence fields stay on the wire; this does not admit a measurement. */
export function parseModelRegistryResponse(value: unknown): GspcResponse {
  const body = object(value);
  if (body?.schema !== "csoai.gspc-axes/0.5" || !Array.isArray(body.axes))
    throw new Error("The response is not a supported GSPC board");
  const seen = new Set<string>();
  const axes = body.axes.map((value): GspcAxis => {
    const row = object(value);
    if (
      !row ||
      typeof row.axis !== "string" ||
      !/^[a-z0-9_.-]{1,120}$/i.test(row.axis) ||
      seen.has(row.axis) ||
      typeof row.bench !== "string" ||
      typeof row.task !== "string" ||
      typeof row.n !== "number" ||
      !Number.isSafeInteger(row.n) ||
      row.n < 0 ||
      typeof row.status !== "string" ||
      !STATUS.has(row.status) ||
      ![
        row.leader,
        row.dataset,
        row.note,
        row.kind,
        row.separation,
        row.public_leader_state,
      ].every(optionalText) ||
      ![
        row.accuracy,
        row.separation_p,
        row.fleet_mean,
        row.macro_f1,
        row.unparsed_rate,
      ].every(fraction) ||
      (row.interval != null &&
        (!Array.isArray(row.interval) ||
          row.interval.length !== 2 ||
          !row.interval.every(
            (part) => typeof part === "number" && fraction(part),
          ) ||
          row.interval[0] > row.interval[1]))
    ) {
      throw new Error("The board contains an unreadable axis row");
    }
    seen.add(row.axis);
    return {
      ...row,
      colour: typeof row.colour === "string" ? row.colour : "#34d399",
    } as unknown as GspcAxis;
  });
  const measured = body.measured_on == null ? null : object(body.measured_on);
  const totals = body.totals == null ? null : object(body.totals);
  if (
    !measured ||
    !totals ||
    typeof measured.date !== "string" ||
    !measured.date.trim() ||
    !optionalText(totals?.public_count) ||
    typeof body.issuer !== "string" ||
    !body.issuer.trim() ||
    (body.limitations != null &&
      (!Array.isArray(body.limitations) ||
        !body.limitations.every((line) => typeof line === "string")))
  ) {
    throw new Error("The board metadata could not be read");
  }
  return {
    ...body,
    axes,
    measured_on: measured ?? {},
    totals: totals ?? {},
    limitations: body.limitations ?? [],
    issuer: body.issuer ?? "",
  } as unknown as GspcResponse;
}

function useGspc() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({
    axes: AXES.map((axis) => ({
      ...axis,
      kind: axis.kind || "model-comparison",
    })) as GspcAxis[],
    source: "snapshot",
    measuredOn: MEASURED_ON.date,
    publicCount: "",
    loading: true,
    error: null as string | null,
    limitations: [] as string[],
    issuer: "",
  });

  useEffect(() => {
    const ac = new AbortController();
    let active = true;
    let timedOut = false;
    setState((previous) => ({ ...previous, loading: true }));
    const timeout = window.setTimeout(() => {
      timedOut = true;
      ac.abort();
      if (active)
        setState((previous) => ({
          ...previous,
          loading: false,
          error:
            "The board request timed out. No current response was confirmed.",
        }));
    }, MODEL_REGISTRY_TIMEOUT_MS);
    fetch("/api/gspc", {
      signal: ac.signal,
      headers: { accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`The board returned HTTP ${response.status}`);
        if (
          (response.headers.get("content-type") || "")
            .toLowerCase()
            .includes("text/html")
        )
          throw new Error("The board returned HTML instead of JSON");
        return parseModelRegistryResponse(await response.json());
      })
      .then((board) => {
        if (!active || timedOut) return;
        setState({
          axes: board.axes,
          source: "wire",
          measuredOn: board.measured_on?.date ?? "",
          publicCount: board.totals?.public_count ?? "",
          loading: false,
          error: null,
          limitations: board.limitations,
          issuer: board.issuer,
        });
      })
      .catch((error) => {
        if (!active || timedOut) return;
        setState((previous) => ({
          ...previous,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "The board response could not be read",
        }));
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      active = false;
      window.clearTimeout(timeout);
      ac.abort();
    };
  }, [attempt]);

  return { ...state, retry: () => setAttempt((value) => value + 1) };
}

function fmtCI(lo: number, hi: number) { return `[${lo.toFixed(3)}, ${hi.toFixed(3)}]`; }

export function partitionModelRegistryAxes(axes: GspcAxis[]) {
  return {
    modelComparison: axes.filter((axis) => axis.kind === "model-comparison"),
    deterministicFacts: axes.filter((axis) => axis.kind === "deterministic-facts"),
    unclassified: axes.filter(
      (axis) =>
        axis.kind !== "model-comparison" && axis.kind !== "deterministic-facts",
    ),
  };
}

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
  const { axes, source, measuredOn, publicCount, loading, error, limitations, issuer, retry } = useGspc();
  const framed = typeof window !== "undefined" && isEmbedded();

  const { modelComparison, deterministicFacts, unclassified } =
    partitionModelRegistryAxes(axes);
  const totalMeasuredCount = axes.filter(
    (axis) => axis.status === "MEASURED",
  ).length;
  const factMeasuredCount = deterministicFacts.filter(
    (axis) => axis.status === "MEASURED",
  ).length;
  const measuredSubjectCount = unclassified.filter(
    (axis) => axis.kind === "measured-subject",
  ).length;

  return (
    <div className="min-h-screen bg-[#04070d] text-slate-200">
      {/* Header */}
      <header className="border-b border-white/8 bg-[#080c14]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {!framed && (
            <a href="/dashboard?tab=home" className="text-[11px] uppercase tracking-[0.2em] text-emerald-400 hover:text-emerald-300">
              ← Open in Council OS
            </a>
          )}
          <h1 className={`${framed ? "" : "mt-2 "}text-3xl font-bold tracking-tight text-white`}>Model Registry</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Model-comparison runs from the living GSPC board. Counts and axis
            families come from GET /api/gspc; the presence or absence of a
            public leader never reclassifies an axis. Grading is deterministic,
            and unmeasured cells stay empty.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span>
              {source === "wire"
                ? `live · /api/gspc · ${measuredOn} · ${publicCount || `${axes.length} axis · ${totalMeasuredCount} measured`} · ${modelComparison.length} model-comparison + ${deterministicFacts.length} deterministic-fact${measuredSubjectCount ? ` · ${measuredSubjectCount} measured-subject` : ""}${unclassified.length > measuredSubjectCount ? ` · ${unclassified.length - measuredSubjectCount} unclassified` : ""}`
                : `bundled snapshot (${measuredOn}) · not a current API response`}
            </span>
            {issuer && <span className="text-slate-600">issuer {issuer}</span>}
            <a
              className="rounded border border-white/10 px-2.5 py-1 text-emerald-400 hover:bg-white/5"
              href="/gspc-scoreboard/"
            >
              Living board ↗
            </a>
          </div>
          {loading ? (
            <p role="status" className="mt-3 text-sm text-slate-400">
              {error ? "Retrying" : "Reading"} /api/gspc… The dated snapshot
              remains separate from a current response.
            </p>
          ) : null}
          {error ? (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-200"
              data-testid="model-registry-unreachable"
            >
              <p>
                <strong>UNREACHABLE</strong> · {error} The displayed rows are
                the bundled snapshot ({MEASURED_ON.date}), not live
                measurements.
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={retry}
                className="mt-3 min-h-11 rounded-lg border border-amber-500/40 px-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50"
              >
                {loading ? "Retrying board…" : "Retry board"}
              </button>
            </div>
          ) : null}
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
        {modelComparison.length === 0 && (
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
            {source === "wire"
              ? "This board response contains no model-comparison axes. No model ranking is inferred."
              : "The bundled snapshot contains no model-comparison rows."}{" "}
            Read the source directly at{" "}
            <a className="text-emerald-400 hover:underline" href="/api/gspc">
              /api/gspc
            </a>
            .
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modelComparison.map((a) => {
            const isMeasured = a.status === "MEASURED";
            const hasInterval = a.interval && a.interval.length === 2;
            const hasLeaderAccuracy =
              !a.public_leader_state &&
              typeof a.accuracy === "number" && Number.isFinite(a.accuracy);
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
                {isMeasured && hasLeaderAccuracy ? (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold tabular-nums text-slate-100">{a.accuracy!.toFixed(3)}</span>
                      <span className="text-[11px] text-slate-500">public leader accuracy</span>
                    </div>
                    {hasInterval && (
                      <div className="text-[11px] tabular-nums text-slate-500">
                        95% {fmtCI(a.interval![0], a.interval![1])}
                      </div>
                    )}
                    {a.leader && (
                      <div className="text-[11px] text-slate-400">
                        {a.separation === "SEPARATED" ? "separated leader" : "top observed (not separated)"}:{" "}
                        <span className="font-medium text-emerald-300">{a.leader}</span>
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
                ) : isMeasured ? (
                  <div className="mt-3 text-[12px] leading-relaxed text-slate-500">
                    <strong className="not-italic text-slate-300">
                      Measured fleet; no public leader or leader accuracy asserted.
                    </strong>
                    {typeof a.fleet_mean === "number" && Number.isFinite(a.fleet_mean) ? (
                      <span className="mt-1 block font-mono text-[10px] text-slate-600">
                        fleet mean {a.fleet_mean.toFixed(3)}
                      </span>
                    ) : null}
                    {a.note ? <span className="mt-1 block">{a.note.substring(0, 160)}</span> : null}
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

        {deterministicFacts.length > 0 && (
          <div className="mt-6 rounded-xl border border-sky-400/20 bg-sky-400/[0.05] p-4 text-xs leading-relaxed text-slate-400">
            <strong className="text-sky-300">
              {deterministicFacts.length} deterministic-fact axes ({factMeasuredCount} measured)
            </strong>{" "}
            are part of the canonical board but not this model registry. They
            have no model fleet, leader, accuracy or separation test. Open the
            living board to inspect their evidence rows.
          </div>
        )}

        {/* Scoreboard link footnote */}
        <div className="mt-8 border-t border-white/8 pt-4 text-center text-[11px] text-slate-600">
          This page shows per-axis results from{" "}
          {source === "wire"
            ? "the validated API response"
            : "the dated bundled snapshot"}
          . The living board is at{" "}
          <a className="text-emerald-400 hover:underline" href="/gspc-scoreboard/">
            /gspc-scoreboard/
          </a>
          . Measurement, not certification. Every cell recomputable.
        </div>
      </section>
    </div>
  );
}
