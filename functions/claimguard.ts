/**
 * GET /claimguard — 308 to /honesty/.
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
