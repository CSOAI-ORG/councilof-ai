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
  const redirect = wwwToApex(context.request);
  if (redirect) return redirect;
  if (prefersMarkdown(context.request)) return negotiateMarkdown(context.request, await context.next());
  // Council OS deep links get the snapshot of the pane they name (./_lib/dashboardTabSnapshot.ts).
  const direct = snapshotDirectVisit(context.request);
  if (direct) return direct;
  const snap = await serveDashboardSnapshot(context.request, context.env?.ASSETS);
  if (snap) return snap;
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
        return paymentlessProbe402({
          request: context.request,
          env: (context.env ?? {}) as unknown as X402Env,
          offer,
        });
      }
    }
  }
  return context.next();
};
