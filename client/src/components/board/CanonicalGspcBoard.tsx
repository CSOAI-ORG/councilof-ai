import { Fragment, useEffect, useMemo, useState } from "react";
import {
  countLine,
  hasFigure,
  pct,
  useGspcBoard,
  type GspcAxis,
  type GspcPayload,
} from "./useGspcBoard";
import HumanVsAiPanel from "./HumanVsAiPanel";
import HfHubCardsView, { useHfHubCards } from "./HfHubCardsView";

export const GSPC_HF_SPACE_URL =
  "https://huggingface.co/spaces/csoai/gspc-board";
export const CANONICAL_BOARD_POLL_MS = 60_000;

export type BoardFamilyFilter = "all" | "gspc" | "financial";
export type BoardEvidenceFilter =
  "all" | "figures" | "withheld" | "facts" | "gaps";
export type BoardSortKey = "axis" | "kind" | "n" | "figure" | "evidence";
export type BoardSortDirection = "asc" | "desc";

export type AxisRankingState =
  | "PUBLISHED_ROWS"
  | "POINT_LEADER_ONLY"
  | "WITHHELD"
  | "NOT_PUBLISHED"
  | "NOT_APPLICABLE"
  | "INVALID";
export type AxisRankingSort = "figure" | "coverage" | "model";

export interface AxisRankingRow {
  model: string;
  accuracy: number;
  n: number;
  precision: number | null;
  recall: number | null;
  /** Competition-style position by observed figure; not a statistical rank. */
  displayPosition: number;
  /** True only when another published row has this exact numeric figure. */
  sameFigure: boolean;
  /** The published figure is a lower bound rather than a point estimate. */
  lowerBound: boolean;
  source: "per_model" | "point_leader";
}

export interface AxisRankingView {
  state: AxisRankingState;
  rows: AxisRankingRow[];
  published: number;
  omitted: number;
  note: string;
}

export interface BoardQuery {
  text: string;
  family: BoardFamilyFilter;
  evidence: BoardEvidenceFilter;
  sort: BoardSortKey;
  direction: BoardSortDirection;
}

const DEFAULT_QUERY: BoardQuery = {
  text: "",
  family: "all",
  evidence: "all",
  sort: "axis",
  direction: "asc",
};

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const humanState = (state: string): string =>
  state.toLowerCase().replaceAll("_", " ");

/**
 * The current public board taxonomy. Old Arena/16-slot identifiers deliberately
 * stay out: those are different instruments and cannot fill a current GSPC row.
 */
export const CURRENT_MODEL_AXIS_IDS = new Set([
  "governance",
  "safety",
  "provenance",
  "continuity",
  "conformance",
  "openness",
  "machinery-conformity",
  "care",
  "cross-reality",
  "detector-interop",
  "art5-safeguard",
  "swarm",
  "affect",
  "jail",
]);

const finiteUnit = (value: unknown): number | null =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 1
    ? value
    : null;

const positiveInteger = (value: unknown): number | null =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value > 0 &&
  value <= 10_000_000
    ? value
    : null;

const safeModelName = (value: unknown): string | null => {
  const name = text(value);
  if (!name || name.length > 160 || /[\u0000-\u001f\u007f]/.test(name))
    return null;
  return name;
};

/**
 * Read only current-axis result rows explicitly published by /api/gspc.
 * The linked Hugging Face dataset is a frozen item bank, not a ranking feed.
 * A historical Arena Elo file or card matrix must never be silently joined in.
 */
