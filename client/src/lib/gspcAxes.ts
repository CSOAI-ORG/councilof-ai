// GSPC — the behavioural governance axes, as measured state.
//
// NOT A COUNT AUTHORITY. This file holds a local SNAPSHOT of the behavioural
// family, used as an offline fallback for the axis ROWS. It is not the board and
// its length is not the board's axis count: the board also carries the
// financial/domain family (ADR-001). Anything that renders a COUNT must derive it
// from GET /api/gspc — see client/src/lib/boardCount.ts. The header of this file
// used to say "the twelve governance axis", which is how a stale snapshot count
// ends up quoted as the board's.
//
// This is the single source of truth for every SOV OS panel. The invariant that
// matters more than anything visual: an axis only carries a score when its status
// is MEASURED. UNMEASURED / DRAFT / SPEC / PLANNED axes carry their real state and
// NO number. `quotable()` is the structural guard — panels ask it rather than
// deciding for themselves, so a surface cannot render a score an axis has not earned.

import { BOARD_COUNT_OBSERVED } from "./boardCount";
import { applyFill7ChromeHonesty } from "./fill7ChromeHonesty";

export type AxisStatus = "MEASURED" | "UNMEASURED" | "DRAFT" | "SPEC" | "PLANNED";

export interface Axis {
  axis: string;
  bench: string;
  n: number;
  macro_f1: number | null;
  accuracy: number | null;
  unparsed_rate: number;
  status: AxisStatus;
  colour: string;
  lng: number;
  lat: number;
  seat: string;
  instrument: string;
  task: string;
  note?: string;
  dataset?: string;
  dataset_url?: string;
  interval?: [number, number];
  separation?: string;
  separation_p?: number;
  kind?: string;
}

export const MEASURED_ON = { date: "2026-08-12", model: "Council-34" };

export const AXES: Axis[] = [];

export const quotable = (a: Axis): boolean =>
  a.status === "MEASURED" && a.n > 0 && typeof a.accuracy === "number" && Number.isFinite(a.accuracy);

export const hasMacroF1 = (a: Axis): boolean =>
  typeof a.macro_f1 === "number" && Number.isFinite(a.macro_f1);

export function publishedInterval(a: { interval?: [number, number] | null }): [number, number] | null {
  const iv = a.interval;
  if (!iv || iv.length !== 2) return null;
  const lo = iv[0], hi = iv[1];
  if (typeof lo !== "number" || typeof hi !== "number" || !Number.isFinite(lo) || !Number.isFinite(hi)) return null;
  return [lo, hi];
}

export function formatPublishedInterval(iv: [number, number]): string {
  return `${iv[0].toFixed(3)}–${iv[1].toFixed(3)}`;
}

export type SeparationMark = "SEPARATED" | "TIE" | "UNTESTED";

export function publishedSeparation(a: { separation?: string | null }): SeparationMark | null {
  const s = String(a.separation || "").toUpperCase();
  if (s === "SEPARATED" || s === "TIE" || s === "UNTESTED") return s;
  return null;
}

export const hasInterval = (a: Axis): boolean => quotable(a) && a.n * (1 - a.unparsed_rate) >= 30;

export function wilson(acc: number, n: number): [number, number] {
  if (!n) return [0, 0];
  const z = 1.959964, p = acc, d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
}

export const confidence = (a: Axis): number =>
  Math.max(0.12, Math.min(1, a.n / 30) * (1 - (a.unparsed_rate || 0)));

export const STATUS_TONE: Record<AxisStatus, string> = {
  MEASURED: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  UNMEASURED: "text-sky-300 border-sky-400/30 bg-sky-400/10",
  DRAFT: "text-amber-300 border-amber-400/30 bg-amber-400/10",
  SPEC: "text-violet-300 border-violet-400/30 bg-violet-400/10",
  PLANNED: "text-slate-400 border-slate-400/25 bg-slate-400/10",
};

