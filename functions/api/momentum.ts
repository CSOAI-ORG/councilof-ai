/**
 * GET /api/momentum — live, sourced, dated figures that show the work is real and moving
 * (schema csoai.momentum/0.1). The reads, the rules and the omission logic live in ./_momentum.ts;
 * this file is the Pages handler and its cache.
 *
 * CACHE. The payload is assembled from ~30 upstream reads run in parallel, each with its own
 * 8 s timeout, so it is cached for TTL_SECONDS (1 h) in the Cloudflare Cache API, keyed by schema,
 * with a module-level copy as a second tier when the Cache API is unavailable (local runs, tests).
 * `generated_at` is the moment the reads ran; every figure also carries its own `as_of`. A cached
 * copy never outlives its TTL, and a source that failed on the read is absent from it, not zeroed.
 *
 * HEAD. Pages dispatches HEAD only to an `onRequestHead` export. Without one, HEAD on /api/momentum and
 * /api/momentum/ fell through to the /api catch-all's 404 JSON while GET answered 200 on both (measured
 * 2026-09-28T14:54Z), so a link checker or `curl -I` recorded the endpoint as missing. HEAD now answers
 * with the status and headers the GET would, and no body.
 */
import { SCHEMA, TTL_SECONDS, buildMomentum, type Deps, type Payload } from "./_momentum";
import { headFromGet } from "./_head";

let memo: { at: number; payload: Payload } | null = null;

export function _resetMomentumCache(): void {
  memo = null;
}

function respond(payload: Payload, cache: "HIT" | "MISS", ageSeconds = 0): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${Math.max(0, TTL_SECONDS - ageSeconds)}`,
      "access-control-allow-origin": "*",
      "x-momentum-cache": cache,
    },
  });
}

export async function getMomentum(deps: Deps, nowMs = Date.now()): Promise<{ payload: Payload; cache: "HIT" | "MISS"; age: number }> {
  if (memo && nowMs - memo.at < TTL_SECONDS * 1000) return { payload: memo.payload, cache: "HIT", age: Math.floor((nowMs - memo.at) / 1000) };
  const payload = await buildMomentum(deps);
  memo = { at: nowMs, payload };
  return { payload, cache: "MISS", age: 0 };
}

export const onRequestGet: PagesFunction = async ({ request, waitUntil }) => {
  const url = new URL(request.url);
  const key = new Request(`${url.origin}/api/momentum?schema=${encodeURIComponent(SCHEMA)}`, { method: "GET" });
  const edge: Cache | null = typeof caches !== "undefined" && (caches as any).default ? (caches as any).default : null;
  if (edge) {
    try {
      const hit = await edge.match(key);
      if (hit) {
        const h = new Headers(hit.headers);
        h.set("x-momentum-cache", "HIT");
        return new Response(hit.body, { status: 200, headers: h });
      }
    } catch {
      /* the Cache API is a speed-up, never a source; fall through to a fresh read */
    }
  }
  const deps: Deps = { fetch: globalThis.fetch.bind(globalThis), origin: url.origin, now: () => new Date() };
  const { payload, cache, age } = await getMomentum(deps);
  const res = respond(payload, cache, age);
  if (edge && cache === "MISS") {
    try {
      waitUntil(edge.put(key, res.clone()));
    } catch {
      /* ignore */
    }
  }
  return res;
};

export const onRequestHead = headFromGet(onRequestGet);