export function axisModelRanking(axis: GspcAxis): AxisRankingView {
  if (axis.kind === "deterministic-facts") {
    return {
      state: "NOT_APPLICABLE",
      rows: [],
      published: 0,
      omitted: 0,
      note: "This axis measures deterministic facts. No model ranking applies.",
    };
  }
  if (
    axis.kind !== "model-comparison" ||
    !CURRENT_MODEL_AXIS_IDS.has(axis.axis)
  ) {
    return {
      state: "NOT_PUBLISHED",
      rows: [],
      published: 0,
      omitted: 0,
      note: "No current-board model-ranking contract is published for this axis.",
    };
  }
  if (axis.status !== "MEASURED") {
    return {
      state: "NOT_PUBLISHED",
      rows: [],
      published: 0,
      omitted: 0,
      note: "This current-board axis does not declare a measured model cohort.",
    };
  }

  const raw = axis.per_model;
  if (raw !== undefined) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return {
        state: "INVALID",
        rows: [],
        published: 0,
        omitted: 0,
        note: "The per-model field is malformed, so no partial ranking is shown.",
      };
    }
    const entries = Object.entries(raw as Record<string, unknown>);
    if (!entries.length || entries.length > 100) {
      return {
        state: entries.length ? "INVALID" : "NOT_PUBLISHED",
        rows: [],
        published: 0,
        omitted: 0,
        note: entries.length
          ? "The per-model field exceeds the bounded publication contract."
          : "No per-model result rows are published for this axis.",
      };
    }

    const seen = new Set<string>();
    const parsed: AxisRankingRow[] = [];
    let excluded = 0;
    for (const [rawModel, rawResult] of entries) {
      const model = safeModelName(rawModel);
      const result =
        rawResult && typeof rawResult === "object" && !Array.isArray(rawResult)
          ? (rawResult as Record<string, unknown>)
          : null;
      const accuracy = finiteUnit(result?.accuracy);
      const n = positiveInteger(result?.n);
      const dedupe = model?.toLowerCase();
      if (
        !model ||
        !dedupe ||
        seen.has(dedupe) ||
        !result ||
        accuracy === null ||
        n === null
      ) {
        return {
          state: "INVALID",
          rows: [],
          published: 0,
          omitted: 0,
          note: "A per-model row is malformed or duplicated, so no partial ranking is shown.",
        };
      }
      seen.add(dedupe);
      if (result.quotable === false) {
        excluded += 1;
        continue;
      }
      parsed.push({
        model,
        accuracy,
        n,
        precision: finiteUnit(result.precision),
        recall: finiteUnit(result.recall),
        displayPosition: 0,
        sameFigure: false,
        lowerBound: false,
        source: "per_model",
      });
    }

    parsed.sort(
      (a, b) =>
        b.accuracy - a.accuracy || b.n - a.n || a.model.localeCompare(b.model),
    );
    for (let index = 0; index < parsed.length; index += 1) {
      const prior = parsed[index - 1];
      parsed[index].displayPosition =
        prior && prior.accuracy === parsed[index].accuracy
          ? prior.displayPosition
          : index + 1;
    }
    for (const row of parsed) {
      row.sameFigure = parsed.some(
        (other) => other !== row && other.accuracy === row.accuracy,
      );
    }
    const rows = parsed.slice(0, 9);
    return {
      state: rows.length ? "PUBLISHED_ROWS" : "NOT_PUBLISHED",
      rows,
      published: parsed.length,
      omitted: Math.max(0, parsed.length - rows.length) + excluded,
      note: rows.length
        ? `${parsed.length} comparable per-model result row${parsed.length === 1 ? "" : "s"} published; up to nine are shown.`
        : "No quotable per-model result rows are published for this axis.",
    };
  }

  const leader = safeModelName(axis.leader);
  if (leader && hasFigure(axis) && positiveInteger(axis.n) !== null) {
    return {
      state: "POINT_LEADER_ONLY",
      rows: [
        {
          model: leader,
          accuracy: axis.accuracy as number,
          n: axis.n as number,
          precision: null,
          recall: null,
          displayPosition: 1,
          sameFigure: false,
          lowerBound: Boolean(text(axis.accuracy_is)),
          source: "point_leader",
        },
      ],
      published: 1,
      omitted: 0,
      note:
        axis.separation === "TIE"
          ? "Only the point leader is published; the lead is a TIE, not a measured advantage. Eight seats remain unfilled."
          : "Only the public point leader is published. Eight seats remain unfilled until comparable per-model rows are published.",
    };
  }

  if (text(axis.public_leader_state)) {
    return {
      state: "WITHHELD",
      rows: [],
      published: 0,
      omitted: 0,
      note: `Model ranking withheld: ${humanState(axis.public_leader_state as string)}.`,
    };
  }
  return {
    state: "NOT_PUBLISHED",
    rows: [],
    published: 0,
    omitted: 0,
    note: "No comparable per-model result rows are published for this axis.",
  };
}

