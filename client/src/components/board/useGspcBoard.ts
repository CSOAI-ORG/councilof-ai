/**
 * useGspcBoard — the single live read of GET /api/gspc for every board surface.
 *
 * WHY A SHARED HOOK. LiveLeaderboard and HumanVsAiPanel both need the board, and
 * both may sit on the same page. One module-level promise means one request, one
 * failure mode, one truth on screen. There is no fallback payload and no seeded
 * sample: if the endpoint does not answer, `error` is set and the components say
 * so in words. A placeholder number is a lie with a nice font.
 *
 * NOTHING HERE INVENTS A FIELD. Every accessor is optional and every derived
 * value is `null` when the payload does not carry it. Counts (how many axes, how
 * many measured) come from `totals` — never from a constant in this file.
 */
import { useEffect, useState } from "react";

export interface GspcAxis {
  axis: string;
  bench?: string;
  task?: string;
  n?: number;
  n_note?: string;
  /** What an n counts, when it is not bank items (e.g. "issuer accounts"). */
  n_unit?: string;
  /** "gspc" (the behavioural axes) or "financial" (the financial/domain axes). */
  family?: "gspc" | "financial" | string;
  /**
   * The measurement KIND. Load-bearing for display: a `deterministic-facts` axis
   * is measured but has no fleet and therefore no leader, no accuracy and no
   * applicable separation test — which is a different fact from a `declared-slot`
   * axis, which has no measurement at all. Reading absence without reading kind
   * is what let a signed mainnet run render as "UNMEASURED".
   */
  kind?: "model-comparison" | "deterministic-facts" | "declared-slot" | string;
  /** How much of the axis's own declared universe was covered. The figure a facts axis HAS. */
  coverage?: string;
  coverage_note?: string;
  /** Absolute on-site path to the signed run, for an axis with no HuggingFace bank. */
  evidence_url?: string;
  /** The board LEADER's figure on this axis, 0–1. Absent on a slot with no measurement. */
  accuracy?: number;
  /** Set when `accuracy` is NOT a point estimate (e.g. a stated Wilson lower bound). */
  accuracy_is?: string;
  leader?: string;
  separation?: "SEPARATED" | "TIE" | "UNTESTED" | string;
  separation_p?: number;
  separation_basis?: string;
  interval?: [number, number];
  fleet?: string;
  fleet_mean?: number;
  status?: "MEASURED" | "UNMEASURED" | "DRAFT" | "SPEC" | "PLANNED" | string;
  dataset?: string;
  note?: string;
  /** Only read if the API starts publishing one. Never written by this file. */
  human_baseline?: number | { value?: number; accuracy?: number; source?: string; state?: string; note?: string };
  human_accuracy?: number;
  [k: string]: unknown;
}

export interface GspcTotals {
  axes?: number;
  measured_axes?: number;
  quotable_axes?: number;
  public_count?: string;
  separated_leads?: number;
  ties?: number;
  untested_separations?: number;
  items?: number;
  [k: string]: unknown;
}

export interface GspcPayload {
  schema?: string;
  totals?: GspcTotals;
  axes?: GspcAxis[];
  /** The internal living-board convention. Served for honesty; NOT the board. */
  measured_in_lane?: GspcAxis[];
  measured_on?: Record<string, unknown>;
  limitations?: string[];
  human_baseline?: unknown;
  site_attestation?: Record<string, unknown>;
  [k: string]: unknown;
}

export interface GspcBoardState {
  data: GspcPayload | null;
  /** Set to a human-readable reason when the board could not be read. */
  error: string | null;
  loading: boolean;
}

export const GSPC_ENDPOINT = "/api/gspc";

/** Live origin used only when the relative fetch returns HTML (prerender on localhost). */
const LIVE_GSPC = "https://councilof.ai/api/gspc";

let inflight: Promise<GspcPayload> | null = null;

