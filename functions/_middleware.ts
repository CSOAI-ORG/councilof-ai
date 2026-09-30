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

type Ctx = { request: Request; next: () => Promise<Response> };

export const onRequest = async (context: Ctx): Promise<Response> => {
  const redirect = wwwToApex(context.request);
  if (redirect) return redirect;
  if (prefersMarkdown(context.request)) return negotiateMarkdown(context.request, await context.next());
  return context.next();
};
