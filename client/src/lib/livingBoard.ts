/**
 * livingBoard — the living board's pure logic. No number is typed here: every figure comes from
 * GET /api/gspc (the authority for SEPARATED / TIE / UNTESTED and for measurement dates), from
 * /interop/gspc-fleet-2026-08-12.json (every base model's k, n and Wilson interval, produced by
 * scripts/gspc_separation_from_rows.py --fleet from the hash-bound per-item rows), from
 * /signed/card_index.json and from /root.json.
 *
 * Statistics are classical test theory: accuracy k/n, Wilson 95% intervals, and a rank spread
 * read off interval overlap. The rank spread is annotation; it never overrides the board's word.
 */

export const FLEET_URL = "/interop/gspc-fleet-2026-08-12.json";
export const FLEET_CSV_URL = "/interop/gspc-fleet-2026-08-12.csv";
export const ROWS_RECORD_SIGNED_URL = "/interop/gspc-peritem-rows-2026-08-12.signed.json";

export interface FleetModel {
  model: string;
  base_model: boolean;
  k: number;
  n: number;
  accuracy: number | null;
  wilson95: [number, number];
  rank_spread: [number, number];
}

export interface FleetAxis {
  file: string;
  sha256: string;
  distinct_items: number;
  board_determination: "SEPARATED" | "TIE" | "UNTESTED";
  models: FleetModel[];
  models_withheld?: number;
  models_withheld_ids?: string[];
  own_overlays: { count: number; excluded_before_comparison: boolean; listed: boolean };
  untested_reason_code?: string | null;
  untested_reason?: string | null;
}

export interface FleetDoc {
  schema: string;
  measured: string;
  dataset: string;
  dataset_url: string;
  dataset_revision: string;
  peritem_sha256: string;
  licence: string;
  axes: Record<string, FleetAxis>;
}

/** The subset of one /api/gspc axis this page reads. Absent fields stay absent. */
export interface BoardAxis {
  axis: string;
  kind?: string;
  family?: string;
  bench?: string;
  task?: string;
  status?: string;
  n?: number;
  separation?: string;
  separation_sentence?: string;
  separation_untested_reason?: string;
  separation_untested_reason_code?: string;
  note?: string;
  measurement_time?: {
    state?: string;
    precision?: string;
    observed_on?: string;
    observed_at?: string;
    not_after?: string;
  };
  per_model?: Record<string, { n: number; accuracy: number; quotable?: boolean; tp?: number; tn?: number }>;
}

export interface BoardDoc {
  totals?: { public_count?: string; separation_public_count?: string };
  peritem_rows?: { peritem_sha256?: string; licence?: string; dataset_url?: string };
  axes?: BoardAxis[];
}

/** The date a measurement carries, at the precision its source publishes (YYYY-MM-DD). */
export function measuredDate(a: BoardAxis): string | null {
  const t = a.measurement_time;
  const raw = t?.observed_on ?? t?.observed_at ?? t?.not_after ?? null;
  return raw && /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : null;
}

/** Whole days between a YYYY-MM-DD date and `now` (UTC). */
export function daysSince(date: string, now: Date): number {
  const then = Date.parse(`${date}T00:00:00Z`);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.round((today - then) / 86_400_000));
}

export interface Freshness {
  /** Distinct measurement dates of the model-comparison axes, oldest first. */
  comparisonDates: string[];
  /** The newest measurement on the whole board and the axis that carries it. */
  newest: { date: string; axis: string } | null;
  axesWithDate: number;
  axesTotal: number;
}

export function freshness(board: BoardDoc): Freshness {
  const axes = board.axes ?? [];
  const cmp = new Set<string>();
  let newest: Freshness["newest"] = null;
  let withDate = 0;
  for (const a of axes) {
    const d = measuredDate(a);
    if (!d) continue;
    withDate += 1;
    if (a.kind === "model-comparison") cmp.add(d);
    if (!newest || d > newest.date) newest = { date: d, axis: a.axis };
  }
  return { comparisonDates: [...cmp].sort(), newest, axesWithDate: withDate, axesTotal: axes.length };
}

/** Distinct base models with published figures in the fleet file. */
export function comparedModels(fleet: FleetDoc): string[] {
  const s = new Set<string>();
  for (const ax of Object.values(fleet.axes)) for (const m of ax.models) s.add(m.model);
  return [...s].sort();
}

export type AxisView =
  | { kind: "ranked"; axis: string; board: BoardAxis; fleet: FleetAxis; groups: RankGroup[] }
  | { kind: "withheld"; axis: string; board: BoardAxis | null; fleet: FleetAxis; reason: string }
  | { kind: "mismatch"; axis: string; board: BoardAxis | null; fleet: FleetAxis; reason: string };

export interface RankGroup {
  /** "tie" when the board says TIE and these models' spreads overlap the leader's. */
  label: "no-clear-winner" | "ordered" | "separated-leader";
  models: FleetModel[];
}

/** Do two rank spreads share at least one position? */
export function spreadsOverlap(a: [number, number], b: [number, number]): boolean {
  return a[0] <= b[1] && b[0] <= a[1];
}

/**
 * Group an axis's models for display. The board's determination is the authority:
 *  - TIE: every model whose spread overlaps the leader's spread is shown under
 *    "No clear winner (tie)"; the rest are listed after it with their own spreads.
 *  - SEPARATED: the leader is shown alone as the board's separated leader (its sentence is the
 *    board's); spreads remain annotation.
 */