export function sortAxisRankingRows(
  rows: AxisRankingRow[],
  sort: AxisRankingSort,
): AxisRankingRow[] {
  return [...rows].sort((a, b) => {
    if (sort === "model") return a.model.localeCompare(b.model);
    if (sort === "coverage")
      return (
        b.n - a.n ||
        a.displayPosition - b.displayPosition ||
        a.model.localeCompare(b.model)
      );
    return (
      a.displayPosition - b.displayPosition || a.model.localeCompare(b.model)
    );
  });
}

export function safeHfDatasetUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "huggingface.co")
      return null;
    if (!/^\/datasets\/csoai\/[A-Za-z0-9._-]+\/?$/.test(url.pathname))
      return null;
    return url.href;
  } catch {
    return null;
  }
}

export function safeRunUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return /^\/(?!\/)[A-Za-z0-9._~!$&'()*+,;=:@%/-]+$/.test(value) ? value : null;
}

export function axisEvidenceState(axis: GspcAxis): string {
  if (axis.status !== "MEASURED") return text(axis.status) ?? "UNCHECKABLE";
  if (axis.kind === "deterministic-facts") {
    if (axis.run_attestation === "ED25519_SIGNED")
      return "MEASURED · SOURCE REPORTS ED25519 SIGNED";
    if (axis.run_attestation === "CONTENT_ADDRESSED_UNSIGNED") {
      return "MEASURED · CONTENT-ADDRESSED UNSIGNED";
    }
    return "MEASURED · RUN AUTH NOT DECLARED";
  }
  if (hasFigure(axis))
    return `MEASURED · ${text(axis.separation) ?? "SEPARATION NOT DECLARED"}`;
  if (text(axis.public_leader_state)) {
    return `MEASURED · ${humanState(axis.public_leader_state as string).toUpperCase()}`;
  }
  return "MEASURED · NO PUBLIC FIGURE";
}

export function axisEvidenceKind(
  axis: GspcAxis,
): Exclude<BoardEvidenceFilter, "all"> {
  if (axis.status !== "MEASURED") return "gaps";
  if (axis.kind === "deterministic-facts") return "facts";
  return hasFigure(axis) ? "figures" : "withheld";
}

function compareNullableNumber(
  a: number | null,
  b: number | null,
  direction: BoardSortDirection,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direction === "asc" ? a - b : b - a;
}

/** Filter/sort is presentation only; null figures remain null and always sort last. */
export function selectBoardRows(
  axes: GspcAxis[],
  query: BoardQuery,
): GspcAxis[] {
  const needle = query.text.trim().toLowerCase();
  const selected = axes.filter((axis) => {
    if (query.family !== "all" && axis.family !== query.family) return false;
    if (query.evidence !== "all" && axisEvidenceKind(axis) !== query.evidence)
      return false;
    if (!needle) return true;
    return [
      axis.axis,
      axis.bench,
      axis.task,
      axis.kind,
      axis.family,
      axis.status,
      axis.n_unit,
      axis.coverage,
    ].some(
      (value) =>
        typeof value === "string" && value.toLowerCase().includes(needle),
    );
  });

  return selected
    .map((axis, index) => ({ axis, index }))
    .sort((left, right) => {
      const a = left.axis;
      const b = right.axis;
      let compared = 0;
      if (query.sort === "n") {
        compared = compareNullableNumber(
          typeof a.n === "number" && Number.isFinite(a.n) ? a.n : null,
          typeof b.n === "number" && Number.isFinite(b.n) ? b.n : null,
          query.direction,
        );
      } else if (query.sort === "figure") {
        compared = compareNullableNumber(
          hasFigure(a) ? (a.accuracy as number) : null,
          hasFigure(b) ? (b.accuracy as number) : null,
          query.direction,
        );
      } else {
        const av =
          query.sort === "axis"
            ? a.axis
            : query.sort === "kind"
              ? (a.kind ?? "")
              : axisEvidenceState(a);
        const bv =
          query.sort === "axis"
            ? b.axis
            : query.sort === "kind"
              ? (b.kind ?? "")
              : axisEvidenceState(b);
        compared = av.localeCompare(bv) * (query.direction === "asc" ? 1 : -1);
      }
      return compared || left.index - right.index;
    })
    .map(({ axis }) => axis);
}

