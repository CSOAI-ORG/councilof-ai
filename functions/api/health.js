/**
 * GET /api/health — JSON health, never the SPA shell.
 * Claims E2E asserts this returns JSON (the shell HTML was the soft-404 bug).
 */
import { headFromGet } from "./_head";
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

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
