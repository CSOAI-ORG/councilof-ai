/**
 * GET /api/x402-quotes — every door the x402 manifest declares, asked once without payment, with the HTTP status and body each door answered, read live.
 *
 * WHY THIS EXISTS. /pay reads each door's own 402 to show its terms. Read from the browser, every
 * one of those intended 402s is also logged by the browser as "Failed to load resource" — 25
 * console errors on a page that is working as designed (ux-gauntlet 2026-09-26). A status check in
 * the page cannot stop that: the browser logs the status before any script sees the response.
 * So the same unpaid GET is made here, server-side, and the page receives one 200 carrying each
 * door's answer verbatim.
 *
 * WHAT IT IS NOT. Nothing is paid or signed: no X-PAYMENT header, and each door is asked exactly as
 * the page asked it (GET, accept JSON). The terms are still each door's own 402 body; this relays
 * it and adds nothing. A door that does not answer is reported with its error and a null status,
 * never a substituted body.
 *
 * CACHED AT THE EDGE (public audit 2026-09-28, fix #29). Every request used to fan out to all 25
 * doors: 1.1 s to first byte and 315 KB of pretty-printed JSON, for a page that only renders the
 * terms. The reading is now serialised compact and kept in the Cloudflare cache for
 * QUOTES_TTL_SECONDS; `as_of` is the moment the doors were actually asked, so a cached answer
 * says how old it is, and `max_age_seconds` says how old it may get. An UNCHECKABLE reading (the
 * manifest could not be read) is served but never cached.
 *
 * SCOPE. Only doors on the requesting origin are asked. A manifest row on another host is
 * returned as `skipped` (the page then asks that door itself), so this is not an open relay.
 */
import { headFromGet } from "./_head";

export const QUOTES_SCHEMA = "csoai.x402-quotes/0.1";
export const MANIFEST_PATH = "/.well-known/x402.json";
const DOOR_TIMEOUT_MS = 8_000;
const MAX_DOORS = 40;
/** How long one reading is served from the edge cache before the doors are asked again. */
export const QUOTES_TTL_SECONDS = 300;
export const QUOTES_CACHE_CONTROL = `public, max-age=60, s-maxage=${QUOTES_TTL_SECONDS}, stale-while-revalidate=600`;

export type DoorQuote = {
  url: string;
  method: string;
  /** The door's HTTP status, or null when it could not be read (then `error` says why). */
  http: number | null;
  /** The door's JSON body, verbatim; null when it had none or it was not JSON. */
  body: unknown;
  error: string | null;
  skipped: string | null;
};

export type QuotesReading = {
  schema: typeof QUOTES_SCHEMA;
  as_of: string;
  manifest: string;
  kind: "MEASURED" | "UNCHECKABLE";
  /** The oldest this reading can be when served from the edge cache; as_of is when it was taken. */
  max_age_seconds: number;
  quotes: DoorQuote[];
  reason: string | null;
  note: string;
};

const NOTE =
  `Each row is that door's own answer to an unpaid GET, made at as_of. The reading is kept in the edge cache for up to ${QUOTES_TTL_SECONDS} seconds, so as_of can be that much older than your request. A 402 is a challenge, not settlement, delivery or revenue. Nothing here is paid or signed.`;

type Fetch = typeof fetch;

async function readDoor(url: string, method: string, fetchImpl: Fetch): Promise<DoorQuote> {
  const row: DoorQuote = { url, method, http: null, body: null, error: null, skipped: null };
  try {
    const r = await fetchImpl(url, {
      method,
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(DOOR_TIMEOUT_MS),
    });
    row.http = r.status;
    const text = await r.text();
    try {
      row.body = JSON.parse(text);
    } catch {
      row.body = null;
    }
  } catch (e) {
    row.error = (e as Error)?.message || String(e);
  }
  return row;
}

export async function readQuotes(origin: string, fetchImpl: Fetch = fetch): Promise<QuotesReading> {
  const base = (over: Partial<QuotesReading>): QuotesReading => ({
    schema: QUOTES_SCHEMA,
    as_of: new Date().toISOString(),
    manifest: MANIFEST_PATH,
    kind: "UNCHECKABLE",
    max_age_seconds: QUOTES_TTL_SECONDS,
    quotes: [],
    reason: null,
    note: NOTE,
    ...over,
  });
  let resources: unknown;
  try {
    const r = await fetchImpl(new URL(MANIFEST_PATH, origin).toString(), { headers: { accept: "application/json" } });
    if (!r.ok) return base({ reason: `${MANIFEST_PATH} answered HTTP ${r.status}` });
    resources = ((await r.json()) as { resources?: unknown })?.resources;
  } catch (e) {
    return base({ reason: `${MANIFEST_PATH} could not be read: ${(e as Error)?.message || String(e)}` });
  }
  if (!Array.isArray(resources) || resources.length === 0) {
    return base({ reason: "the x402 manifest declares no resources[]" });
  }
  const host = new URL(origin).host;
  const rows = resources.slice(0, MAX_DOORS).flatMap((res) => {
    const row = res && typeof res === "object" ? (res as Record<string, unknown>) : null;
    if (!row || typeof row.url !== "string" || !/^https?:\/\//.test(row.url)) return [];
    return [{ url: row.url, method: typeof row.method === "string" ? row.method : "GET" }];
  });
  const quotes = await Promise.all(
    rows.map(async ({ url, method }) => {
      let sameOrigin = false;
      try {
        sameOrigin = new URL(url).host === host;
      } catch {
        /* unparseable: skipped below */
      }
      if (!sameOrigin || method.toUpperCase() !== "GET") {
        const q: DoorQuote = { url, method, http: null, body: null, error: null, skipped: null };
        q.skipped = sameOrigin ? `method ${method} is not read here` : "not a door on this origin";
        return q;
      }
      return readDoor(url, method, fetchImpl);
    }),
  );
  return base({
    kind: "MEASURED",
    quotes,
    reason: resources.length > MAX_DOORS ? `the manifest declares ${resources.length} doors; the first ${MAX_DOORS} were read` : null,
  });
}

/** The edge cache, where the runtime has one (Workers / Pages); undefined under Node and tests. */
function edgeCache(): Cache | undefined {
  return typeof caches !== "undefined" ? (caches as unknown as { default?: Cache }).default : undefined;
}

export const onRequestGet: PagesFunction = async ({ request, waitUntil }) => {
  const origin = new URL(request.url).origin;
  // One key per origin, whatever query string was sent: the reading takes no parameters.
  const key = new Request(`${origin}/api/x402-quotes`, { method: "GET" });
  const cache = edgeCache();
  if (cache) {
    try {
      const hit = await cache.match(key);
      if (hit) {
        const headers = new Headers(hit.headers);
        headers.set("x-csoai-cache", "HIT");
        return new Response(hit.body, { status: hit.status, headers });
      }
    } catch {
      /* a cache that cannot be read is a miss, never an error */
    }
  }
  const reading = await readQuotes(origin, fetch);
  const headers = {
    "content-type": "application/json; charset=utf-8",
    // Only a MEASURED reading is shareable; an UNCHECKABLE one is retried on the next request.
    "cache-control": reading.kind === "MEASURED" ? QUOTES_CACHE_CONTROL : "no-store",
    "access-control-allow-origin": "*",
    "x-csoai-cache": "MISS",
  };
  const response = new Response(JSON.stringify(reading), { status: 200, headers });
  if (cache && reading.kind === "MEASURED") {
    const put = cache.put(key, response.clone()).catch(() => undefined);
    if (typeof waitUntil === "function") waitUntil(put);
  }
  return response;
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
