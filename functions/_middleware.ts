/**
 * Root Pages Functions middleware. Runs before every route on every host.
 *
 * First the www -> apex host redirect (see ./_lib/wwwRedirect.ts). Then Markdown content negotiation
 * (./_lib/markdownNegotiation.ts): only a GET/HEAD whose Accept prefers text/markdown is looked at, and only an
 * HTML 200 is rewritten; every other request and response falls straight through unchanged. Keep anything added
 * here after the www check, so the redirect stays first.
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
import { offerFor } from "./.well-known/x402.json";

type Ctx = {
  request: Request;
  next: () => Promise<Response>;
  env?: { ASSETS?: { fetch: (input: Request | URL | string, init?: RequestInit) => Promise<Response> } };
};

export const onRequest = async (context: Ctx): Promise<Response> => {
  // Every response this middleware produces — including the early returns below
  // and the response from context.next() — goes out through the API header
  // wrapper. A response that skipped it would be the one /api/ answer with no
  // security headers, which is the defect being fixed.
  const redirect = wwwToApex(context.request);
  if (redirect) return withApiSecurityHeaders(context.request, redirect);
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
  if (context.request.method === "POST" && !hasPaymentHeader(context.request)) {
    const bodyText = await context.request.clone().text();
    if (isEmptyProbeBody(bodyText)) {
      const offer = offerFor(context.request.url);
      if (offer) {
        return withApiSecurityHeaders(
          context.request,
          await paymentlessProbe402({
            request: context.request,
            env: (context.env ?? {}) as unknown as X402Env,
            offer,
          }),
        );
      }
    }
  }
  const response = await context.next();
  return withApiSecurityHeaders(context.request, response);
};

/**
 * /api/* responses carry NO security headers today.
 *
 * public/_headers sets them, but that file applies to Cloudflare Pages STATIC
 * assets. A Pages Function answers /api/* and never sees it, so the entire
 * machine-readable surface — the board, the card index, the state endpoint, the
 * x402 doors — went out with no nosniff, no referrer policy, no HSTS and no
 * frame protection, while the HTML pages beside it carried all of them. The
 * estate's own machine-readable surface is its most-read surface: agents and
 * crawlers fetch it constantly.
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
