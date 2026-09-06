/**
 * GET /corpus — 308 to signed signals (J-D5).
 * Pages Functions beat a missing or clobbered public/_redirects 404.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/signals/",
      "cache-control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
