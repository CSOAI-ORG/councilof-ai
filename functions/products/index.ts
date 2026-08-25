/**
 * GET /products/ - 308 to the enterprise lobby door.
 * Do not 308 onto /products/. No public prices. A grade is never sold.
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
