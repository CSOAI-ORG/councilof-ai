/**
 * useLiveJson — one live read of a same-origin JSON endpoint, shared by every workspace surface
 * that needs it (one request per URL per page load; the promise is cached at module level).
 *
 * There is no fallback payload and no seeded sample. The three states are the three a reader can
 * be shown: "loading" (a role="status" placeholder), "ok" (the payload), "error" (said in words,
 * with the endpoint to read directly). A placeholder number is never printed.
 */
import { useEffect, useState } from "react";
import { countsLine, readClaimChecks } from "./claimChecks";

export type LiveRead<T> =
  | { state: "loading"; data: null; error: null }
  | { state: "ok"; data: T; error: null }
  | { state: "error"; data: null; error: string };

const cache = new Map<string, Promise<unknown>>();

export function fetchLiveJson(url: string): Promise<unknown> {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url, { headers: { accept: "application/json" } }).then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
    // A failed read is not cached: the next mount asks again.
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}

/** Test seam: forget every cached read. */
export function resetLiveJsonCache(): void {
  cache.clear();
}

export function useLiveJson<T = unknown>(url: string | null): LiveRead<T> & { retry: () => void } {
  const [read, setRead] = useState<LiveRead<T>>({ state: "loading", data: null, error: null });
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    fetchLiveJson(url).then(
      (data) => alive && setRead({ state: "ok", data: data as T, error: null }),
      (e) => alive && setRead({ state: "error", data: null, error: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      alive = false;
    };
  }, [url, nonce]);
  return {
    ...read,
    retry: () => {
      if (url) cache.delete(url);
      setRead({ state: "loading", data: null, error: null });
      setNonce((n) => n + 1);
    },
  } as LiveRead<T> & { retry: () => void };
}

type Obj = Record<string, unknown>;
const rec = (v: unknown): Obj | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null);
const int = (v: unknown): number | null => (typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** A figure the workspace may print: the value, what it counts, where it was read and when. */
export interface Figure {
  value: string;
  label: string;
  source: string;
  as_of: string | null;
}

/** /api/state → card_chain.bodies_verified_valid (corpus 3, kind measured). Null when absent. */
export function verifiedCardsFigure(state: unknown): Figure | null {
  const f = rec(rec(rec(state)?.card_chain)?.bodies_verified_valid);
  const n = int(f?.value);
  if (n === null) return null;
  return { value: String(n), label: "signed cards in the index verify", source: "/api/state → card_chain.bodies_verified_valid", as_of: str(f?.as_of) };
}

/** /api/state → ledgers.corrections_in_this_deploy. */
export function correctionsFigure(state: unknown): Figure | null {
  const c = rec(rec(rec(state)?.ledgers)?.corrections_in_this_deploy);
  const n = int(c?.count);
  if (n === null) return null;
  const head = str(c?.head_id);
  return { value: String(n), label: head ? `corrections published · newest ${head}` : "corrections published", source: "/api/state → ledgers.corrections_in_this_deploy", as_of: null };
}

/** /api/state → ledgers.claim_maintenance.counts, each outcome named; never summed into one number. */
export function claimMaintenanceFigure(state: unknown, now: Date = new Date()): Figure | null {
  // Counted from the check rows for TODAY (claimChecks.ts), never from the run-time counts: a row the
  // last run wrote NOT_YET_DUE whose due date has since passed is overdue (7 Oct 2026 retest).
  const r = readClaimChecks(state, now);
  if (!r) return null;
  return {
    value: countsLine(r),
    label: `scheduled re-checks, counted for ${r.today}`,
    source: r.source,
    as_of: r.runAt,
  };
}

/** /api/wrapper/index.json → counts.pairs (SovX roster pairs read). */
export function sovxFigure(index: unknown): Figure | null {
  const n = int(rec(rec(index)?.counts)?.pairs);
  if (n === null) return null;
  return { value: String(n), label: "wrapped-asset pairs read (reads, not ratings)", source: "/api/wrapper/index.json → counts.pairs", as_of: null };
}

/** /academy/exercises/exercises.json → exercises.length. */
export function exercisesFigure(doc: unknown): Figure | null {
  const list = rec(doc)?.exercises;
  if (!Array.isArray(list) || list.length === 0) return null;
  return { value: String(list.length), label: "exercises that reproduce a published figure", source: "/academy/exercises/exercises.json", as_of: str(rec(doc)?.date_published) };
}
