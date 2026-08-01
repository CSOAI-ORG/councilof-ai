/**
 * sovDataBus — ONE honest data bus for every layer of Sov Space.
 *
 * The law (three outcomes, applied to UI): every feed is reported as
 *   live    — fetched OK just now, with fetchedAt
 *   static  — build-time/local data, labelled as such
 *   offline — unreachable; the UI shows OFFLINE, never a fabricated number
 *
 * Every consumer gets { data, source, fetchedAt } — and shows the provenance
 * on hover. Module-level cache + single-flight so N components = 1 request.
 */

export type FeedSource = "live" | "static" | "offline";

export type Feed<T> = {
  data: T | null;
  source: FeedSource;
  fetchedAt: string; // ISO, "" when never fetched
  url: string;
};

type Listener = () => void;

const feeds = new Map<string, Feed<any>>();
const listeners = new Set<Listener>();
const inFlight = new Map<string, Promise<Feed<any>>>();

function notify() {
  for (const fn of listeners) fn();
}

export function subscribeBus(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getFeed<T>(url: string): Feed<T> {
  return (
    (feeds.get(url) as Feed<T>) ?? { data: null, source: "offline", fetchedAt: "", url }
  );
}

const DEFAULT_TTL = 60_000;

export async function fetchFeed<T>(
  url: string,
  opts: { ttlMs?: number; map?: (raw: any) => T; init?: RequestInit } = {}
): Promise<Feed<T>> {
  const ttl = opts.ttlMs ?? DEFAULT_TTL;
  const existing = feeds.get(url) as Feed<T> | undefined;
  if (existing?.data && Date.now() - Date.parse(existing.fetchedAt) < ttl) return existing;
  if (inFlight.has(url)) return inFlight.get(url) as Promise<Feed<T>>;

  const p = (async (): Promise<Feed<T>> => {
    let feed: Feed<T>;
    try {
      const r = await fetch(url, opts.init);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const raw = await r.json();
      feed = {
        data: opts.map ? opts.map(raw) : (raw as T),
        source: "live",
        fetchedAt: new Date().toISOString(),
        url,
      };
    } catch {
      // Keep last-known data if we have it — but downgrade the label honestly.
      feed = existing?.data
        ? { ...existing, source: "offline" }
        : { data: null, source: "offline", fetchedAt: "", url };
    }
    feeds.set(url, feed);
    inFlight.delete(url);
    notify();
    return feed;
  })();

  inFlight.set(url, p);
  return p;
}

/** Register a build-time/static value on the bus (labelled, never "live"). */
export function putStatic<T>(url: string, data: T): Feed<T> {
  const feed: Feed<T> = { data, source: "static", fetchedAt: "", url };
  feeds.set(url, feed);
  notify();
  return feed;
}

// ── The canonical feeds (one place to change when an endpoint moves) ──

export const BUS = {
  anchors: "/api/worker/anchors",
  ledgerStats: "/api/worker/ledger/stats",
  flywheelSnapshot: "/flywheel-snapshot.json",
  hiveCoverage: "/hive-coverage.json",
  oracleFleet: "/api/oracle-fleet",
} as const;

export type AnchorRecord = {
  id?: string;
  kind?: string;
  region?: string;
  lng?: number;
  lat?: number;
  claim?: string;
  ts?: number;
  tag?: string;
  [k: string]: unknown;
};

export const fetchAnchors = () => fetchFeed<{ anchors?: AnchorRecord[]; count?: number }>(BUS.anchors);
export const fetchLedgerStats = () =>
  fetchFeed<{ total?: number; by_kind?: { kind: string; count: number }[] }>(BUS.ledgerStats);
export const fetchFlywheelSnapshot = () => fetchFeed<{ planets?: unknown[]; citizens?: unknown[] }>(BUS.flywheelSnapshot);
export const fetchHiveCoverage = () => fetchFeed<Record<string, unknown>>(BUS.hiveCoverage);

export type OracleFleet = {
  host?: string;
  updated?: string;
  uptime_seconds?: number;
  feeds?: {
    airbench_harvester?: { last?: string };
    govbench?: { last?: string };
    gcp_evac?: { state?: string };
    ollama?: { models_loaded?: number };
  };
  disk_free_mb?: { root?: number; evac_bulk?: number };
  cron_jobs?: number;
  source?: string;
};
export const fetchOracleFleet = () => fetchFeed<OracleFleet>(BUS.oracleFleet);

/** Aggregate health for the dock status dot: how many canonical feeds are live. */
export function busHealth(): { live: number; total: number; state: "live" | "partial" | "offline" } {
  const urls = Object.values(BUS) as string[];
  let live = 0;
  for (const u of urls) if (feeds.get(u)?.source === "live") live++;
  return {
    live,
    total: urls.length,
    state: live === urls.length ? "live" : live > 0 ? "partial" : "offline",
  };
}
