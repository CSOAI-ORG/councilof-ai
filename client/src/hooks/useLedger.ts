/**
 * useLedger — stale-while-revalidate hook for /api/worker/ledger.
 *
 * Returns the same shape as a raw fetch (records array + stats), but:
 *   - The first render shows what's already in module-level cache (instant)
 *   - Then it re-fetches in the background
 *   - Re-fetch on focus / on interval (5 min) keeps the panel fresh without
 *     slamming the upstream on every page navigation
 *
 * Module-level cache is shared across all instances on the same page, so
 * multiple components asking for the ledger make ONE network request.
 */

import { useEffect, useState, useCallback } from "react";

export type DecisionRecord = {
  id: string;
  claim: string;
  verdict: string;
  evidence: string;
  tag: string;
  decided_on: string;
  sigil_link: string;
};

export type LedgerStats = {
  total: number;
  by_kind: { kind: string; count: number }[];
  by_verdict: { verdict: string; count: number }[];
  by_tag: { tag: string; count: number }[];
};

export type Ledger = {
  records: DecisionRecord[];
  count: number;
};

const STALE_MS = 30_000;
const REVALIDATE_MS = 5 * 60_000;

let cache: { value: Ledger | null; ts: number } = { value: null, ts: 0 };
let inFlight: Promise<Ledger | null> | null = null;
const subs = new Set<(l: { data: Ledger | null; loading: boolean; error: string | null; fetchedAt: number }) => void>();

async function loadOnce(): Promise<Ledger | null> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const r = await fetch("/api/worker/ledger");
      if (!r.ok) throw new Error("HTTP " + r.status);
      const d = (await r.json()) as Ledger;
      cache = { value: d, ts: Date.now() };
      return d;
    } catch (e: any) {
      return null;
    } finally {
      inFlight = null;
    }
  })();
  const result = await inFlight;
  if (result) {
    subs.forEach((cb) => cb({ data: result, loading: false, error: null, fetchedAt: cache.ts }));
  } else {
    subs.forEach((cb) => cb({ data: cache.value, loading: false, error: "fetch failed", fetchedAt: cache.ts }));
  }
  return result;
}

export function useLedger(): {
  data: Ledger | null;
  loading: boolean;
  error: string | null;
  fetchedAt: number;
  refresh: () => void;
} {
  const [state, setState] = useState({
    data: cache.value,
    loading: cache.value === null,
    error: null as string | null,
    fetchedAt: cache.ts,
  });

  const refresh = useCallback(() => {
    loadOnce();
  }, []);

  useEffect(() => {
    const cb = (s: typeof state) => setState(s);
    subs.add(cb);
    // Subscribe first, then decide whether to fetch.
    if (cache.value === null || Date.now() - cache.ts > STALE_MS) {
      loadOnce();
    } else {
      setState({ data: cache.value, loading: false, error: null, fetchedAt: cache.ts });
    }
    const id = setInterval(() => { if (Date.now() - cache.ts > STALE_MS) loadOnce(); }, REVALIDATE_MS);
    return () => {
      subs.delete(cb);
      clearInterval(id);
    };
  }, []);

  return { ...state, refresh };
}

// Same pattern for /api/worker/ledger/stats — kept tiny because /live-ledger is the only caller.
let statsCache: { value: LedgerStats | null; ts: number } = { value: null, ts: 0 };
let statsInFlight: Promise<LedgerStats | null> | null = null;
const statsSubs = new Set<(s: { data: LedgerStats | null; loading: boolean }) => void>();

async function loadStatsOnce(): Promise<LedgerStats | null> {
  if (statsInFlight) return statsInFlight;
  statsInFlight = (async () => {
    try {
      const r = await fetch("/api/worker/ledger/stats");
      if (!r.ok) throw new Error("HTTP " + r.status);
      const d = (await r.json()) as LedgerStats;
      statsCache = { value: d, ts: Date.now() };
      return d;
    } catch (e) {
      return null;
    } finally {
      statsInFlight = null;
    }
  })();
  const result = await statsInFlight;
  statsSubs.forEach((cb) => cb({ data: result ?? statsCache.value, loading: false }));
  return result;
}

export function useLedgerStats(): { data: LedgerStats | null; loading: boolean } {
  const [state, setState] = useState({
    data: statsCache.value,
    loading: statsCache.value === null,
  });
  useEffect(() => {
    const cb = (s: typeof state) => setState(s);
    statsSubs.add(cb);
    if (statsCache.value === null || Date.now() - statsCache.ts > STALE_MS) loadStatsOnce();
    else setState({ data: statsCache.value, loading: false });
    const id = setInterval(() => { if (Date.now() - statsCache.ts > STALE_MS) loadStatsOnce(); }, REVALIDATE_MS);
    return () => {
      statsSubs.delete(cb);
      clearInterval(id);
    };
  }, []);
  return state;
}
