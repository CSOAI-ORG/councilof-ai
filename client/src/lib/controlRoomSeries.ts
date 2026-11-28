/**
 * controlRoomSeries — pure builders for the /status control-room strip.
 *
 * Input is public/interop/control-room/series.json (a verbatim copy of dated files in the repo).
 * Rules, enforced here so they can be tested:
 *   · No smoothing, no rounding, no interpolation. A value is a value some file stated.
 *   · A gap is a gap. A day or round with no file is absent from the series, and a line is broken
 *     wherever two consecutive points are further apart than `maxGapMs`; it is never drawn across.
 *   · Every point keeps the address of the file it came from.
 *   · A series with one point says "one measurement". A view with no point says there is none.
 */

export type CanaryRow = { date: string; endpoint_id: string; status: string };
export type WatchdogRun = { path: string; as_of: string; sources_probed: number; reachable: number; unreachable: number | null; uncheckable: number | null };
export type X402Round = { path: string; as_of: string; counts: Record<string, number> };
export type SeriesFile = {
  schema?: string;
  canary?: CanaryRow[];
  watchdog_runs?: WatchdogRun[];
  x402_rounds?: X402Round[];
  skipped?: Array<{ path: string; reason: string }>;
};

export type View = "week" | "all";
export const WEEK_MS = 7 * 24 * 3600 * 1000;
/** Two points further apart than this are not joined by a line. */
export const DEFAULT_MAX_GAP_MS = 36 * 3600 * 1000;

export type Point = { t: number; y: number; n: number; as_of: string; path: string };

const ms = (iso: string): number => Date.parse(iso);
const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

/** Keep points inside the view. "all" keeps everything; "week" keeps the 7 days up to and including nowMs. */
export function inView<T extends { t: number }>(points: T[], view: View, nowMs: number): T[] {
  return view === "all" ? points : points.filter((p) => p.t >= nowMs - WEEK_MS && p.t <= nowMs);
}

/** Split into runs of consecutive points no further apart than maxGapMs. Each run is drawn as one line. */
export function breakSegments<T extends { t: number }>(points: T[], maxGapMs = DEFAULT_MAX_GAP_MS): T[][] {
  const out: T[][] = [];
  for (const p of [...points].sort((a, b) => a.t - b.t)) {
    const cur = out[out.length - 1];
    if (cur && p.t - cur[cur.length - 1].t <= maxGapMs) cur.push(p);
    else out.push([p]);
  }
  return out;
}

/** "one measurement" / "no measurement in this view" / "n measurements". */
export function countSentence(n: number): string {
  return n === 0 ? "no measurement in this view" : n === 1 ? "one measurement" : `${n} measurements`;
}

/** Sources reachable (y) out of sources probed (n), per run. Runs with unusable fields are not points. */
export function watchdogPoints(runs: WatchdogRun[]): Point[] {
  return runs
    .filter((r) => isNum(r.reachable) && isNum(r.sources_probed) && Number.isFinite(ms(r.as_of)))
    .map((r) => ({ t: ms(r.as_of), y: r.reachable, n: r.sources_probed, as_of: r.as_of, path: r.path }))
    .sort((a, b) => a.t - b.t);
}

/** Rows that answered a correct 402 challenge (y) out of rows probed (n = counts.total), per round. */
export function x402Points(rounds: X402Round[]): Point[] {
  return rounds
    .filter((r) => isNum(r.counts?.challenge_402) && isNum(r.counts?.total) && Number.isFinite(ms(r.as_of)))
    .map((r) => ({ t: ms(r.as_of), y: r.counts.challenge_402, n: r.counts.total, as_of: r.as_of, path: r.path }))
    .sort((a, b) => a.t - b.t);
}

/** One round's count of every key it stated, as a table row (keys differ between rounds and are kept as stated). */
export function x402CountKeys(rounds: X402Round[]): string[] {
  const keys = new Set<string>();
  for (const r of rounds) for (const k of Object.keys(r.counts ?? {})) keys.add(k);
  return [...keys].sort();
}

export type CanaryDay = { date: string; statuses: Record<string, number>; endpoints: Array<{ endpoint_id: string; status: string }> };

/** Canary rows grouped by day. A day with no row is absent. Counts are counts of rows, one row per endpoint per day. */
export function canaryByDay(rows: CanaryRow[]): CanaryDay[] {
  const days = new Map<string, CanaryDay>();
  for (const r of rows) {
    if (typeof r.date !== "string" || typeof r.endpoint_id !== "string" || typeof r.status !== "string") continue;
    const d = days.get(r.date) ?? { date: r.date, statuses: {}, endpoints: [] };
    d.statuses[r.status] = (d.statuses[r.status] ?? 0) + 1;
    d.endpoints.push({ endpoint_id: r.endpoint_id, status: r.status });
    days.set(r.date, d);
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export type CanaryGrid = {
  endpoints: string[];
  dates: string[];
  /** cell[endpoint][date] = status the row stated, or undefined where there is no row (a gap). */
  cell: Record<string, Record<string, string | undefined>>;
  statuses: string[];
};

/** Endpoint × day grid of the status stated by each row. Two rows for one endpoint-day keep both, joined by " + ". */
export function canaryGrid(rows: CanaryRow[], view: View, nowMs: number): CanaryGrid {
  const t = (r: CanaryRow) => Date.parse(`${r.date}T23:59:59Z`);
  const kept = rows.filter((r) => Number.isFinite(t(r))).filter((r) => (view === "all" ? true : t(r) >= nowMs - WEEK_MS && t(r) - 86399000 <= nowMs));
  const endpoints = [...new Set(kept.map((r) => r.endpoint_id))].sort();
  const dates = [...new Set(kept.map((r) => r.date))].sort();
  const cell: CanaryGrid["cell"] = {};
  for (const e of endpoints) cell[e] = {};
  for (const r of kept) {
    const prev = cell[r.endpoint_id][r.date];
    cell[r.endpoint_id][r.date] = prev === undefined ? r.status : `${prev} + ${r.status}`;
  }
  return { endpoints, dates, cell, statuses: [...new Set(kept.map((r) => r.status))].sort() };
}

/** Plot geometry for one series in a w×h box. Pure arithmetic on the stated values; no smoothing. */
export function plotLines(points: Point[], w: number, h: number, maxGapMs = DEFAULT_MAX_GAP_MS) {
  if (!points.length) return { segments: [] as string[], dots: [] as Array<{ x: number; y: number; p: Point }>, yMax: 0, tMin: 0, tMax: 0 };
  const tMin = Math.min(...points.map((p) => p.t));
  const tMax = Math.max(...points.map((p) => p.t));
  const yMax = Math.max(...points.map((p) => Math.max(p.y, p.n)));
  const x = (t: number) => (tMax === tMin ? w / 2 : ((t - tMin) / (tMax - tMin)) * w);
  const y = (v: number) => (yMax === 0 ? h : h - (v / yMax) * h);
  const dots = points.map((p) => ({ x: x(p.t), y: y(p.y), p }));
  const segments = breakSegments(points, maxGapMs)
    .filter((s) => s.length > 1)
    .map((s) => s.map((p) => `${x(p.t).toFixed(1)},${y(p.y).toFixed(1)}`).join(" "));
  return { segments, dots, yMax, tMin, tMax };
}
