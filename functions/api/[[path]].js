/**
 * /api/* catch-all — real 404 JSON, never the SPA shell.
 * Unknown /api paths must NOT fall through to the SPA catch-all (soft-404
 * poison: crawlers and agent probes get HTML pretending to be a page).
 * Specific handlers (mcp, tools, gspc, assess…) take precedence.
 */
export function onRequest(context) {
  const p = context.params && Array.isArray(context.params.path)
    ? context.params.path.join("/")
    : "";
  return new Response(
    JSON.stringify({
      error: "not_found",
      path: p ? `/api/${p}` : "/api",
      hint: "See the MCP registry entry io.github.CSOAI-ORG/gspc for live endpoints, or /api/mcp for the server catalogue.",
    }),
    {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    }
  );
}
