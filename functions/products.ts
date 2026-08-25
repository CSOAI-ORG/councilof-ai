/**
 * GET /products - 308 to the enterprise lobby door.
 * Do not 308 onto /products/ - Pages invokes this Function for both
 * slash and no-slash, which made a self-redirect loop.
 * No public prices. A grade is never sold. /enterprise is the lobby door.
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
