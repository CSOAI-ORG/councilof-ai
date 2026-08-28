/**
 * GET /pricing — 308 to Council OS Assess door.
 * Do not 308 onto /pricing/. Do not type public prices.
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