export function boardMeasurementDate(data: GspcPayload | null): string | null {
  return text(data?.measured_on?.date);
}

export function boardSnapshotState(data: GspcPayload | null): string {
  const stamp = data?.measured_on?.living_stamp;
  if (!stamp || typeof stamp !== "object")
    return "SNAPSHOT ATTESTATION NOT DECLARED";
  const record = stamp as Record<string, unknown>;
  const state = text(record.verification_state);
  if (state) return `SOURCE-REPORTED ${state}`;
  if (record.signed === true && record.verifiable === true)
    return "SOURCE REPORTS SIGNED · NOT REVERIFIED HERE";
  if (record.signed === true)
    return "SOURCE REPORTS SIGNED · VERIFICATION NOT DECLARED";
  return "SOURCE REPORTS NOT SIGNED";
}

function isoForScreen(value: string | null): string {
  if (!value) return "not observed";
  return value.replace("T", " ").replace(/\.\d{3}Z$/, "Z");
}

function figureLabel(axis: GspcAxis): string {
  if (hasFigure(axis))
    return `${axis.accuracy_is ? "≥" : ""}${pct(axis.accuracy as number)}`;
  if (axis.kind === "deterministic-facts") return "Not applicable";
  if (axis.status === "MEASURED") return "No public leader";
  return "Not measured";
}

function evidenceTone(axis: GspcAxis): string {
  if (axis.status !== "MEASURED")
    return "border-slate-300 bg-slate-100 text-slate-700";
  if (axis.separation === "SEPARATED") {
    return "border-emerald-600/25 bg-emerald-50 text-emerald-800";
  }
  if (
    axis.run_attestation === "ED25519_SIGNED" ||
    axis.run_attestation === "CONTENT_ADDRESSED_UNSIGNED" ||
    axis.separation === "TIE"
  ) {
    return "border-slate-300 bg-white text-slate-700";
  }
  return "border-emerald-700/20 bg-[#fafaf7] text-emerald-900";
}

function SortButton({
  label,
  column,
  query,
  onSort,
}: {
  label: string;
  column: BoardSortKey;
  query: BoardQuery;
  onSort: (column: BoardSortKey) => void;
}) {
  const active = query.sort === column;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="inline-flex items-center gap-1 rounded-sm text-left outline-none hover:text-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-700"
    >
      {label}
      <span aria-hidden="true">
        {active ? (query.direction === "asc" ? " ↑" : " ↓") : " ↕"}
      </span>
    </button>
  );
}

