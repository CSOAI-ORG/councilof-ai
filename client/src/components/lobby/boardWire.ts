import { useEffect, useState } from "react";

/**
 * boardWire — the FULL live board, read in-process by the Council OS native panes.
 *
 * WHY THIS EXISTS BESIDE lib/gspcAxes.ts. That module merges the wire over a
 * bundled snapshot so the living board always has rows to draw. It also drops the
 * fields a working pane needs to be honest — `leader`, `separation`,
 * `separation_p`, `interval`, `fleet_mean`, and (since 2026-08-26) `dataset_url`,
 * the resolvable bank URL /api/gspc now publishes per axis.
 *
 * THE HARD RULE HERE: THERE IS NO SNAPSHOT FALLBACK. A pane that hands a reader a
 * takeaway artefact — an evidence index, an embed snippet — must never build it
 * from a stale bundled copy while looking live. If GET /api/gspc does not answer,
 * this reader reports the failure and the panes render NOTHING rather than a
 * number that is not on the board today. Honest absence, never a fabricated row.
 *
 * Nothing in this module types a count. Every total is derived from the payload,
 * or read from `totals.public_count`, which the API itself derives.
 */

export type Separation = "SEPARATED" | "TIE" | "UNTESTED";
export type WireStatus = "MEASURED" | "UNMEASURED" | "DRAFT" | "SPEC" | "PLANNED";

export interface WireAxis {
  axis: string;
  bench: string;
  task: string;
  n: number;
  n_note?: string;
  /** The board LEADER's accuracy. Only ever read when `quotableWire()` is true. */
  accuracy?: number;
  accuracy_is?: string;
  leader?: string;
  separation: Separation;
  separation_p?: number;
  separation_basis?: string;
  interval?: [number, number];
  fleet_mean?: number;
  fleet?: string;
  macro_f1?: number;
  unparsed_rate?: number;
  status: WireStatus;
  /** Bare bank slug, e.g. "csoai/gspc-gov". Never construct one — it will 404. */
  dataset?: string;
  /** The bank resolved to a fetchable URL by /api/gspc. Absent → show no link. */
  dataset_url?: string;
  note?: string;
}

export interface WireLane {
  axis: string;
  bench: string;
  task: string;
  n: number;
  accuracy?: number;
  status: string;
  leader?: string;
  note?: string;
}

export interface WireBoard {
  axes: WireAxis[];
  inLane: WireLane[];
  /** The API's own derived sentence, e.g. "22 axes · 15 measured". Never typed. */
  publicCount: string;
  measuredOn: string;
  issuer: string;
  doi: string;
  license: string;
  limitations: string[];
}

export type WireState =
  | { phase: "loading" }
  | { phase: "ready"; board: WireBoard }
  | { phase: "failed"; error: string };

/** The structural guard: a row may carry a number only when it earned one. */
export const quotableWire = (a: WireAxis): boolean =>
  a.status === "MEASURED" && a.n > 0 && typeof a.accuracy === "number";

/** A separation determination has actually been run on this bank. */
export const determined = (a: WireAxis): boolean => a.separation !== "UNTESTED";

/** How the axis reads in one word, for a badge or a row chip. */
export function stateWord(a: WireAxis): "separated" | "tie" | "untested" | "unmeasured" {
  if (a.status !== "MEASURED") return "unmeasured";
  if (a.separation === "SEPARATED") return "separated";
  if (a.separation === "TIE") return "tie";
  return "untested";
}

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

function readAxis(w: any): WireAxis | null {
  if (!w || typeof w.axis !== "string" || !w.axis) return null;
  const sep = w.separation === "SEPARATED" || w.separation === "TIE" ? w.separation : "UNTESTED";
  const iv = Array.isArray(w.interval) && w.interval.length === 2
    && typeof w.interval[0] === "number" && typeof w.interval[1] === "number"
    ? ([w.interval[0], w.interval[1]] as [number, number])
    : undefined;
  return {
    axis: w.axis,
    bench: str(w.bench),
    task: str(w.task),
    n: num(w.n) ?? 0,
    n_note: w.n_note ? str(w.n_note) : undefined,
    accuracy: num(w.accuracy),
    accuracy_is: w.accuracy_is ? str(w.accuracy_is) : undefined,
    leader: w.leader ? str(w.leader) : undefined,
    separation: sep,
    separation_p: num(w.separation_p),
    separation_basis: w.separation_basis ? str(w.separation_basis) : undefined,
    interval: iv,
    fleet_mean: num(w.fleet_mean),
    fleet: w.fleet ? str(w.fleet) : undefined,
    macro_f1: num(w.macro_f1),
    unparsed_rate: num(w.unparsed_rate),
    status: (["MEASURED", "UNMEASURED", "DRAFT", "SPEC", "PLANNED"] as const).includes(w.status)
      ? w.status
      : "UNMEASURED",
    dataset: w.dataset ? str(w.dataset) : undefined,
    dataset_url: w.dataset_url ? str(w.dataset_url) : undefined,
    note: w.note ? str(w.note) : undefined,
  };
}

