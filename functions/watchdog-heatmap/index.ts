/**
 * GET /watchdog-heatmap/ — slash variant. Do not 308 onto itself.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/os?lobby=home",
      "cache-control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
