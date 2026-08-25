/**
 * GET /first-fine — 308 to First-Fine Watch (J-D5).
 * Pages Functions beat a missing or clobbered public/_redirects 404.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/first-fine-watch/",
      "cache-control": "public, max-age=300",
    },
  });
}
