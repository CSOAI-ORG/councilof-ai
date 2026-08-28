/**
 * GET /enterprise — 308 to Council OS Assess door.
 * Pages Functions beat a missing or clobbered public/_redirects 404.
 * Do not 308 onto the homepage — Home is marketing, not the OS.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/os?lobby=assess&task=enterprise-start",
      "cache-control": "public, max-age=300",
    },
  });
}
