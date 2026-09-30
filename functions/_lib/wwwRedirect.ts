/**
 * www.councilof.ai -> councilof.ai, in code (no DNS, zone or dashboard rule involved).
 *
 * Before this, www.councilof.ai served the whole site with a 200: a second copy of every
 * page for search engines. Pages `_redirects` cannot match on host, so the check lives in
 * the root Functions middleware (functions/_middleware.ts), which runs before every route.
 *
 * Only the exact host `www.councilof.ai` moves. The apex, `*.pages.dev` production and
 * preview hosts, and localhost are left alone, so previews keep working and the apex
 * `/api/*` and `/mcp` endpoints are untouched.
 *
 * GET/HEAD get 301 (the permanent, search-engine-canonical redirect). Any other method
 * gets 308, the same permanent redirect but one that a client must replay with the same
 * method and body: a 301 lets clients turn a POST into a GET, which would silently break
 * an MCP or API POST that someone had pointed at www.
 */
export const CANONICAL_ORIGIN = "https://councilof.ai";
export const WWW_HOST = "www.councilof.ai";

export function wwwToApex(request: Request): Response | null {
  const url = new URL(request.url);
  // URL.hostname is already lower-cased and port-free; also drop an FQDN trailing dot.
  const host = url.hostname.replace(/\.$/, "");
  if (host !== WWW_HOST) return null;
  const method = request.method.toUpperCase();
  const status = method === "GET" || method === "HEAD" ? 301 : 308;
  return new Response(null, {
    status,
    headers: {
      location: CANONICAL_ORIGIN + url.pathname + url.search,
      "cache-control": "public, max-age=3600",
    },
  });
}
