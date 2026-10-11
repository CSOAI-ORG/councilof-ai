/**
 * GET /.well-known/x402 — the discovery fan-out, answered 200 with the door list itself.
 *
 * It used to 308 → /.well-known/x402.json: correct for a client that follows redirects, useless
 * for the crawler that does not. x402scan's discovery spec (github.com/Merit-Systems/x402scan,
 * docs/DISCOVERY.md, section B) reads this path as a JSON body —
 *
 *     {"version": 1, "resources": ["https://host/api/route-1", "https://host/api/route-2"]}
 *
 * — and discovery precedence is OpenAPI first, this fan-out second, so a 308 with an empty body
 * gives it nothing to register. Serve the payload directly, 200, and keep /.well-known/x402.json
 * exactly as it was (it stays the full manifest: accepts, mode, offer-receipt declaration).
 *
 * NO DRIFT IS POSSIBLE HERE: the list is DERIVED at request time from the same handler that serves
 * /.well-known/x402.json, which is the door list /api/x402's resource rows are asserted against
 * (functions/api/metered-endpoints.test.ts and the fan-out assertions in
 * functions/api/x402-challenge-order.test.ts). Every URL below answers 402 with a non-empty
 * accepts[] and extensions.bazaar to an unpaid `POST {}` — that is the test that keeps it honest,
 * because a route that answers 200/400/404 to an unpaid probe is exactly what directory validators
 * mark "not payable".
 *
 * Free surfaces are deliberately NOT in this list: /api/gspc, /api/fines, /api/commissions,
 * /api/verify, /api/x402/index and friends are published in the catalogue's free_forever block,
 * and advertising them here would invite a probe they are supposed to answer 200 to.
 */
import { onRequestGet as manifestGet } from "./x402.json";
import type { X402Env } from "../api/_x402";

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=300",
  "access-control-allow-origin": "*",
} as const;

export const onRequest: PagesFunction<X402Env> = async (context) => {
  const listing = (await manifestGet(context)) as Response;
  const { resources } = (await listing.json()) as { resources: { url?: string }[] };
  // Absolute https URLs only, deduplicated, in the manifest's own order.
  const urls = [
    ...new Set(
      (resources || [])
        .map((r) => (r && typeof r.url === "string" ? r.url : ""))
        .filter((u) => {
          try {
            return new URL(u).protocol === "https:";
          } catch {
            return false;
          }
        }),
    ),
  ];
  const body = JSON.stringify({ version: 1, resources: urls }, null, 2);
  // HEAD keeps every header and drops the body (RFC 9110 §9.3.2) — a link checker that HEADs this
  // path must not receive a payload, and a GET must.
  if (context.request.method === "HEAD") return new Response(null, { status: 200, headers: HEADERS });
  return new Response(body, { status: 200, headers: HEADERS });
};
