/**
 * GET /roi-calculator and /roi-calculator/ - 308 to the pricing lobby.
 * SPA still serves a reference page that points at leftover /payg.
 * No public prices. A grade is never sold. Do not 308 onto /roi-calculator/.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/os?lobby=assess&task=pricing-overview",
      "cache-control": "public, max-age=300",
    },
  });
}
