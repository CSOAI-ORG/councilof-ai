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
 * WHAT IT IS NOT. Nothing is paid, signed or cached: `cache-control: no-store`, no X-PAYMENT
 * header, and each door is asked at request time exactly as the page asked it (GET, accept JSON).
 * The terms are still each door's own live 402 body; this relays it and adds nothing. A door
 * that does not answer is reported with its error and a null status, never a substituted body.
 *
 * SCOPE. Only doors on the requesting origin are asked. A manifest row on another host is
 * returned as `skipped` (the page then asks that door itself), so this is not an open relay.
 */

export const QUOTES_SCHEMA = "csoai.x402-quotes/0.1";
export const MANIFEST_PATH = "/.well-known/x402.json";
const DOOR_TIMEOUT_MS = 8_000;
const MAX_DOORS = 40;

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
  quotes: DoorQuote[];
  reason: string | null;
  note: string;
};

const NOTE =
  "Each row is that door's own answer to an unpaid GET, made at request time. A 402 is a challenge, not settlement, delivery or revenue. Nothing here is paid, signed or cached.";

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

export const onRequestGet: PagesFunction = async ({ request }) => {
  const reading = await readQuotes(new URL(request.url).origin, fetch);
  return new Response(JSON.stringify(reading, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
};
