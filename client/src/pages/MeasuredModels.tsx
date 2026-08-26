import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { setMetaDescription } from "@/lib/utils";

/**
 * /board/models — every model we have measured, every axis it was measured on,
 * and the signed record behind each cell.
 *
 * ── WHY THIS PAGE EXISTS ─────────────────────────────────────────────────────
 * The signed card corpus is a model-by-axis matrix, one signed card per filled
 * cell. All of it is real, verified, recomputable work, and none of it was
 * reachable from any surface on the site: reading it meant fetching hundreds of
 * card files by hand. It is the largest piece of finished, unpublished work in
 * the estate, and being unpublished, it may as well not have existed.
 *
 * ── THE ONE MISTAKE THIS PAGE MUST NOT MAKE ──────────────────────────────────
 * THE CARD AXES ARE NOT THE BOARD AXES. The cards carry benchmark axes; the
 * public board carries governance axes measured by a different instrument over a
 * different population. Two different sets, two different counts, on purpose.
 * Conflating them is precisely the defect the board navigator exists to remove,
 * so every view here says which set it is showing, at the top, before a number.
 *
 * ── NO COUNT IS TYPED ────────────────────────────────────────────────────────
 * Every number renders from /signed/card-matrix.json, which is itself derived at
 * build time by reading the card files. Counts here are array lengths.
 */

interface Cell {
  model: string;
  axis: string;
  accuracy: number | null;
  created: string | null;
  card: string;
  card_url: string;
  signed: boolean;
  alg: string | null;
  pubkey: string | null;
}
interface ModelRow {
  id: string;
  name_published: boolean;
  cards: number;
  axes: string[];
  mean_accuracy: number | null;
  best_accuracy: number | null;
  as_of: string | null;
}
interface AxisRow {
  id: string;
  cards: number;
  models: number;
  mean_accuracy: number | null;
  best_accuracy: number | null;
  as_of: string | null;
}
interface Matrix {
  as_of: string | null;
  as_of_field: string;
  not_the_board: string;
  what_a_cell_is: string;
  what_this_does_not_establish: string;
  display_name_policy: { rule: string; withheld_names: number; where_the_name_still_lives: string };
  counts: Record<string, number | string>;
  axes: AxisRow[];
  models: ModelRow[];
  cells: Cell[];
}

const pct = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);

/** A model indexed under a neutral key carries a retired internal brand in its
 *  recorded name. The measured work is kept and counted; only the label is
 *  withheld, and the page says so rather than quietly dropping the row. */
const displayModel = (m: { id: string; name_published: boolean }) =>
  m.name_published ? m.id : "internal model — name not published";

function useMatrix() {
  const [m, setM] = useState<Matrix | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/signed/card-matrix.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => !cancelled && setM(d))
      .catch((e) => !cancelled && setErr(String(e?.message ?? e)));
    return () => {
      cancelled = true;
    };
  }, []);
  return { matrix: m, error: err };
}

// ───────────────────────────────────────────────────────────── shared bits

function CellLink({ c }: { c: Cell }) {
  return (
    <a
      href={c.card_url}
      data-testid="cell-card"
      title={`${c.axis} · scored ${pct(c.accuracy)} · measured ${c.created?.slice(0, 10) ?? "no date"} · signed ${c.alg ?? ""} — opens the signed record`}
      className="inline-block whitespace-nowrap rounded border border-emerald-300 bg-white px-1.5 py-0.5 font-mono text-[10px] leading-none text-emerald-800 hover:border-emerald-600"
    >
      {c.accuracy === null ? "?" : `${Math.round(c.accuracy * 100)}`}
      <span aria-hidden="true">·</span>
      <span className="sr-only">per cent, signed record</span>
    </a>
  );
}

