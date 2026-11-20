/**
 * Root Pages Functions middleware. Runs before every route on every host.
 *
 * First the www -> apex host redirect (see ./_lib/wwwRedirect.ts). Then the bare origin of mcp.meok.ai is
 * handed to the /mcp door (./_lib/mcpDoorRoot.ts); every other host and path skips that step. Then Markdown
 * content negotiation (./_lib/markdownNegotiation.ts): only a GET/HEAD whose Accept prefers text/markdown is
 * looked at, and only an HTML 200 is rewritten; every other request and response falls straight through
 * unchanged. Keep anything added here after the www check, so the redirect stays first.
 *
 * Cost note: wrangler already generates `_routes.json` with include ["/*"] for this
 * project (414 function files collapse past the 100-rule limit), so every request,
 * static assets included, was already a Functions invocation. Adding this middleware
 * adds no invocations; it only adds one hostname comparison and one Accept parse to each.
 */
import { wwwToApex } from "./_lib/wwwRedirect";
import { negotiateMarkdown, prefersMarkdown } from "./_lib/markdownNegotiation";
import { serveDashboardSnapshot, snapshotDirectVisit } from "./_lib/dashboardTabSnapshot";
import { hasPaymentHeader, paymentlessProbe402, type X402Env } from "./api/_x402";
import { isEmptyProbeBody } from "./api/_x402_discovery";
import { offerFor, type ListingOffer } from "./.well-known/x402.json";
import { PATH as FRESH_CAPSULE_PATH } from "./api/measurement/fresh-capsule";
import { mcpDoorRootRequest } from "./_lib/mcpDoorRoot";
import { onRequest as mcpDoor } from "./mcp/[[path]]";

type Ctx = {
  request: Request;
  next: () => Promise<Response>;
  env?: { ASSETS?: { fetch: (input: Request | URL | string, init?: RequestInit) => Promise<Response> } };
  waitUntil?: (promise: Promise<unknown>) => void;
};

export const onRequest = async (context: Ctx): Promise<Response> => {
  // Every response this middleware produces — including the early returns below
  // and the response from context.next() — goes out through the API header
  // wrapper. A response that skipped it would be the one /api/ answer with no
  // security headers, which is the defect being fixed.
  const redirect = wwwToApex(context.request);
  if (redirect) return withApiSecurityHeaders(context.request, redirect);
  // mcp.meok.ai/ is the MCP door itself, not a second homepage (./_lib/mcpDoorRoot.ts).
  const mcpRoot = mcpDoorRootRequest(context.request);
  if (mcpRoot)
    return withApiSecurityHeaders(
      context.request,
      await mcpDoor({ request: mcpRoot, env: context.env, waitUntil: context.waitUntil }),
    );
  if (prefersMarkdown(context.request))
    return withApiSecurityHeaders(
      context.request,
      await negotiateMarkdown(context.request, await context.next()),
    );
  // Council OS deep links get the snapshot of the pane they name (./_lib/dashboardTabSnapshot.ts).
  const direct = snapshotDirectVisit(context.request);
  if (direct) return withApiSecurityHeaders(context.request, direct);
  const snap = await serveDashboardSnapshot(context.request, context.env?.ASSETS);
  if (snap) return withApiSecurityHeaders(context.request, snap);
  // PAYMENT ABOVE INPUT VALIDATION (x402 discovery repair: x402-foundation/x402#2156,
  // PayAINetwork/x402-solana#36). A Bazaar indexer probes a seller with a paymentless
  // empty-body POST and believes the FIRST thing that answers — a 400/404 from input
  // validation in front of the challenge reads as a dead or non-x402 route and the door
  // stays unindexed. So for an x402 door (offerFor holds every route config) a paymentless
  // empty-body POST gets the complete 402 envelope — accepts[] plus extensions.bazaar from
  // declareDiscoveryExtension — before any handler runs. A POST carrying a real body or a
  // payment header falls through to the route untouched; GET is never intercepted.
  //
  // 2026-11-19: the path and query decide BEFORE any byte of the body is read. The gate used to
  // read every paymentless POST body in full, with no size limit, and only then ask whether the
  // path was a door — so every POST to /mcp and /api/a2a was buffered here first. It also
  // challenged a door's FREE part: POST /api/proof?sha=<64-hex> got an issuance:reserve 402 for
  // an inclusion proof that is free. probeOffer() now leaves alone every path that is not a door
  // and every query that asks only for a door's free part (FREE_PART below); only a door query
  // that selects no free part reaches isEmptyProbe(), which reads a clone up to a size cap.
  const offer = probeOffer(context.request);
  if (offer && (await isEmptyProbe(context.request))) {
    return withApiSecurityHeaders(
      context.request,
      await paymentlessProbe402({
        request: context.request,
        env: (context.env ?? {}) as unknown as X402Env,
        offer,
      }),
    );
  }
  const response = await context.next();
  return withApiSecurityHeaders(context.request, response);
};