export async function fetchBoard(signal?: AbortSignal): Promise<WireBoard> {
  const r = await fetch("/api/gspc", { signal, headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`GET /api/gspc → HTTP ${r.status}`);
  const ct = (r.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("text/html")) throw new Error("GET /api/gspc returned HTML, not JSON");
  const j: any = await r.json();
  const rows: WireAxis[] = (Array.isArray(j?.axes) ? j.axes : [])
    .map(readAxis)
    .filter((a: WireAxis | null): a is WireAxis => a !== null);
  if (!rows.length) throw new Error("GET /api/gspc carried no axis");

  const lane: WireLane[] = (Array.isArray(j?.measured_in_lane) ? j.measured_in_lane : [])
    .filter((w: any) => w && typeof w.axis === "string")
    .map((w: any) => ({
      axis: w.axis,
      bench: str(w.bench),
      task: str(w.task),
      n: num(w.n) ?? 0,
      accuracy: num(w.accuracy),
      status: str(w.status, "UNMEASURED"),
      leader: w.leader ? str(w.leader) : undefined,
      note: w.note ? str(w.note) : undefined,
    }));

  const measuredOn = typeof j?.measured_on === "string"
    ? j.measured_on
    : str(j?.measured_on?.date);

  return {
    axes: rows,
    inLane: lane,
    // Derived by the API from measured_axes / quotable_axes — never typed here.
    publicCount: str(j?.totals?.public_count),
    measuredOn,
    issuer: str(j?.issuer),
    doi: str(j?.doi),
    license: str(j?.totals?.license),
    limitations: Array.isArray(j?.limitations) ? j.limitations.filter((x: any) => typeof x === "string") : [],
  };
}

/** Read the live board once. Failure is reported, never papered over. */
export function useBoardWire(): WireState {
  const [state, setState] = useState<WireState>({ phase: "loading" });
  useEffect(() => {
    const ac = new AbortController();
    fetchBoard(ac.signal)
      .then((board) => setState({ phase: "ready", board }))
      .catch((e: any) => {
        if (ac.signal.aborted) return;
        setState({ phase: "failed", error: String(e?.message ?? e) });
      });
    return () => ac.abort();
  }, []);
  return state;
}

/** A signed card actually published under /signals — read, never derived from an axis name. */
export interface SignalCard {
  slug: string;
  status: string;
  contentId: string;
  path: string;
}

export async function fetchSignalCards(signal?: AbortSignal): Promise<SignalCard[]> {
  const r = await fetch("/signals/_index.json", { signal, headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`GET /signals/_index.json → HTTP ${r.status}`);
  const j: any = await r.json();
  const rows: any[] = Array.isArray(j?.signals) ? j.signals : [];
  return rows
    .filter((s) => s && typeof s.axis === "string" && s.axis)
    .map((s) => ({
      slug: String(s.axis),
      status: str(s.status, "UNMEASURED"),
      contentId: str(s.content_id),
      path: `/signals/${String(s.axis)}.signed.json`,
    }));
}

export type CardsState =
  | { phase: "loading" }
  | { phase: "ready"; cards: SignalCard[] }
  | { phase: "failed"; error: string };

export function useSignalCards(): CardsState {
  const [state, setState] = useState<CardsState>({ phase: "loading" });
  useEffect(() => {
    const ac = new AbortController();
    fetchSignalCards(ac.signal)
      .then((cards) => setState({ phase: "ready", cards }))
      .catch((e: any) => {
        if (ac.signal.aborted) return;
        setState({ phase: "failed", error: String(e?.message ?? e) });
      });
    return () => ac.abort();
  }, []);
  return state;
}