async function fetchGspcPayload(url: string): Promise<GspcPayload> {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`${url} answered HTTP ${r.status}`);
  const text = await r.text();
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  // Prerender serves dist/ from localhost. /api/gspc is a Pages Function, so the
  // SPA fallback returns "<!doctype html>". Parsing that as JSON bakes
  // "The board could not be read" into every crawler snapshot even though the
  // live function answers JSON. Do not treat HTML as a board.
  if (!trimmed || trimmed.startsWith("<")) {
    throw new Error(`${url} returned HTML, not JSON`);
  }
  try {
    return JSON.parse(trimmed) as GspcPayload;
  } catch (e) {
    throw new Error(`${url} was not JSON — ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** One fetch per page load, shared by every board component. */
export function loadGspcBoard(): Promise<GspcPayload> {
  if (!inflight) {
    inflight = fetchGspcPayload(GSPC_ENDPOINT)
      .catch((e) => {
        const msg = String((e as Error)?.message ?? e);
        if (/HTML|not JSON|Unexpected token/i.test(msg)) {
          return fetchGspcPayload(LIVE_GSPC);
        }
        throw e;
      })
      .catch((e) => {
        inflight = null; // let a remount retry rather than cache a failure forever
        throw e;
      });
  }
  return inflight;
}

export function useGspcBoard(): GspcBoardState {
  const [state, setState] = useState<GspcBoardState>({ data: null, error: null, loading: true });

  useEffect(() => {
    let live = true;
    loadGspcBoard()
      .then((d) => { if (live) setState({ data: d, error: null, loading: false }); })
      .catch((e) => { if (live) setState({ data: null, error: String(e?.message ?? e), loading: false }); });
    return () => { live = false; };
  }, []);

  return state;
}

/* ── honest readers ──────────────────────────────────────────────────────── */

/** A slot carries a quotable figure only when it is MEASURED and the number is real. */
export function hasFigure(a: GspcAxis): boolean {
  return a.status === "MEASURED" && typeof a.accuracy === "number" && Number.isFinite(a.accuracy);
}

/**
 * Rows, ordered by the measured figure — with every unmeasured slot kept and
 * pushed to the end. Ordering is presentation, NOT a ranking claim: a TIE row
 * sits high on its point estimate while carrying a chip that says the lead is
 * not statistically separated.
 */
export function orderedRows(data: GspcPayload | null): GspcAxis[] {
  const axes = Array.isArray(data?.axes) ? [...(data!.axes as GspcAxis[])] : [];
  return axes.sort((x, y) => {
    const fx = hasFigure(x), fy = hasFigure(y);
    if (fx !== fy) return fx ? -1 : 1;
    if (!fx) return 0;
    return (y.accuracy as number) - (x.accuracy as number);
  });
}

/** The count line, read from the payload. Returns null rather than guessing. */
export function countLine(data: GspcPayload | null): string | null {
  const t = data?.totals;
  if (!t) return null;
  if (typeof t.public_count === "string" && t.public_count.trim()) return t.public_count;
  if (typeof t.measured_axes === "number" && typeof t.axes === "number") {
    return `${t.measured_axes} measured of ${t.axes}`;
  }
  return null;
}

export interface HumanLeg {
  /** 0–1. */
  value: number;
  label: string;
  source: string;
  /** Data state as the payload declares it — REPORTED for a cited third-party aggregate. */
  state: string;
  note?: string;
}

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1 ? v : null;

/**
 * Find a PUBLISHED human-baseline figure in the payload — and only that.
 *
 * The board's `human-vs-ai` in-lane slot is NOT a human score: it measures how
 * often a MODEL agrees with a human key. It is deliberately not matched here.
 * When nothing is published, this returns null and the panel says "not yet
 * published". It never manufactures a leg.
 */
export function findHumanBaseline(data: GspcPayload | null): HumanLeg | null {
  if (!data) return null;

  const fromObject = (o: Record<string, unknown> | undefined | null): HumanLeg | null => {
    if (!o || typeof o !== "object") return null;
    const v = num((o as any).value) ?? num((o as any).accuracy) ?? num((o as any).score);
    if (v === null) return null;
    return {
      value: v,
      label: String((o as any).label ?? (o as any).task ?? "human baseline"),
      source: String((o as any).source ?? "stated in the /api/gspc payload"),
      state: String((o as any).state ?? "REPORTED"),
      note: typeof (o as any).note === "string" ? (o as any).note : undefined,
    };
  };

  const direct = fromObject(data.human_baseline as Record<string, unknown>);
  if (direct) return direct;

  const flat = num((data.human_baseline as unknown) ?? (data.totals as any)?.human_baseline);
  if (flat !== null) {
    return { value: flat, label: "human baseline", source: "stated in the /api/gspc payload", state: "REPORTED" };
  }

  for (const a of [...(data.axes ?? []), ...(data.measured_in_lane ?? [])]) {
    const nested = fromObject(a.human_baseline as Record<string, unknown>);
    if (nested) return { ...nested, label: nested.label === "human baseline" ? `${a.axis} — human baseline` : nested.label };
    const v = num(a.human_baseline as unknown) ?? num(a.human_accuracy);
    if (v !== null) {
      return {
        value: v,
        label: `${a.axis} — human baseline`,
        source: typeof a.dataset === "string" ? a.dataset : "stated on the axis in /api/gspc",
        state: "REPORTED",
      };
    }
  }

  return null;
}

/** The in-lane human-vs-AI slot, if the payload serves one. This is the AI leg. */
export function findHumanVsAiSlot(data: GspcPayload | null): GspcAxis | null {
  const pool = [...(data?.measured_in_lane ?? []), ...(data?.axes ?? [])];
  return pool.find((a) => /human[-_\s]?vs[-_\s]?ai/i.test(a.axis)) ?? null;
}

export const pct = (v: number): string => `${(v * 100).toFixed(1)}%`;