/**
 * THE FREE PART OF EACH PAID DOOR, read from that door's own handler (2026-11-19).
 *
 * A door in offerFor() is not paid all the way through. proof.ts serves one inclusion (?sha=)
 * free and sells only ?bundle=1; most doors serve ?preview=1 free; signed-data-feed.ts and
 * provider-diff.ts serve their bare path free. A query listed here goes to the door untouched,
 * and every one of these handlers answers POST as it answers GET, so the free part stays free on
 * POST (functions/_middleware.test.ts holds every listed free preview to that).
 *
 * Not listed — free-door, discover/*, request-attestation, ras/*: no query selects a free part.
 * A query that selects nothing (the bare path of most doors, or input the door refuses) is still
 * challenged, which is the probe this gate exists for. invoice=gbp is not a free part; the doors
 * that sell against an invoice are handled by INVOICE_TERMS below.
 */
type Query = URLSearchParams;
const one = (q: Query, key: string) => q.get(key) === "1";
const given = (q: Query, key: string) => (q.get(key) ?? "").trim() !== "";
const preview = (q: Query) => one(q, "preview");
const FREE_PART: Record<string, (q: Query) => boolean> = {
  // proof.ts: one inclusion is free; bundle=1 is the paid bundle; the bare path redirects to it.
  "/api/proof": (q) => given(q, "sha") && !one(q, "bundle"),
  // evidence-bundle.ts: an obligation without bundle=1 is the free preview (format=procurement too).
  "/api/evidence-bundle": (q) => given(q, "obligation") && !one(q, "bundle") && q.get("invoice") !== "gbp",
  // signed-data-feed.ts: the bare path is the free preview and manifest=1 the free delivery
  // manifest; feed=1 (or the legacy x402=1) is the paid pull.
  "/api/signed-data-feed": (q) => one(q, "manifest") || (!one(q, "feed") && !one(q, "x402")),
  // provider-diff.ts: the bare path, filtered or not, is the free recent feed; history=1 is paid.
  "/api/feeds/provider-diff": (q) => !one(q, "history") && (q.get("invoice") ?? "").toLowerCase() !== "gbp",
  // receipts/batch.ts takes preview=true as well as preview=1.
  "/api/receipts/batch": (q) => preview(q) || q.get("preview") === "true",
  "/api/rwa/evidence": preview,
  "/api/coverage-evidence": preview,
  "/api/wrapper": preview,
  "/api/wrapper/changes": preview,
  "/api/art50/marking-evidence": preview,
  [FRESH_CAPSULE_PATH]: preview,
};

function asksOnlyForFreePart(url: URL): boolean {
  const q = url.searchParams;
  // _population_door.ts: preview=1 and the delivery manifest (manifest=1) are free.
  if (/^\/api\/pop\/[^/]+$/.test(url.pathname)) return preview(q) || one(q, "manifest");
  // wrapper/asset/[asset].ts: preview=1 is free.
  if (/^\/api\/wrapper\/asset\/[^/]+$/.test(url.pathname)) return preview(q);
  return FREE_PART[url.pathname]?.(q) ?? false;
}

/**
 * THE INVOICE TERMS OF THE DOORS THAT SELL AGAINST A CSOAI LTD INVOICE (2026-11-20).
 *
 * evidence-bundle.ts, provider-diff.ts and art50/marking-evidence.ts answer invoice=gbp with their
 * own invoice terms (a quotation, an invoice-required reference, or the pack against the
 * invoice), never with x402 terms, and in each invoice=gbp wins over bundle=1 / history=1. The
 * bundle's own 402 advertises its invoice link WITH bundle=1, so that link POSTed with no body got
 * the USDC challenge here instead of the quotation: the enterprise path the invoice door exists
 * for. A query listed here goes to the door untouched. Each test mirrors its handler's own parse.
 */
const INVOICE_TERMS: Record<string, (q: Query) => boolean> = {
  // evidence-bundle.ts: exact "gbp", and only once an obligation is named (no obligation, no quotation).
  "/api/evidence-bundle": (q) => given(q, "obligation") && q.get("invoice") === "gbp",
  // provider-diff.ts lowercases the value.
  "/api/feeds/provider-diff": (q) => (q.get("invoice") ?? "").toLowerCase() === "gbp",
  // marking-evidence.ts: exact "gbp".
  "/api/art50/marking-evidence": (q) => q.get("invoice") === "gbp",
};

const asksForInvoiceTerms = (url: URL) => INVOICE_TERMS[url.pathname]?.(url.searchParams) ?? false;

/**
 * The offer a paymentless probe of this request is answered with, or null to leave the request
 * alone. Decided on the method, the payment header, the path and the query only: no byte of the
 * body has been read when this returns, so /mcp, /api/a2a and every other path that is not a door
 * are never read by this middleware. A query for a door's free part (FREE_PART) or its invoice
 * terms (INVOICE_TERMS, 2026-11-20) is left to the door as well.
 */
