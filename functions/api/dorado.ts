/**
 * GET /api/dorado — 308 to the current bench.
 * Retired internal codename. Do not serve the old JSON body.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/api/east-west-bench",
      "cache-control": "public, max-age=300",
    },
  });
}
