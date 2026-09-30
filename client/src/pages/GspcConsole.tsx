/**
 * /gspc-console — every published model × test-bank cell, in the site's own shell.
 *
 * 27 Sep 2026 (ux-unify). This used to be public/gspc-console.html: system fonts, its own
 * five-link header, a raw table that overflowed the page by 257px at 1440 and 1059px at
 * 390, class names with no CSS behind them, and a badge that read "23 axis · 23 measured"
 * beside a line reading "16 axis MEASURED TIE UNMEASURED". Both numbers were right about
 * different things — the board has 23 axes; the findings index has 16 test banks — but the
 * page called both "axis". Now:
 *
 *  - the board count is quoted ONCE, verbatim from GET /api/gspc → totals.public_count;
 *  - the findings-index figures are quoted from GET /api/findings → counts and are called
 *    what they are ("test banks", "published scores"), never "axes";
 *  - nothing here is a typed number; every figure is read at load;
 *  - an unreachable endpoint is UNCHECKABLE, never a guessed figure;
 *  - the CSOAI fleet and third-party Hub models stay two separate tables.
 *
 * `?embed=1` (the Council OS pane) renders the same page without site chrome.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ExternalLink, Search, ShieldCheck } from "lucide-react";

type Measurement = {
  accuracy?: number | string | null;
  status?: string;
  card?: string;
  card_url?: string;
};
type Finding = {
  model: string;
  axis: string;
  axis_label?: string;
  measurement?: Measurement;
};
type FindingsAxis = { axis: string; label?: string; bench?: string };
type FindingsPayload = {
  findings?: Finding[];
  axes?: FindingsAxis[];
  counts?: {
    findings?: number;
    models?: number;
    axes?: number;
    possible_cells?: number;
    unmeasured_cells?: number;
  };
  honesty?: { findings_are?: string };
  as_of?: string;
};
type BoardPayload = {
  totals?: { public_count?: string };
  axes?: { axis: string; separation?: string | null }[];
};
type HubCell = {
  model: string;
  axis: string;
  status?: string;
  accuracy?: number | null;
  card_sha256?: string;
  card_url?: string;
  unmeasured?: string[];
};
type HubPayload = {
  cells?: HubCell[];
  counts?: { measured?: number; unmeasured?: number; cells?: number };
};

type Phase<T> =
  | { state: "loading" }
  | { state: "ok"; data: T }
  | { state: "failed"; reason: string };

const ORIGIN = "";

async function getJSON<T>(path: string): Promise<T> {
  const r = await fetch(ORIGIN + path, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`${path} answered HTTP ${r.status}`);
  return (await r.json()) as T;
}

/** Short column headers. The full name is always in the <abbr title> beside it. */
const SHORT: Record<string, string> = {
  "arc-30": "ARC",
  care: "Care",
  "care-refusal-help": "Care: help",
  "care-refusal-protect": "Care: protect",
  gov: "Gov",
  "gsm8k-30": "GSM8K",
  "gspc-conformance": "Conform.",
  "gspc-continuity": "Contin.",
  "gspc-governance": "Govern.",
  "gspc-openness": "Openness",
  "gspc-provenance": "Proven.",
  "gspc-safety": "Safety",
  "jail-escape-detection": "Jailbreak",
  "mmlu-30": "MMLU",
  "swag-30": "SWAG",
  "swarm-candidates": "Swarm",
};

function shortName(axis: string): string {
  if (SHORT[axis]) return SHORT[axis];
  const bare = axis.replace(/^gspc-/, "").replace(/-30$/, "").replace(/-/g, " ");
  return bare.length > 11 ? `${bare.slice(0, 10)}…` : bare;
}

function formatScore(acc: number | string): string {
  if (typeof acc !== "number") return String(acc);
  return acc.toFixed(3).replace(/^0\./, ".");
}

function Unchecked({ what, reason }: { what: string; reason: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
    >
      <strong>UNCHECKABLE</strong> — {what} did not answer ({reason}). Nothing is shown in its
      place; unreachable is not empty.
    </p>
  );
}