function probeOffer(request: Request): ListingOffer | null {
  if (request.method !== "POST" || hasPaymentHeader(request)) return null;
  const offer = offerFor(request.url);
  if (!offer) return null;
  const url = new URL(request.url);
  if (asksOnlyForFreePart(url) || asksForInvoiceTerms(url)) return null;
  return offer;
}

/**
 * The most body an indexer's probe can carry: "", "{}" or "[]" with JSON whitespace
 * (isEmptyProbeBody). A body longer than this is a real request, so the gate reads no further.
 */
export const PROBE_BODY_CAP_BYTES = 1024;

/**
 * True when the body is an empty probe. Reads a clone, never more than PROBE_BODY_CAP_BYTES of it
 * (plus the chunk that crosses the cap): a declared or streamed body past the cap goes to the
 * route unread. The route always receives the original body, every byte of it.
 */
async function isEmptyProbe(request: Request): Promise<boolean> {
  if (Number(request.headers.get("content-length")) > PROBE_BODY_CAP_BYTES) return false;
  if (!request.body) return true;
  const reader = request.clone().body!.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > PROBE_BODY_CAP_BYTES) return false;
      chunks.push(value);
    }
  } catch {
    // A body the gate cannot read is not an empty probe; the route answers it.
    return false;
  } finally {
    // Stop the clone so the tee stops copying into it. Not awaited: cancelling one branch of a
    // tee settles only when the other branch ends, and the route has not read that branch yet.
    reader.cancel().catch(() => {});
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.byteLength;
  }
  return isEmptyProbeBody(new TextDecoder().decode(bytes));
}

/**
 * /api/* responses carry the security headers the static rules never reach.
 *
 * public/_headers sets them, but that file applies to Cloudflare Pages STATIC
 * assets. A Pages Function answers /api/* and never sees it, so the entire
 * machine-readable surface — the board, the card index, the state endpoint, the
 * x402 doors — went out with no nosniff, no referrer policy, no HSTS and no
 * frame protection, while the HTML pages beside it carried all of them. The
 * estate's own machine-readable surface is its most-read surface: agents and
 * crawlers fetch it constantly.
 *
 * 2026-11-07: the Content-Security-Policy was still missing after that repair.
 * The surface answered with five security headers and no policy, and the
 * published-surface audit recorded that as three MEDIUM findings. It is set
 * here now, on the same wrapper, so the whole policy for /api/ lives in one
 * place and a future header cannot be half-applied.
 *
 * Scoped to /api/ on purpose. The /dashboard/* rule in public/_headers unsets
 * X-Frame-Options and replaces it with CSP frame-ancestors, because the Council
 * OS pane may be framed by the Hugging Face Space. A Worker-level
 * X-Frame-Options: SAMEORIGIN on every path would silently break that, so
 * these headers are added for the API paths only and the page rules stay where
 * they are.
 */
function withApiSecurityHeaders(request: Request, response: Response): Response {
  // A promise slipped through here once: `new Response(promise.body)` builds a
  // 200 with an empty body, which turns a payment gate into a free door. The
  // wrapper refuses anything that is not already a Response, so that failure
  // is loud instead of silent.
  if (!(response instanceof Response)) {
    throw new TypeError(
      "withApiSecurityHeaders: expected a Response. An async helper was probably not awaited.",
    );
  }
  let path: string;
  try {
    path = new URL(request.url).pathname;
  } catch {
    return response;
  }
  if (!path.startsWith("/api/")) return response;

  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");

  // The Content-Security-Policy the /api/ surface was missing.
  //
  // MEASURED 2026-11-07: councilof.ai answered /api/gspc, /api/state and
  // /api/cards with FIVE security headers and no Content-Security-Policy at
  // all, while the HTML beside it carried one. The estate's machine-readable
  // surface is the surface agents and crawlers read most, and it was the one
  // with no policy. The published-surface audit recorded this as three MEDIUM
  // findings.
  //
  // A machine surface carries no scripts to allow, so the policy that fits it
  // is the strictest there is: nothing loads from it, it cannot be framed, and
  // it cannot be a form target. That closes the one live path the surface
  // still had — /api/feed.xml answers XML, and XML a browser renders is a
  // document, so without a policy the response is a document it will execute.
  //
  // An /api/ answer that is genuinely an HTML document gets the sandbox form
  // instead: the page still RENDERS, with its scripts and forms inert, rather
  // than becoming a white screen. This repo has already had one white-screen
  // incident (2026-08-11), and a policy that guesses wrong about a response
  // type is how you cause the next one — so the two cases are separated on the
  // response's own content-type rather than on an assumption.
  const contentType = headers.get("content-type") ?? "";
  const isDocument = /text\/html/i.test(contentType);
  headers.set(
    "Content-Security-Policy",
    isDocument
      ? "sandbox; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
      : "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  );

  // A Headers copy collapses repeated Set-Cookie into one comma-joined value,
  // which changes the cookie's meaning. Carry each one across separately.
  const setCookies =
    typeof (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function"
      ? (headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : [];
  if (setCookies.length > 1) headers.delete("set-cookie");
  for (const c of setCookies) headers.append("set-cookie", c);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
