/**
 * GET /for — 308 to Council OS Assess door.
 * Do not 308 onto /for/enterprise/ — that is the old persona sales page after hydrate.
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