export default function GspcConsole() {
  const [board, setBoard] = useState<Phase<BoardPayload>>({ state: "loading" });
  const [findings, setFindings] = useState<Phase<FindingsPayload>>({ state: "loading" });
  const [hub, setHub] = useState<Phase<HubPayload>>({ state: "loading" });
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.title = "GSPC console — every published score | Council of AI";
    let cancelled = false;
    const load = <T,>(path: string, set: (p: Phase<T>) => void) =>
      getJSON<T>(path)
        .then((data) => !cancelled && set({ state: "ok", data }))
        .catch((e: Error) => !cancelled && set({ state: "failed", reason: e.message }));
    void load<BoardPayload>("/api/gspc", setBoard);
    void load<FindingsPayload>("/api/findings", setFindings);
    void load<HubPayload>("/api/hub-cards", setHub);
    return () => {
      cancelled = true;
    };
  }, []);

  const matrix = useMemo(() => {
    if (findings.state !== "ok") return null;
    const rows = findings.data.findings ?? [];
    const labels = new Map<string, string>();
    for (const a of findings.data.axes ?? []) labels.set(a.axis, a.label || a.axis);
    for (const f of rows) if (f.axis_label && !labels.has(f.axis)) labels.set(f.axis, f.axis_label);
    const by = new Map<string, Finding>();
    const density = new Map<string, number>();
    for (const f of rows) {
      by.set(`${f.model}\u0000${f.axis}`, f);
      density.set(f.model, (density.get(f.model) || 0) + 1);
    }
    const axes = [...new Set(rows.map((f) => f.axis))].sort();
    // Densest rows first: a model with more published cells is more useful at the top.
    const models = [...new Set(rows.map((f) => f.model))].sort(
      (a, b) => (density.get(b) || 0) - (density.get(a) || 0) || a.localeCompare(b),
    );
    return { axes, models, by, labels };
  }, [findings]);

  const separation = useMemo(() => {
    const m = new Map<string, string>();
    if (board.state === "ok")
      for (const a of board.data.axes ?? [])
        m.set(a.axis, String(a.separation || "").toUpperCase());
    return m;
  }, [board]);

  const q = query.trim().toLowerCase();
  const shownModels = matrix ? matrix.models.filter((m) => !q || m.toLowerCase().includes(q)) : [];
  const counts = findings.state === "ok" ? findings.data.counts ?? {} : {};

  return (
    <div className="bg-[var(--surface-canvas,#f7f8f4)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
            GSPC console
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Every published score, model by model
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            One row per model, one column per test bank. A number is a published score with a
            signed record behind it; a dash means no run exists for that pair yet. Figures are
            read live from{" "}
            <a className="font-medium text-emerald-800 underline underline-offset-2" href="/api/findings">
              /api/findings
            </a>{" "}
            and{" "}
            <a className="font-medium text-emerald-800 underline underline-offset-2" href="/api/gspc">
              /api/gspc
            </a>{" "}
            each time the page loads.
          </p>
        </header>

        {/* The board count, stated once, verbatim. */}
        <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-emerald-950/10 bg-white p-3 sm:p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600 sm:text-xs">
              Public board
            </dt>
            <dd className="mt-1 text-base font-bold text-slate-950 sm:text-lg" data-testid="console-lid">
              {board.state === "ok"
                ? board.data.totals?.public_count || "UNCHECKABLE"
                : board.state === "failed"
                  ? "UNCHECKABLE"
                  : "Reading…"}
            </dd>
          </div>
          <div className="rounded-2xl border border-emerald-950/10 bg-white p-3 sm:p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600 sm:text-xs">
              Published scores
            </dt>
            <dd className="mt-1 text-base font-bold text-slate-950 sm:text-lg">
              {findings.state === "ok" ? counts.findings ?? matrix?.by.size ?? "—" : "—"}
            </dd>
          </div>
          <div className="rounded-2xl border border-emerald-950/10 bg-white p-3 sm:p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600 sm:text-xs">
              Models × test banks
            </dt>
            <dd className="mt-1 text-base font-bold text-slate-950 sm:text-lg">
              {findings.state === "ok"
                ? `${counts.models ?? matrix?.models.length ?? "—"} × ${counts.axes ?? matrix?.axes.length ?? "—"}`
                : "—"}
            </dd>
          </div>
          <div className="rounded-2xl border border-emerald-950/10 bg-white p-3 sm:p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600 sm:text-xs">
              Cells with no run (UNMEASURED)
            </dt>
            <dd className="mt-1 text-base font-bold text-slate-950 sm:text-lg">
              {findings.state === "ok" && counts.unmeasured_cells != null && counts.possible_cells != null
                ? `${counts.unmeasured_cells} of ${counts.possible_cells}`
                : "—"}
            </dd>
          </div>
        </dl>

        <section aria-labelledby="fleet-h" className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="max-w-2xl">
              <h2 id="fleet-h" className="text-xl font-bold tracking-tight text-slate-950">
                The CSOAI fleet
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                Our own models, measured against the frozen banks. Third-party models are a
                separate table below.
              </p>
            </div>
            <label className="relative block w-full sm:w-72">
              <span className="sr-only">Filter models by name</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter models…"
                autoComplete="off"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-500 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/25"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-700" aria-label="Legend">
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-6 min-w-10 items-center justify-center rounded bg-emerald-50 px-1.5 font-mono text-xs font-semibold text-emerald-900 ring-1 ring-emerald-700/20">.867</span>
              Published score (0–1); opens its signed record
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-6 min-w-10 items-center justify-center rounded bg-slate-100 px-1.5 font-mono text-xs font-semibold text-slate-600">—</span>
              UNMEASURED: no run for this pair. Empty is not a zero.
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-900">TIE</span>
              Axis where no leader separated on the board
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-700" aria-live="polite">
            {matrix ? `Showing ${shownModels.length} of ${matrix.models.length} models.` : ""}
          </p>

          <div className="mt-2">
            {findings.state === "loading" ? (
              <p role="status" className="rounded-xl border border-border bg-white p-6 text-sm text-slate-700">
                Reading the findings index…
              </p>
            ) : findings.state === "failed" ? (
              <Unchecked what="/api/findings" reason={findings.reason} />
            ) : matrix && shownModels.length ? (
              <div
                className="relative max-h-[70vh] overflow-auto rounded-2xl border border-emerald-950/10 bg-white shadow-[0_1px_2px_rgba(6,21,15,0.04)]"
                tabIndex={0}
                role="region"
                aria-label="Model by test-bank scores (scrolls sideways)"
                data-testid="console-matrix"
              >
                <table className="min-w-max border-separate border-spacing-0 text-sm">
                  <caption className="sr-only">
                    Published scores for each model (rows) on each test bank (columns). A dash
                    means UNMEASURED.
                  </caption>
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="sticky left-0 top-0 z-30 border-b border-r border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-700"
                      >
                        Model
                      </th>
                      {matrix.axes.map((axis) => {
                        const sep = separation.get(axis);
                        const full = matrix.labels.get(axis) || axis;
                        return (
                          <th
                            key={axis}
                            scope="col"
                            className="sticky top-0 z-20 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-2.5 py-2.5 text-center text-xs font-semibold text-slate-800"
                          >
                            <abbr title={`${full} (${axis})`} className="cursor-help no-underline">
                              {shortName(axis)}
                            </abbr>
                            {sep === "TIE" ? (
                              <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-900">TIE</span>
                            ) : null}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {shownModels.map((model, i) => (
                      <tr key={model} className={i % 2 ? "bg-slate-50/60" : "bg-white"}>
                        <th
                          scope="row"
                          title={model}
                          className={
                            "sticky left-0 z-10 max-w-[11rem] truncate border-r border-slate-200 px-3 py-2 text-left font-mono text-xs font-semibold text-slate-900 sm:max-w-[16rem] " +
                            (i % 2 ? "bg-slate-50" : "bg-white")
                          }
                        >
                          {model}
                        </th>
                        {matrix.axes.map((axis) => {
                          const f = matrix.by.get(`${model}\u0000${axis}`);
                          const acc = f?.measurement?.accuracy;
                          if (acc === null || acc === undefined) {
                            return (
                              <td key={axis} className="px-2.5 py-2 text-center font-mono text-xs text-slate-500">
                                <span aria-hidden="true">—</span>
                                <span className="sr-only">UNMEASURED</span>
                              </td>
                            );
                          }
                          const m = f!.measurement!;
                          const title = `${model} · ${matrix.labels.get(axis) || axis} · ${m.status || ""}${m.card ? ` · card ${String(m.card).slice(0, 12)}` : ""}`;
                          return (
                            <td key={axis} className="px-1.5 py-1.5 text-center">
                              {m.card_url ? (
                                <a
                                  href={m.card_url}
                                  title={title}
                                  className="inline-flex min-w-11 justify-center rounded px-1.5 py-1 font-mono text-xs font-semibold tabular-nums text-emerald-900 hover:bg-emerald-50 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                                >
                                  {formatScore(acc)}
                                </a>
                              ) : (
                                <span title={title} className="font-mono text-xs font-semibold tabular-nums text-slate-900">
                                  {formatScore(acc)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-xl border border-border bg-white p-6 text-sm text-slate-700">
                No model matches that filter.
              </p>
            )}
          </div>
          {findings.state === "ok" && findings.data.honesty?.findings_are ? (
            <p className="mt-3 max-w-3xl text-xs leading-5 text-slate-600">
              {findings.data.honesty.findings_are}
            </p>
          ) : null}
        </section>

        <section aria-labelledby="hub-h" className="mt-14">
          <h2 id="hub-h" className="text-xl font-bold tracking-tight text-slate-950">
            Third-party models on the Hub
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">
            A <strong>different population</strong> from the table above, which is the CSOAI
            fleet. Status is passed through exactly as published — this page never upgrades a
            cell.
            {hub.state === "ok" ? (
              <>
                {" "}
                <strong>
                  {hub.data.counts?.measured ?? 0} MEASURED · {hub.data.counts?.unmeasured ?? 0}{" "}
                  UNMEASURED
                </strong>{" "}
                of {hub.data.counts?.cells ?? 0} cells.
              </>
            ) : null}
          </p>
          <div className="mt-4">
            {hub.state === "loading" ? (
              <p role="status" className="rounded-xl border border-border bg-white p-6 text-sm text-slate-700">
                Reading third-party cells…
              </p>
            ) : hub.state === "failed" || !Array.isArray(hub.data.cells) || !hub.data.cells.length ? (
              <Unchecked
                what="/api/hub-cards"
                reason={hub.state === "failed" ? hub.reason : "no cells returned"}
              />
            ) : (
              <div
                className="relative max-h-[32rem] overflow-auto rounded-2xl border border-emerald-950/10 bg-white"
                tabIndex={0}
                role="region"
                aria-label="Third-party model cells (scrolls)"
              >
                <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-sm">
                  <caption className="sr-only">Third-party model cells as published on the Hub.</caption>
                  <thead>
                    <tr>
                      {["Model", "Axis", "Status", "Why empty", "Signed record"].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className={
                            "sticky top-0 z-20 border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-700"
                          }
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hub.data.cells.map((cell, i) => {
                      const st = String(cell.status || "UNCHECKABLE").toUpperCase();
                      return (
                        <tr key={`${cell.model}-${cell.axis}-${i}`} className={i % 2 ? "bg-slate-50/60" : "bg-white"}>
                          <th scope="row" className="px-3 py-2 text-left font-mono text-xs font-semibold text-slate-900">
                            {cell.model}
                          </th>
                          <td className="px-3 py-2 text-slate-800">{cell.axis}</td>
                          <td className="px-3 py-2">
                            <span
                              className={
                                "rounded px-1.5 py-0.5 text-[11px] font-bold " +
                                (st === "MEASURED" ? "bg-emerald-50 text-emerald-900" : "bg-slate-100 text-slate-700")
                              }
                            >
                              {st}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-700">{(cell.unmeasured || []).join(", ") || "—"}</td>
                          <td className="px-3 py-2">
                            {cell.card_url ? (
                              <a
                                href={cell.card_url}
                                className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-900 underline underline-offset-2"
                              >
                                {String(cell.card_sha256 || "").slice(0, 10)}…
                                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <aside className="mt-12 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-sm leading-6 text-emerald-950">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
          <p className="min-w-0 flex-1">
            Any signed record can be checked free, with no account.{" "}
            <Link href="/gspc-verify" className="font-semibold underline underline-offset-2">
              Verify a record
            </Link>
            . Measurement, not certification.
          </p>
        </aside>
      </div>
    </div>
  );
}
