/**
 * GET /solutions — 308 consolidation (Stage 39/40 J-D1).
 * Pages Functions beat a missing or clobbered public/_redirects 404.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/assess/",
      "cache-control": "public, max-age=300",
    },
  });
}
