/**
 * GET /api/health — JSON health, never the SPA shell.
 * Claims E2E asserts this returns JSON (the shell HTML was the soft-404 bug).
 */
export function onRequestGet() {
  return new Response(
    JSON.stringify({
      status: "ok",
      service: "councilof.ai",
      timestamp: new Date().toISOString(),
      endpoints: [
        "/api/mcp",
        "/api/tools",
        "/api/gspc",
        "/api/assess",
        "/api/health",
        "/api/receipts/latest",
        "/api/dorado",
        "/api/evidence-pack",
      ],
    }),
    {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    }
  );
}