function AxisRankingDisclosure({
  axis,
  measurementDate,
}: {
  axis: GspcAxis;
  measurementDate: string | null;
}) {
  const ranking = useMemo(() => axisModelRanking(axis), [axis]);
  const [sort, setSort] = useState<AxisRankingSort>("figure");
  const [selectedModel, setSelectedModel] = useState("all");
  const sorted = useMemo(
    () => sortAxisRankingRows(ranking.rows, sort),
    [ranking.rows, sort],
  );
  const selected =
    selectedModel === "all"
      ? sorted
      : sorted.filter((row) => row.model === selectedModel);
  const emptySeats =
    selectedModel === "all" && ranking.state !== "NOT_APPLICABLE"
      ? Math.max(0, 9 - selected.length)
      : 0;
  const hf = safeHfDatasetUrl(axis.dataset_url);
  const summary =
    ranking.state === "NOT_APPLICABLE"
      ? "Model table · not applicable"
      : ranking.state === "WITHHELD"
        ? "Model table · withheld"
        : ranking.state === "INVALID"
          ? "Model table · source invalid"
          : ranking.state === "POINT_LEADER_ONLY"
            ? "Full model table not published · point leader only"
            : ranking.state === "NOT_PUBLISHED"
              ? "Full model table not published"
              : `${ranking.published}/9 comparable model seats published`;

  return (
    <details
      data-testid={`axis-model-table-${axis.axis}`}
      className="rounded-xl border border-emerald-950/10 bg-[#fafaf7]"
    >
      <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold text-emerald-900 outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true">＋</span>
          {summary}
        </span>
      </summary>
      <div className="border-t border-emerald-950/10 p-4">
        <p className="max-w-4xl text-xs leading-relaxed text-slate-700">
          {ranking.note} Observed score order is a display order, not a claim
          that adjacent models are statistically distinct.
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
          <span>
            Result rows: current <code>/api/gspc</code> axis payload.
          </span>
          <span>
            Board measurement dates: {measurementDate ?? "not declared"}.
          </span>
          <span>
            Row signatures: not separately verified in this browser view.
          </span>
          {hf && (
            <a
              href={hf}
              className="font-semibold text-emerald-800 underline underline-offset-2"
            >
              Frozen HF item bank (not the ranking feed)
            </a>
          )}
        </div>

        {ranking.state === "NOT_APPLICABLE" ? (
          <p className="mt-4 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700">
            This run measures facts about instruments or public series. It has
            no model cohort, accuracy contest or top-nine model table.
          </p>
        ) : (
          <>
            {ranking.rows.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="text-[11px] font-semibold text-slate-700">
                  Show model
                  <select
                    aria-label={`Show a published model for ${axis.axis}`}
                    value={selectedModel}
                    onChange={(event) => setSelectedModel(event.target.value)}
                    className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-normal text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                  >
                    <option value="all">All published seats</option>
                    {ranking.rows.map((row) => (
                      <option key={row.model} value={row.model}>
                        {row.model}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] font-semibold text-slate-700">
                  Display order
                  <select
                    aria-label={`Sort published models for ${axis.axis}`}
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value as AxisRankingSort)
                    }
                    className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-normal text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                  >
                    <option value="figure">Observed accuracy</option>
                    <option value="coverage">Usable n</option>
                    <option value="model">Model name</option>
                  </select>
                </label>
              </div>
            )}

            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[48rem] text-left text-xs">
                <caption className="sr-only">
                  Up to nine comparable model results explicitly published for
                  the {axis.axis} axis. Empty seats remain empty.
                </caption>
                <thead className="bg-emerald-950/5 text-[10px] uppercase tracking-wide text-slate-600">
                  <tr>
                    <th scope="col" className="px-3 py-2">
                      Score order
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Model
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Published figure
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Usable n
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Precision
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Recall
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Interpretation
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selected.map((row) => (
                    <tr key={row.model}>
                      <td className="px-3 py-2 font-mono tabular-nums text-slate-700">
                        {row.sameFigure ? "=" : ""}
                        {row.displayPosition}
                      </td>
                      <th
                        scope="row"
                        className="px-3 py-2 font-semibold text-[#04120c]"
                      >
                        {row.model}
                      </th>
                      <td className="px-3 py-2 font-mono tabular-nums text-slate-900">
                        {row.lowerBound ? "≥" : ""}
                        {pct(row.accuracy)}
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-slate-900">
                        {row.n}
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-slate-700">
                        {row.precision === null
                          ? "not published"
                          : pct(row.precision)}
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-slate-700">
                        {row.recall === null
                          ? "not published"
                          : pct(row.recall)}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.sameFigure
                          ? "same published figure"
                          : axis.separation === "TIE"
                            ? "TIE — no measured advantage"
                            : row.source === "point_leader"
                              ? "point leader only"
                              : "published result row"}
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: emptySeats }, (_, index) => (
                    <tr key={`empty-${index}`} className="text-slate-500">
                      <td className="px-3 py-2 font-mono">
                        {selected.length + index + 1}
                      </td>
                      <td className="px-3 py-2" colSpan={6}>
                        Not published on this current axis
                      </td>
                    </tr>
                  ))}
                  {selected.length === 0 && emptySeats === 0 && (
                    <tr>
                      <td className="px-3 py-3 text-slate-600" colSpan={7}>
                        The selected model is not in the published top-nine
                        result rows.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </details>
  );
}

export function CanonicalGspcBoardView({
  data,
  error,
  loading,
  refreshing,
  observedAt,
  sourceUrl,
  compact = false,
  heading = "One table, every published axis",
  highlight = null,
  onOpenBoard,
  onSelect,
  showHumanPanel = false,
  onRefresh,
}: {
  data: GspcPayload | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  observedAt: string | null;
  sourceUrl: string | null;
  compact?: boolean;
  heading?: string;
  highlight?: string | null;
  onOpenBoard?: () => void;
  onSelect?: (axis: string) => void;
  showHumanPanel?: boolean;
  onRefresh: () => void;
}) {
  const [query, setQuery] = useState<BoardQuery>(DEFAULT_QUERY);
  const axes = Array.isArray(data?.axes) ? data.axes : [];
  const rows = useMemo(() => selectBoardRows(axes, query), [axes, query]);
  const shown = compact ? rows.slice(0, 6) : rows;
  const count = countLine(data);
  const measurementDate = boardMeasurementDate(data);
  const snapshotState = boardSnapshotState(data);

  useEffect(() => {
    if (!highlight || typeof document === "undefined") return;
    document
      .getElementById(`canonical-axis-${highlight}`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlight]);

  const sortBy = (column: BoardSortKey) => {
    setQuery((current) => ({
      ...current,
      sort: column,
      direction:
        current.sort === column && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <section
      data-testid="canonical-gspc-board"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="border-b border-border bg-[#fafaf7] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800">
              Canonical living board
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-[#04120c]">
              {heading}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
              {count ?? "Counts arrive from the board endpoint."} Figures, fact
              runs and withheld leader states are different evidence and stay
              different here. This is measurement, not certification.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || refreshing}
            className="rounded-xl border border-emerald-800/20 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 outline-none transition hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:cursor-wait disabled:opacity-60"
          >
            {refreshing ? "Refreshing…" : "Refresh board"}
          </button>
        </div>

        <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-emerald-800/10 bg-white px-3 py-2">
            <dt className="font-semibold uppercase tracking-wide text-slate-600">
              Read state
            </dt>
            <dd className="mt-1 font-mono text-emerald-900">
              {error ? "UNREACHABLE" : data ? "RUNTIME_OBSERVED" : "READING"}
            </dd>
          </div>
          <div className="rounded-xl border border-emerald-800/10 bg-white px-3 py-2">
            <dt className="font-semibold uppercase tracking-wide text-slate-600">
              Browser observed
            </dt>
            <dd className="mt-1 font-mono text-slate-800">
              {isoForScreen(observedAt)}
            </dd>
          </div>
          <div className="rounded-xl border border-emerald-800/10 bg-white px-3 py-2">
            <dt className="font-semibold uppercase tracking-wide text-slate-600">
              Measurement dates
            </dt>
            <dd className="mt-1 text-slate-800">
              {measurementDate ?? "not declared by source"}
            </dd>
          </div>
          <div className="rounded-xl border border-emerald-800/10 bg-white px-3 py-2">
            <dt className="font-semibold uppercase tracking-wide text-slate-600">
              Board envelope (API-reported)
            </dt>
            <dd className="mt-1 font-mono text-slate-800">{snapshotState}</dd>
            <dd className="mt-1 text-[10px] leading-relaxed text-slate-500">
              Not reverified in this browser. Axis run states are separate.
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
          <a
            className="text-emerald-800 underline underline-offset-2"
            href={sourceUrl ?? "/api/gspc"}
          >
            Board JSON
          </a>
          <a
            className="text-emerald-800 underline underline-offset-2"
            href={GSPC_HF_SPACE_URL}
          >
            Hugging Face mirror
          </a>
          <span className="font-normal text-slate-600">
            Auto-read every 60 s while this tab is visible.
          </span>
        </div>
      </div>

      {error && (
        <div
          className="m-4 rounded-xl border border-rose-600/25 bg-rose-50 p-4"
          role="alert"
        >
          <p className="font-semibold text-rose-900">
            The latest board read failed. No cached figures are shown as live.
          </p>
          <p className="mt-1 text-sm text-rose-800">{error}</p>
        </div>
      )}

      {loading && !error && (
        <p
          className="px-5 py-10 text-center text-sm text-slate-600"
          role="status"
        >
          Reading GET /api/gspc…
        </p>
      )}

      {data && !error && (
        <>
          {!compact && (
            <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-3">
              <label className="text-xs font-semibold text-slate-700">
                Find an axis
                <input
                  type="search"
                  value={query.text}
                  onChange={(event) =>
                    setQuery((current) => ({
                      ...current,
                      text: event.target.value,
                    }))
                  }
                  placeholder="e.g. safety or issuer"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Family
                <select
                  value={query.family}
                  onChange={(event) =>
                    setQuery((current) => ({
                      ...current,
                      family: event.target.value as BoardFamilyFilter,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                >
                  <option value="all">All families</option>
                  <option value="gspc">Behavioural model axes</option>
                  <option value="financial">Deterministic fact axes</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Evidence
                <select
                  value={query.evidence}
                  onChange={(event) =>
                    setQuery((current) => ({
                      ...current,
                      evidence: event.target.value as BoardEvidenceFilter,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                >
                  <option value="all">All evidence states</option>
                  <option value="figures">Public figures</option>
                  <option value="withheld">Measured, leader withheld</option>
                  <option value="facts">Deterministic facts</option>
                  <option value="gaps">Not measured / gaps</option>
                </select>
              </label>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[62rem] text-left text-sm">
              <caption className="sr-only">
                GSPC axes from the canonical board endpoint. Sort order is
                presentation, not a ranking.
              </caption>
              <thead className="border-b border-border bg-emerald-950 text-emerald-50">
                <tr className="text-[11px] uppercase tracking-wide">
                  <th
                    scope="col"
                    aria-sort={
                      query.sort === "axis"
                        ? query.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className="px-4 py-3"
                  >
                    <SortButton
                      label="Axis"
                      column="axis"
                      query={query}
                      onSort={sortBy}
                    />
                  </th>
                  <th
                    scope="col"
                    aria-sort={
                      query.sort === "kind"
                        ? query.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className="px-4 py-3"
                  >
                    <SortButton
                      label="Instrument"
                      column="kind"
                      query={query}
                      onSort={sortBy}
                    />
                  </th>
                  <th
                    scope="col"
                    aria-sort={
                      query.sort === "figure"
                        ? query.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className="px-4 py-3"
                  >
                    <SortButton
                      label="Public figure"
                      column="figure"
                      query={query}
                      onSort={sortBy}
                    />
                  </th>
                  <th
                    scope="col"
                    aria-sort={
                      query.sort === "n"
                        ? query.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className="px-4 py-3"
                  >
                    <SortButton
                      label="Coverage / n"
                      column="n"
                      query={query}
                      onSort={sortBy}
                    />
                  </th>
                  <th
                    scope="col"
                    aria-sort={
                      query.sort === "evidence"
                        ? query.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className="px-4 py-3"
                  >
                    <SortButton
                      label="Evidence state"
                      column="evidence"
                      query={query}
                      onSort={sortBy}
                    />
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Sources
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.map((axis) => {
                  const hf = safeHfDatasetUrl(axis.dataset_url);
                  const run = safeRunUrl(axis.evidence_url);
                  return (
                    <Fragment key={axis.axis}>
                      <tr
                        id={`canonical-axis-${axis.axis}`}
                        className={`align-top transition ${highlight?.toLowerCase() === axis.axis.toLowerCase() ? "bg-emerald-50" : "hover:bg-emerald-50/50"}`}
                      >
                        <th
                          scope="row"
                          className="px-4 py-4 font-semibold text-[#04120c]"
                        >
                          {onSelect ? (
                            <button
                              type="button"
                              onClick={() => onSelect(axis.axis)}
                              className="rounded-sm text-left underline-offset-2 outline-none hover:text-emerald-800 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-700"
                            >
                              {axis.axis}
                            </button>
                          ) : (
                            axis.axis
                          )}
                          {axis.bench && (
                            <span className="mt-1 block text-xs font-normal text-slate-600">
                              {axis.bench}
                            </span>
                          )}
                          {axis.task && (
                            <span className="mt-1 block max-w-[28rem] text-xs font-normal leading-relaxed text-slate-600">
                              {axis.task}
                            </span>
                          )}
                        </th>
                        <td className="px-4 py-4 text-xs text-slate-700">
                          <span className="font-semibold text-slate-900">
                            {axis.kind ? humanState(axis.kind) : "not declared"}
                          </span>
                          <span className="mt-1 block">
                            {axis.family
                              ? humanState(axis.family)
                              : "family not declared"}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-mono font-semibold tabular-nums text-slate-900">
                          {figureLabel(axis)}
                          {axis.leader && hasFigure(axis) && (
                            <span className="mt-1 block max-w-[14rem] font-sans text-xs font-normal text-slate-600">
                              {axis.leader}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-700">
                          <span className="font-mono text-slate-900">
                            {typeof axis.n === "number"
                              ? `n=${axis.n}`
                              : "n not declared"}
                          </span>
                          {axis.n_unit && (
                            <span className="mt-1 block">{axis.n_unit}</span>
                          )}
                          {axis.coverage && (
                            <span className="mt-1 block max-w-[15rem]">
                              {axis.coverage}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex max-w-[17rem] rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${evidenceTone(axis)}`}
                          >
                            {axisEvidenceState(axis)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <div className="flex flex-col items-start gap-1.5">
                            {hf ? (
                              <a
                                className="font-semibold text-emerald-800 underline underline-offset-2"
                                href={hf}
                              >
                                HF bank
                              </a>
                            ) : (
                              <span className="text-slate-600">
                                No HF bank URL
                              </span>
                            )}
                            {run && (
                              <a
                                className="font-semibold text-emerald-800 underline underline-offset-2"
                                href={run}
                              >
                                Run artifact
                              </a>
                            )}
                            {!run && axis.kind === "deterministic-facts" && (
                              <span className="text-rose-800">
                                No run artifact published
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-4 pb-4 pt-0" colSpan={6}>
                          <AxisRankingDisclosure
                            axis={axis}
                            measurementDate={measurementDate}
                          />
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {shown.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-600">
              No published axis matches these filters.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-[#fafaf7] px-4 py-3 text-xs text-slate-600">
            <span>
              Showing {shown.length} of {axes.length} axes · null is never
              rendered as zero.
            </span>
            {compact && onOpenBoard && (
              <button
                type="button"
                onClick={onOpenBoard}
                className="font-semibold text-emerald-800 underline underline-offset-2"
              >
                Open all axes and filters →
              </button>
            )}
          </div>
          {showHumanPanel && <HumanVsAiPanel data={data} className="m-4" />}
        </>
      )}
    </section>
  );
}

export default function CanonicalGspcBoard({
  compact = false,
  heading,
  highlight,
  onOpenBoard,
  onSelect,
  showHumanPanel = false,
  className = "",
}: {
  compact?: boolean;
  heading?: string;
  highlight?: string | null;
  onOpenBoard?: () => void;
  onSelect?: (axis: string) => void;
  showHumanPanel?: boolean;
  className?: string;
}) {
  const [surface, setSurface] = useState<"board" | "hf-cards">("board");
  const board = useGspcBoard({ pollMs: CANONICAL_BOARD_POLL_MS });
  const hubCards = useHfHubCards(CURRENT_MODEL_AXIS_IDS);
  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="GSPC evidence populations"
        className="mb-3 flex flex-wrap gap-2 rounded-xl border border-emerald-950/10 bg-[#fafaf7] p-2"
        data-testid="canonical-board-view-switcher"
      >
        <button
          type="button"
          role="tab"
          aria-selected={surface === "board"}
          onClick={() => setSurface("board")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${surface === "board" ? "bg-emerald-950 text-white" : "bg-white text-emerald-900"}`}
        >
          Current 22-axis board
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={surface === "hf-cards"}
          onClick={() => setSurface("hf-cards")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${surface === "hf-cards" ? "bg-emerald-950 text-white" : "bg-white text-emerald-900"}`}
        >
          HF model cards
          {hubCards.data ? ` · ${hubCards.data.cells.length}` : " · reading live count"}
        </button>
        <span className="self-center px-1 text-[11px] text-slate-600">
          Separate cohorts; never combined into one rank.
        </span>
      </div>
      {surface === "board" ? (
        <CanonicalGspcBoardView
          {...board}
          compact={compact}
          heading={heading}
          highlight={highlight}
          onOpenBoard={onOpenBoard}
          onSelect={onSelect}
          showHumanPanel={showHumanPanel}
          onRefresh={() => {
            void board.refresh();
          }}
        />
      ) : (
        <HfHubCardsView
          data={hubCards.data}
          error={hubCards.error}
          loading={hubCards.loading}
          observedAt={hubCards.observedAt}
          onRetry={hubCards.retry}
        />
      )}
    </div>
  );
}
