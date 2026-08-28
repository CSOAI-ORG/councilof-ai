/**
 * GET /claimguard — 308 to /honesty/.
 * Pages .html rewrite plus a 200 storefront rule self-looped.
 * Do not 308 onto /claimguard.html.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/honesty/",
      "cache-control": "public, max-age=300",
    },
  });
}
