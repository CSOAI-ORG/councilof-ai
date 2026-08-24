/**
 * GET /for - 308 to Council OS measured door.
 * Pages Functions beat leftover public/_redirects that send /for to /for/enterprise/.
 * Do not 308 onto /for/enterprise/ - that is the old persona sales page after hydrate.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=enterprise-start",
      "cache-control": "public, max-age=300",
    },
  });
}