export const COUNTS = {
  total: AXES.length,
  measured: AXES.filter(quotable).length,
  withInterval: AXES.filter(hasInterval).length,
};

export type AxesSource = "wire" | "snapshot";

export interface InLaneAxis {
  axis: string;
  bench: string;
  task: string;
  n: number;
  accuracy: number | null;
  status: string;
  note?: string;
  leader?: string;
  separation?: string;
  fleet_mean?: number | null;
  dataset?: string;
  specialist?: { name: string; rate: number; n: number } | null;
}

export interface AxesState {
  axes: Axis[];
  source: AxesSource;
  measuredOn: string;
  issuer?: string;
  doi?: string;
  publicCount?: string;
  inLane: InLaneAxis[];
  separationTally?: { separated: number; ties: number; untested: number };
  error?: string;
  loading: boolean;
}

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

async function readGspcJson(signal?: AbortSignal): Promise<any> {
  const r = await fetch("/api/gspc", { signal, headers: { accept: "application/json" } });
  const ct = (r.headers.get("content-type") || "").toLowerCase();
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  if (ct.includes("text/html")) throw new Error("HTML instead of JSON");
  const j: any = applyFill7ChromeHonesty(await r.json());
  if (!j || typeof j !== "object" || Array.isArray(j?.axes) === false) {
    throw new Error("not a GSPC payload");
  }
  return j;
}

export async function fetchAxes(signal?: AbortSignal): Promise<Omit<AxesState, "loading">> {
  try {
    let j: any;
    try {
      j = await readGspcJson(signal);
    } catch (first) {
      if (signal?.aborted) throw first;
      await new Promise((res) => setTimeout(res, 350));
      j = await readGspcJson(signal);
    }
    const live: any[] = Array.isArray(j?.axes) ? j.axes : [];
    if (!live.length) throw new Error("no axis in payload");
    const merged: Axis[] = live.map((w) => ({
      axis: w.axis,
      bench: w.bench ?? "",
      n: Number(w.n ?? 0),
      macro_f1: num(w.macro_f1) ?? null,
      accuracy: num(w.accuracy) ?? null,
      unparsed_rate: num(w.unparsed_rate) ?? 0,
      status: (w.status ?? "UNMEASURED") as AxisStatus,
      colour: w.colour ?? "#94a3b8",
      lng: 0, lat: 0,
      seat: "—",
      instrument: w.instrument ?? "—",
      task: w.task ?? "",
      note: w.note,
      dataset: w.dataset,
      dataset_url: typeof w.dataset_url === "string" ? w.dataset_url : undefined,
      interval: Array.isArray(w.interval) && w.interval.length === 2 ? [Number(w.interval[0]), Number(w.interval[1])] : undefined,
      separation: typeof w.separation === "string" ? w.separation : undefined,
      separation_p: num(w.separation_p),
      kind: typeof w.kind === "string" ? w.kind : undefined,
    }));
    const publicCount = typeof j?.totals?.public_count === "string" ? j.totals.public_count.trim() : "";
    return {
      axes: merged,
      source: "wire",
      measuredOn: j?.measured_on?.date ?? j?.measured_on ?? MEASURED_ON.date,
      issuer: j?.issuer,
      doi: j?.doi,
      publicCount: publicCount || undefined,
      inLane: [],
    };
  } catch (e: any) {
    return {
      axes: AXES,
      source: "snapshot",
      measuredOn: MEASURED_ON.date,
      inLane: [],
      error: String(e?.message ?? e),
    };
  }
}

export function publicCaption(publicCount?: string, _measured?: number, _total?: number): string {
  if (publicCount && publicCount.trim()) return publicCount.trim();
  const observed = BOARD_COUNT_OBSERVED.public_count;
  return observed && observed.trim() ? observed.trim() : "Counts from GET /api/gspc";
}

export const countOf = (axes: Axis[]) => ({
  total: axes.length,
  measured: axes.filter(quotable).length,
  withInterval: axes.filter(hasInterval).length,
});