export function groupAxis(determination: string, models: FleetModel[]): RankGroup[] {
  if (models.length === 0) return [];
  const [lead, ...rest] = models;
  if (determination === "SEPARATED") {
    return [
      { label: "separated-leader", models: [lead] },
      ...(rest.length ? [{ label: "ordered" as const, models: rest }] : []),
    ];
  }
  const top = models.filter((m) => spreadsOverlap(m.rank_spread, lead.rank_spread));
  const others = models.filter((m) => !top.includes(m));
  return [
    { label: "no-clear-winner", models: top },
    ...(others.length ? [{ label: "ordered" as const, models: others }] : []),
  ];
}

/**
 * Join one axis of the fleet file to the board. Fail closed: if the board and the fleet file
 * disagree on the determination, or the fleet file was computed from other rows than the board
 * binds, nothing is ranked.
 */
export function axisView(axis: string, fleet: FleetDoc, board: BoardDoc): AxisView {
  const f = fleet.axes[axis];
  const b = (board.axes ?? []).find((a) => a.axis === axis) ?? null;
  const boardRows = board.peritem_rows?.peritem_sha256;
  if (!b) return { kind: "mismatch", axis, board: null, fleet: f, reason: "This axis is not on the live board." };
  if (!boardRows || boardRows !== fleet.peritem_sha256) {
    return {
      kind: "mismatch",
      axis,
      board: b,
      fleet: f,
      reason:
        "The fleet table was computed from per-item rows the live board does not bind (peritem_sha256 differs), so it is not shown.",
    };
  }
  if ((b.separation ?? "UNTESTED") !== f.board_determination) {
    return {
      kind: "mismatch",
      axis,
      board: b,
      fleet: f,
      reason: `The live board says ${b.separation ?? "nothing"} here and the fleet table says ${f.board_determination}; positions are not shown until they agree.`,
    };
  }
  if (f.board_determination === "UNTESTED" || f.models.length === 0) {
    return {
      kind: "withheld",
      axis,
      board: b,
      fleet: f,
      reason: b.separation_untested_reason ?? f.untested_reason ?? "The board publishes no determination on this axis.",
    };
  }
  return { kind: "ranked", axis, board: b, fleet: f, groups: groupAxis(f.board_determination, f.models) };
}

export function formatSpread(s: [number, number]): string {
  return s[0] === s[1] ? `${s[0]}` : `${s[0]}–${s[1]}`;
}

export const pct1 = (v: number) => `${(v * 100).toFixed(1)}%`;

/** Our own prompt overlays (and their public aliases). The board never ranks them. */
export function isOwnModel(model: string): boolean {
  return /^(sov|council|clan)/i.test(model) || /CSOAI-owned/i.test(model);
}

/** Model ids carry ":" and "/", so the id travels as a query value: one prerendered page
 *  (/board/model) serves every model. One encoding for every link to a model page. */
export function modelHref(model: string): string {
  return `/board/model?id=${encodeURIComponent(model)}`;
}

export type ModelCell =
  | { kind: "scored"; axis: string; m: FleetModel; determination: string; positionsPublished: true }
  | { kind: "withheld"; axis: string; reason: string }
  | { kind: "not-in-fleet"; axis: string }
  | { kind: "jail"; axis: string; n: number; k: number | null; accuracy: number; fleet: string | undefined }
  | { kind: "not-a-model-axis"; axis: string };

/**
 * Every axis on the live board, from one model's point of view. Behavioural axes come from the
 * fleet file (withheld where the board publishes no determination). jail has its own 7-model
 * fleet, read from /api/gspc. Deterministic-facts axes grade records, not models.
 */
export function modelCells(model: string, fleet: FleetDoc, board: BoardDoc): ModelCell[] {
  const out: ModelCell[] = [];
  for (const b of board.axes ?? []) {
    const f = fleet.axes[b.axis];
    if (f) {
      const v = axisView(b.axis, fleet, board);
      if (v.kind === "ranked") {
        const m = f.models.find((x) => x.model === model);
        out.push(
          m
            ? { kind: "scored", axis: b.axis, m, determination: f.board_determination, positionsPublished: true }
            : { kind: "not-in-fleet", axis: b.axis },
        );
      } else if (v.kind === "withheld" && !(f.models_withheld_ids ?? []).includes(model)) {
        out.push({ kind: "not-in-fleet", axis: b.axis });
      } else {
        out.push({ kind: "withheld", axis: b.axis, reason: v.reason });
      }
      continue;
    }
    if (b.per_model) {
      const r = b.per_model[model];
      if (r && r.quotable !== false) {
        const k = typeof r.tp === "number" && typeof r.tn === "number" ? r.tp + r.tn : null;
        out.push({ kind: "jail", axis: b.axis, n: r.n, k, accuracy: r.accuracy, fleet: undefined });
      } else {
        out.push({ kind: "not-in-fleet", axis: b.axis });
      }
      continue;
    }
    if (b.kind === "model-comparison") out.push({ kind: "not-in-fleet", axis: b.axis });
    else out.push({ kind: "not-a-model-axis", axis: b.axis });
  }
  return out;
}
