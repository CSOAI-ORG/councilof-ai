/**
 * GET /frontier-atlas — 308 to Dorado product door (J-D5).
 * Pages Functions beat a missing or clobbered public/_redirects 404.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/east-west/",
      "cache-control": "public, max-age=300",
    },
  });
}
