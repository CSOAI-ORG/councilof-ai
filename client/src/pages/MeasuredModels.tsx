import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import { modelHref } from "@/lib/livingBoard";
import ModelCountKey from "@/components/ModelCountKey";

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
 *
 * ── OUR OWN MODELS ARE LISTED APART, NEVER RANKED AMONG THIRD-PARTY ONES ─────
 * Ownership is read from models[].kind, which the producer classifies on the raw
 * card name (scripts/build-own-model-disclosure.mjs rules). It is never guessed
 * here from a name prefix: if the index carries no kind, the page shows the
 * "did not load" box rather than a list it cannot group. There is no "best
 * average" or "best single score" sort: averages over different axis subsets
 * cannot be compared, and a ranking sort with a "not a ranking" label only
 * guards the phrase.
 */

type ZeroFlag = "AXIS_FLOOR" | "MODEL_FLOOR";
interface Cell {
  model: string;
  axis: string;
  accuracy: number | null;
  /** A zero that points at the scoring rather than the model (see Matrix.zero_flag_rule). */
  zero_flag?: ZeroFlag;
  created: string | null;
  card: string;
  card_url: string;
  signed: boolean;
  alg: string | null;
  pubkey: string | null;
}
type ModelKind = "third_party" | "own" | "own_unconfirmed";
const KINDS: ModelKind[] = ["third_party", "own", "own_unconfirmed"];
/** Group order and headings — the same three groups, in the same order, as /models-measured/. */
const KIND_LABEL: Record<ModelKind, string> = {
  third_party: "Third-party models",
  own: "Our own models — listed apart, never compared",
  own_unconfirmed: "Names that suggest a model we derived, unconfirmed",
};
interface ModelRow {
  id: string;
  kind: ModelKind;
  zero_not_quotable?: number;
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
  /** build-card-matrix rule 7: mean/best below are over these third-party rows only. */
  models_third_party?: number;
  zero_not_quotable?: number;
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
  zero_flag_rule?: Record<string, string>;
  counts: Record<string, number | string>;
  axes: AxisRow[];
  models: ModelRow[];
  cells: Cell[];
}

const pct = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);

/** A summary figure that is null because every cell behind it was a flagged zero. */
const pctOrNotQuotable = (v: number | null, flagged: number | undefined) =>
  v === null && (flagged ?? 0) > 0 ? "not quotable" : pct(v);

/** Plain words for why a zero is not quoted. */
const ZERO_REASON: Record<ZeroFlag, string> = {
  AXIS_FLOOR:
    "every model scored exactly zero on this bank, so the zero points at the scoring rather than the model",
  MODEL_FLOOR:
    "this model scored exactly zero on every bank it was run on while other models scored above zero, so the zero points at the scoring rather than the model",
};

function ScoreCell({ c }: { c: Cell }) {
  if (c.zero_flag)
    return (
      <span data-testid="zero-not-quotable" title={ZERO_REASON[c.zero_flag]}>
        {pct(c.accuracy)} · not quotable
        <span className="block font-sans text-[11px] text-amber-800">{ZERO_REASON[c.zero_flag]}</span>
      </span>
    );
  return <>{pct(c.accuracy)}</>;
}
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
      .then((d) => {
        if (cancelled) return;
        // Ownership is the producer's to declare. An index without it cannot be grouped, and
        // guessing it from a name prefix here is exactly what the producer exists to prevent.
        const ok =
          d && Array.isArray(d.models) && d.models.every((m: any) => KINDS.includes(m?.kind)) &&
          typeof d.counts?.models_third_party === "number";
        if (!ok) setErr("the index does not say which models are our own, so it cannot be listed safely");
        else setM(d);
      })
      .catch((e) => !cancelled && setErr(String(e?.message ?? e)));
    return () => {
      cancelled = true;
    };
  }, []);
  return { matrix: m, error: err };
}

// ───────────────────────────────────────────────────────────── shared bits

