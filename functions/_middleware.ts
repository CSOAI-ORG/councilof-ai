/**
 * Root Pages Functions middleware. Runs before every route on every host.
 *
 * Its only job is the www -> apex host redirect (see ./_lib/wwwRedirect.ts); every other
 * request falls straight through to the route or static asset unchanged. Keep anything
 * added here after that check, so the redirect stays first.
 *
 * Cost note: wrangler already generates `_routes.json` with include ["/*"] for this
 * project (414 function files collapse past the 100-rule limit), so every request,
 * static assets included, was already a Functions invocation. Adding this middleware
 * adds no invocations; it only adds one hostname comparison to each.
 */
import { wwwToApex } from "./_lib/wwwRedirect";

type Ctx = { request: Request; next: () => Promise<Response> };

export const onRequest = async (context: Ctx): Promise<Response> => {
  const redirect = wwwToApex(context.request);
  if (redirect) return redirect;
  return context.next();
};
