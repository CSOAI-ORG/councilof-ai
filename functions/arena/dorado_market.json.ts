/**
 * GET /arena/dorado_market.json — retired Dorado path.
 * Alias of /arena/east-west-market.json (same market snapshot).
 * /api/dorado already 308s to /api/east-west-bench.
 */
export async function onRequestGet() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/arena/east-west-market.json",
      "cache-control": "public, max-age=300",
    },
  });
}