function SetWarning({ what }: { what: string }) {
  return (
    <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <strong>You are looking at the signed card set.</strong> {what} These are{" "}
      <strong>not</strong> the public board's axes: the board measures governance behaviour with a
      different instrument, over a different population, and carries its own separate count. The two
      sets are never added together.{" "}
      <Link href="/board" className="font-semibold underline">
        See how every set relates
      </Link>
      .
    </p>
  );
}

// ─────────────────────────────────────────────────────────────── the page

export default function MeasuredModels() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const focusModel = params.get("model");
  const focusAxis = params.get("axis");
  const { matrix, error } = useMatrix();

  const [view, setView] = useState<"models" | "axes" | "matrix">("models");
  const [query, setQuery] = useState("");
  const [axisFilter, setAxisFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"cards" | "name" | "best" | "mean">("cards");

  useEffect(() => {
    document.title = "Measured models — the signed card set | Council of AI";
    setMetaDescription(
      "Every model we have measured, every axis it was measured on, and the signed record behind each cell. Sortable, filterable, and honest about the cells that are empty.",
    );
  }, []);

  const cellsBy = useMemo(() => {
    const byModel: Record<string, Cell[]> = {};
    const byAxis: Record<string, Cell[]> = {};
    for (const c of matrix?.cells ?? []) {
      (byModel[c.model] ||= []).push(c);
      (byAxis[c.axis] ||= []).push(c);
    }
    return { byModel, byAxis };
  }, [matrix]);

  const models = useMemo(() => {
    let out = matrix?.models ?? [];
    if (axisFilter !== "all") out = out.filter((m) => m.axes.includes(axisFilter));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((m) => displayModel(m).toLowerCase().includes(q));
    }
    return [...out].sort((a, b) => {
      if (sortKey === "name") return displayModel(a).localeCompare(displayModel(b));
      if (sortKey === "best") return (b.best_accuracy ?? -1) - (a.best_accuracy ?? -1);
      if (sortKey === "mean") return (b.mean_accuracy ?? -1) - (a.mean_accuracy ?? -1);
      return b.cards - a.cards || displayModel(a).localeCompare(displayModel(b));
    });
  }, [matrix, axisFilter, query, sortKey]);

  if (error)
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900">Measured models</h1>
        <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          The card index did not load here ({error}). No rows are drawn, because an empty table
          would read like a finding. The underlying records are at{" "}
          <a href="/signed/card_index.json" className="font-mono underline">
            /signed/card_index.json
          </a>
          .
        </p>
      </div>
    );

  if (!matrix)
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-sm text-gray-600">Loading the signed card index…</p>
      </div>
    );

  const c = matrix.counts as Record<string, number>;

  // ── a single model, in depth ──────────────────────────────────────────────
  if (focusModel) {
    const m = matrix.models.find((x) => x.id === focusModel);
    const cells = (cellsBy.byModel[focusModel] ?? []).sort(
      (a, b) => (b.accuracy ?? -1) - (a.accuracy ?? -1),
    );
    if (!m)
      return (
        <div className="mx-auto max-w-4xl px-4 py-12">
          <p className="text-sm text-gray-700">
            No model of that name is in the card index.{" "}
            <Link href="/board/models" className="underline">
              Back to every measured model
            </Link>
            .
          </p>
        </div>
      );
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/board/models" className="text-sm font-semibold text-emerald-700 underline">
          ← every measured model
        </Link>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900">{displayModel(m)}</h1>
        {!m.name_published && (
          <p className="mt-2 rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm text-gray-700">
            {matrix.display_name_policy.rule} {matrix.display_name_policy.where_the_name_still_lives}
          </p>
        )}
        <p className="mt-3 font-mono text-sm text-gray-600">
          {m.cards} signed records · measured on {m.axes.length} of the card set's axes · last
          measured {m.as_of?.slice(0, 10) ?? "no date"}
        </p>
        <div className="mt-4">
          <SetWarning what="These are the axes this model was actually run against." />
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-2 font-semibold">Axis (card set)</th>
                <th className="px-4 py-2 text-right font-semibold">Score</th>
                <th className="px-4 py-2 font-semibold">Measured</th>
                <th className="px-4 py-2 font-semibold">The signed record</th>
              </tr>
            </thead>
            <tbody>
              {cells.map((cell) => (
                <tr key={cell.card} className="border-b border-gray-100">
                  <td className="px-4 py-2">
                    <Link
                      href={`/board/models?axis=${encodeURIComponent(cell.axis)}`}
                      className="font-semibold text-emerald-700 underline"
                    >
                      {cell.axis}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right font-mono">{pct(cell.accuracy)}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">
                    {cell.created?.slice(0, 10) ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <a
                      href={cell.card_url}
                      data-testid="model-card-link"
                      className="font-mono text-xs text-emerald-700 underline"
                    >
                      {cell.card.slice(0, 16)}…
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 rounded-xl border border-rose-300 bg-rose-50/60 p-4 text-sm text-rose-950">
          <strong>What this does not establish.</strong>{" "}
          {matrix.what_this_does_not_establish}
        </p>
      </div>
    );
  }

  // ── a single axis, ranked ─────────────────────────────────────────────────
  if (focusAxis) {
    const a = matrix.axes.find((x) => x.id === focusAxis);
    const cells = (cellsBy.byAxis[focusAxis] ?? []).sort(
      (x, y) => (y.accuracy ?? -1) - (x.accuracy ?? -1),
    );
    if (!a)
      return (
        <div className="mx-auto max-w-4xl px-4 py-12">
          <p className="text-sm text-gray-700">
            No axis of that name is in the card index.{" "}
            <Link href="/board/models" className="underline">
              Back to every measured model
            </Link>
            .
          </p>
        </div>
      );
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/board/models" className="text-sm font-semibold text-emerald-700 underline">
          ← every measured model
        </Link>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900">{a.id}</h1>
        <p className="mt-3 font-mono text-sm text-gray-600">
          {a.cards} signed records · {a.models} models run against it · last measured{" "}
          {a.as_of?.slice(0, 10) ?? "no date"}
        </p>
        <div className="mt-4">
          <SetWarning what="This is one axis of the card set, with every model that was run against it." />
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-2 font-semibold">#</th>
                <th className="px-4 py-2 font-semibold">Model</th>
                <th className="px-4 py-2 text-right font-semibold">Score</th>
                <th className="px-4 py-2 font-semibold">Measured</th>
                <th className="px-4 py-2 font-semibold">The signed record</th>
              </tr>
            </thead>
            <tbody>
              {cells.map((cell, i) => {
                const mr = matrix.models.find((x) => x.id === cell.model);
                return (
                  <tr key={cell.card} className="border-b border-gray-100">
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/board/models?model=${encodeURIComponent(cell.model)}`}
                        className="font-semibold text-emerald-700 underline"
                      >
                        {mr ? displayModel(mr) : cell.model}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{pct(cell.accuracy)}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-600">
                      {cell.created?.slice(0, 10) ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <a
                        href={cell.card_url}
                        data-testid="axis-card-link"
                        className="font-mono text-xs text-emerald-700 underline"
                      >
                        {cell.card.slice(0, 16)}…
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 rounded-xl border border-rose-300 bg-rose-50/60 p-4 text-sm text-rose-950">
          <strong>What this ranking does not establish.</strong>{" "}
          {matrix.what_this_does_not_establish}
        </p>
      </div>
    );
  }

  // ── the index ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          Measurement, not certification
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
          Measured models
        </h1>
        <p className="mt-3 max-w-3xl text-base text-gray-700">
          Every model we have run against the signed card set, ranked by how much of it we actually
          measured. Each filled cell is one model on one axis on one date, recorded in a file
          stamped so that anyone can confirm offline that it has not been edited since. Most cells
          are empty, and the empty ones are shown.
        </p>
        <p className="mt-3 max-w-3xl rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <strong className="font-semibold">About the date.</strong> {matrix.as_of_field}. It is not
          the time this page was rendered.{" "}
          {matrix.as_of && (
            <>
              Newest record: <span className="font-mono">{matrix.as_of.slice(0, 10)}</span>.
            </>
          )}
        </p>
        <div className="mt-3">
          <SetWarning what="It is a benchmark corpus of small model runs." />
        </div>
      </header>

      {/* sizes before you click */}
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Models measured", c.models, "each run against at least one axis"],
          ["Axes in this set", c.axes, "benchmark axes, not board axes"],
          ["Cells filled", c.cells, `of ${c.possible_cells} possible pairs`],
          ["Cells with a signature", c.signed_cells, "each re-checkable offline"],
        ].map(([label, value, hint]) => (
          <div key={String(label)} className="rounded-xl border border-gray-200 bg-white p-3">
            <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</dt>
            <dd className="mt-1 font-mono text-2xl text-gray-900">{String(value)}</dd>
            <p className="text-xs text-gray-600">{hint}</p>
          </div>
        ))}
      </dl>

      <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <strong>Most of this matrix is empty, and that is the honest part.</strong>{" "}
        {matrix.what_a_cell_is} Coverage is {c.cells} of {c.possible_cells} pairs — see the coverage
        map below.
      </p>

      {/* view switcher */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-gray-300" role="group" aria-label="View">
          {(
            [
              ["models", `Models · ${c.models}`],
              ["axes", `Axes · ${c.axes}`],
              ["matrix", `Coverage map · ${c.cells}/${c.possible_cells}`],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              data-testid={`view-${v}`}
              className={`px-3 py-2 text-xs font-bold ${
                view === v ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
              } first:rounded-l-lg last:rounded-r-lg`}
            >
              {label}
            </button>
          ))}
        </div>
        {view === "models" && (
          <>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter models…"
              aria-label="Filter models"
              data-testid="model-search"
              className="min-w-[10rem] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={axisFilter}
              onChange={(e) => setAxisFilter(e.target.value)}
              aria-label="Filter by axis"
              data-testid="model-axis-filter"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">Every axis</option>
              {matrix.axes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} ({a.models} models)
                </option>
              ))}
            </select>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
              aria-label="Sort models"
              data-testid="model-sort"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="cards">Most measured</option>
              <option value="best">Best single score</option>
              <option value="mean">Best average</option>
              <option value="name">Name A–Z</option>
            </select>
          </>
        )}
      </div>

      {view === "models" && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm" data-testid="models-table">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-2 font-semibold">Model</th>
                <th className="px-4 py-2 text-right font-semibold">Axes measured</th>
                <th className="px-4 py-2 text-right font-semibold">Best score</th>
                <th className="px-4 py-2 text-right font-semibold">Average</th>
                <th className="px-4 py-2 font-semibold">Which axes</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 align-top">
                  <td className="px-4 py-2">
                    <Link
                      href={`/board/models?model=${encodeURIComponent(m.id)}`}
                      data-testid={`model-row-${m.id}`}
                      className="font-semibold text-emerald-700 underline"
                    >
                      {displayModel(m)}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {m.axes.length}
                    <span className="block text-[10px] text-gray-500">of {c.axes}</span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono">{pct(m.best_accuracy)}</td>
                  <td className="px-4 py-2 text-right font-mono">{pct(m.mean_accuracy)}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {m.axes.map((ax) => (
                        <Link
                          key={ax}
                          href={`/board/models?axis=${encodeURIComponent(ax)}`}
                          className="rounded border border-gray-300 px-1.5 py-0.5 font-mono text-[10px] text-gray-700 hover:border-gray-600"
                        >
                          {ax}
                        </Link>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "axes" && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[600px] text-left text-sm" data-testid="axes-table">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-2 font-semibold">Axis (card set)</th>
                <th className="px-4 py-2 text-right font-semibold">Models run</th>
                <th className="px-4 py-2 text-right font-semibold">Best score</th>
                <th className="px-4 py-2 text-right font-semibold">Average</th>
                <th className="px-4 py-2 font-semibold">Last measured</th>
              </tr>
            </thead>
            <tbody>
              {[...matrix.axes]
                .sort((a, b) => b.models - a.models)
                .map((a) => (
                  <tr key={a.id} className="border-b border-gray-100">
                    <td className="px-4 py-2">
                      <Link
                        href={`/board/models?axis=${encodeURIComponent(a.id)}`}
                        data-testid={`axis-row-${a.id}`}
                        className="font-semibold text-emerald-700 underline"
                      >
                        {a.id}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{a.models}</td>
                    <td className="px-4 py-2 text-right font-mono">{pct(a.best_accuracy)}</td>
                    <td className="px-4 py-2 text-right font-mono">{pct(a.mean_accuracy)}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-600">
                      {a.as_of?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "matrix" && (
        <div className="mt-4">
          <p className="mb-3 text-sm text-gray-700">
            One column per axis, one row per model. Each filled cell shows the score as a whole
            percentage and links to its signed record; hover a cell for the exact figure and date.
            An empty cell means that pair was never measured — it is <strong>not</strong> a score of
            zero, and a measured zero appears as <span className="font-mono">0·</span>.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-xs" data-testid="coverage-matrix">
              <thead className="border-b border-gray-200 bg-gray-50 text-[10px] uppercase text-gray-600">
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 font-semibold">Model</th>
                  {matrix.axes.map((a) => (
                    <th key={a.id} className="px-2 py-2 text-center font-semibold">
                      <Link href={`/board/models?axis=${encodeURIComponent(a.id)}`} className="underline">
                        {a.id}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100">
                    <td className="sticky left-0 z-10 bg-white px-3 py-1.5 font-semibold">
                      <Link
                        href={`/board/models?model=${encodeURIComponent(m.id)}`}
                        className="text-emerald-700 underline"
                      >
                        {displayModel(m)}
                      </Link>
                    </td>
                    {matrix.axes.map((a) => {
                      const cell = (cellsBy.byModel[m.id] ?? []).find((x) => x.axis === a.id);
                      return (
                        <td key={a.id} className="px-2 py-1.5 text-center">
                          {cell ? (
                            <CellLink c={cell} />
                          ) : (
                            <span
                              className="font-mono text-[10px] text-gray-300"
                              title="never measured — not a zero"
                            >
                              ·
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
        </div>
      )}

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-rose-300 bg-rose-50/60 p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-rose-900">
            What this set does NOT establish
          </h2>
          <p className="mt-2 text-sm text-rose-950">{matrix.what_this_does_not_establish}</p>
          <p className="mt-2 text-sm text-rose-950">{matrix.not_the_board}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Check any of it yourself
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Every cell above links to its own record. Open one, recompute the hash of its body, and
            check the signature against the published key — nothing is sent to us and nothing needs
            our permission.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <a
              href="/signed/HOW-TO-VERIFY.md"
              className="rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white hover:bg-emerald-700"
            >
              The verification steps
            </a>
            <a
              href="/signed/card-matrix.json"
              className="rounded-lg border border-gray-300 px-3 py-2 font-semibold text-gray-800 hover:border-gray-500"
            >
              This index as data
            </a>
            <Link
              href="/board"
              className="rounded-lg border border-gray-300 px-3 py-2 font-semibold text-gray-800 hover:border-gray-500"
            >
              How every set relates
            </Link>
          </div>
          {matrix.display_name_policy.withheld_names > 0 && (
            <p className="mt-3 border-t border-gray-200 pt-3 text-xs text-gray-600">
              <strong>{matrix.display_name_policy.withheld_names}</strong> of the recorded model
              names is a retired internal brand this site does not publish, so it is listed under a
              neutral label. {matrix.display_name_policy.where_the_name_still_lives}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