function CellLink({ c }: { c: Cell }) {
  if (c.zero_flag)
    return (
      <a
        href={c.card_url}
        data-testid="cell-card"
        title={`${c.axis} · scored ${pct(c.accuracy)} · not quotable: ${ZERO_REASON[c.zero_flag]} · opens the signed record`}
        className="inline-block whitespace-nowrap rounded border border-amber-400 bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] leading-none text-amber-900 hover:border-amber-700"
      >
        0<span aria-hidden="true">⚠</span>
        <span className="sr-only">per cent, not quotable, signed record</span>
      </a>
    );
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

/** The own-model label a single-model or single-axis view carries. */
function OwnLabel({ kind }: { kind: ModelKind }) {
  if (kind === "third_party") return null;
  return (
    <p className="mt-2 rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm text-gray-800" data-testid="own-model-label">
      {kind === "own"
        ? "One of our own models (a prompt overlay or specialist on a stock base model). It is listed apart and never compared with third-party models; the public board removes our own models before any comparison."
        : "This name suggests a model we derived, and the owner has not confirmed it either way. It is listed apart and never compared with third-party models."}{" "}
      <a href="/independence/" className="underline">
        How we handle our own models
      </a>
      .
    </p>
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

  const [view, setView] = useState<"models" | "axis" | "matrix">("models");
  const [query, setQuery] = useState("");
  const [axisFilter, setAxisFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"cards" | "name">("cards");

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
      return b.cards - a.cards || displayModel(a).localeCompare(displayModel(b));
    });
  }, [matrix, axisFilter, query, sortKey]);

  /** The same rows, split into the three ownership groups, in the fixed group order. Search and
   *  the axis filter apply within each group. */
  const grouped = useMemo(
    () => KINDS.map((k) => ({ kind: k, rows: models.filter((m) => m.kind === k) })),
    [models],
  );
  const allGrouped = useMemo(
    () => KINDS.map((k) => ({ kind: k, rows: (matrix?.models ?? []).filter((m) => m.kind === k) })),
    [matrix],
  );

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
        <OwnLabel kind={m.kind} />
        <p className="mt-3 font-mono text-sm text-gray-600">
          {m.cards} signed records · measured on {m.axes.length} of the card set's axes · last
          measured {m.as_of?.slice(0, 10) ?? "no date"}
        </p>
        <div className="mt-4">
          <SetWarning what="These are the axes this model was actually run against." />
        </div>
        {m.kind === "third_party" && m.axes.some((ax) => ax === "gov" || ax === "care") && (
          <p className="mt-3 rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-800" data-testid="board-instrument-note">
            The public board measured this model on{" "}
            {m.axes.includes("gov") && m.axes.includes("care") ? "governance and care" : m.axes.includes("gov") ? "governance" : "care"}{" "}
            with a different instrument (GovBench / CareBench, scored from published per-item rows).
            The card here and the board's figure are separate records and are never substituted for
            each other:{" "}
            <a href={modelHref(m.id)} className="font-semibold underline">
              see this model on the public board
            </a>
            .
          </p>
        )}

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
                  <td className="px-4 py-2 text-right font-mono">
                    <ScoreCell c={cell} />
                  </td>
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

  // ── a single axis: third-party cells first, our own apart, nothing numbered ──
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

        {KINDS.map((kind) => {
          const group = cells.filter((cell) => matrix.models.find((x) => x.id === cell.model)?.kind === kind);
          if (!group.length) return null;
          return (
            <section key={kind} className="mt-6" data-testid={`axis-group-${kind}`}>
              <h2 className="text-lg font-bold text-gray-900">
                {KIND_LABEL[kind]} ({group.length})
              </h2>
              <div className="mt-2 overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Model</th>
                      <th className="px-4 py-2 text-right font-semibold">Score</th>
                      <th className="px-4 py-2 font-semibold">Measured</th>
                      <th className="px-4 py-2 font-semibold">The signed record</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((cell) => {
                      const mr = matrix.models.find((x) => x.id === cell.model);
                      return (
                        <tr key={cell.card} className="border-b border-gray-100">
                          <td className="px-4 py-2">
                            <Link
                              href={`/board/models?model=${encodeURIComponent(cell.model)}`}
                              className="font-semibold text-emerald-700 underline"
                            >
                              {mr ? displayModel(mr) : cell.model}
                            </Link>
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            <ScoreCell c={cell} />
                          </td>
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
            </section>
          );
        })}
        <p className="mt-3 text-xs text-gray-600">
          No position is numbered and no leader is named: these are single scores on one small bank,
          with no separation test behind them. Our own models are listed apart and never compared.
        </p>

        <p className="mt-4 rounded-xl border border-rose-300 bg-rose-50/60 p-4 text-sm text-rose-950">
          <strong>What these scores do not establish.</strong>{" "}
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
          Every model we have run against the signed card set, listed by how much of it we actually
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
          // Third-party only (scripts/build-card-matrix.mjs splits the set, 6 Oct 2026): the bare
          // total counted our own model tags in with everyone else's. Ours are listed apart below.
          ["Models measured", c.models_third_party, `third-party; our own ${c.models_own} (+${c.models_own_unconfirmed} unconfirmed) are in this set and listed apart, never compared`],
          ["Axes in this set", c.axes, "benchmark axis, not board axis"],
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

      <ModelCountKey className="mt-3 max-w-3xl" />

      {/* view switcher */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-gray-300" role="group" aria-label="View">
          {(
            [
              ["models", "Models"],
              ["axis", `Axes · ${c.axes}`],
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
              <option value="name">Name A–Z</option>
            </select>
          </>
        )}
      </div>

      {view === "models" &&
        grouped.map(({ kind, rows }) => {
          const total = allGrouped.find((g) => g.kind === kind)?.rows.length ?? 0;
          return (
            <section key={kind} className="mt-6" data-testid={`models-group-${kind}`}>
              <h2 className="text-lg font-bold text-gray-900">
                {KIND_LABEL[kind]} ({total})
                {rows.length !== total && (
                  <span className="ml-2 text-sm font-normal text-gray-600">· {rows.length} match the filter</span>
                )}
              </h2>
              {kind !== "third_party" && (
                <p className="mt-1 text-sm text-gray-700">
                  {kind === "own"
                    ? "Prompt overlays and specialists we built on stock base models. Listed so the work is visible; the public board removes them before any comparison."
                    : "Names that suggest a model we derived. The owner has not confirmed them either way, so they are kept out of the third-party list."}
                </p>
              )}
              {rows.length === 0 ? (
                <p className="mt-2 text-sm text-gray-600">No model in this group matches the filter.</p>
              ) : (
                <div className="mt-2 overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="w-full min-w-[720px] text-left text-sm" data-testid={`models-table-${kind}`}>
                    <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Model</th>
                        <th className="px-4 py-2 text-right font-semibold">Axes measured</th>
                        <th className="px-4 py-2 text-right font-semibold">Best score</th>
                        <th className="px-4 py-2 text-right font-semibold">Average</th>
                        <th className="px-4 py-2 font-semibold">Which axis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((m) => (
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
                          <td className="px-4 py-2 text-right font-mono">{pctOrNotQuotable(m.best_accuracy, m.zero_not_quotable)}</td>
                          <td className="px-4 py-2 text-right font-mono">{pctOrNotQuotable(m.mean_accuracy, m.zero_not_quotable)}</td>
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
            </section>
          );
        })}
      {view === "models" && (
        <p className="mt-3 text-xs text-gray-600">
          Best score and average are each model's own figures over the axes it happens to have, so
          they cannot be compared across models and the list is not sorted by them.
        </p>
      )}

      {view === "axis" && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[600px] text-left text-sm" data-testid="axes-table">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-2 font-semibold">Axis (card set)</th>
                <th className="px-4 py-2 text-right font-semibold">Models run</th>
                <th className="px-4 py-2 text-right font-semibold">Best third-party score</th>
                <th className="px-4 py-2 text-right font-semibold">Third-party average</th>
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
                    <td className="px-4 py-2 text-right font-mono">
                      {a.models}
                      {typeof a.models_third_party === "number" && (
                        <span className="block text-[10px] text-gray-500">{a.models_third_party} third-party</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{a.models_third_party === 0 ? "no third-party model" : pctOrNotQuotable(a.best_accuracy, a.zero_not_quotable)}</td>
                    <td className="px-4 py-2 text-right font-mono">{a.models_third_party === 0 ? "no third-party model" : pctOrNotQuotable(a.mean_accuracy, a.zero_not_quotable)}</td>
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
            zero. A zero that other models beat on the same bank appears as{" "}
            <span className="font-mono">0·</span>; a zero flagged as a likely scoring failure appears
            as <span className="font-mono">0⚠</span> and is not quoted. Our own models are listed
            apart, below the third-party rows.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            {/* Opts OUT of the base-layer whole-word table sizing (styles/index.css): this matrix has a
                sticky model column, and sized from whole model ids it would fill a phone. */}
            <table className="w-full text-left text-xs [word-break:break-word]" data-testid="coverage-matrix">
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
                {grouped.map(({ kind, rows }) => (
                  <Fragment key={kind}>
                    {rows.length > 0 && (
                      <tr className="border-b border-gray-200 bg-gray-100" data-testid={`matrix-group-${kind}`}>
                        <td colSpan={matrix.axes.length + 1} className="sticky left-0 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-700">
                          {KIND_LABEL[kind]} ({rows.length})
                        </td>
                      </tr>
                    )}
                {rows.map((m) => (
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
                  </Fragment>
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
              className="rounded-lg bg-emerald-700 px-3 py-2 font-bold text-white hover:bg-emerald-800"
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
