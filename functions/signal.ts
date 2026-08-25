/**
 * GET /signal — 308 to /signals/ (J-D5).
 * Pages Functions beat a missing or clobbered public/_redirects 404.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/signals/",
      "cache-control": "public, max-age=300",
    },
  });
}
