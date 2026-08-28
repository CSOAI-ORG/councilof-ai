/**
 * GET /sovereign-pricing and /sovereign-pricing/ - 308 to the pricing lobby door.
 * SPA still serves this alias. No public prices. Do not 308 onto /sovereign-pricing/ or /pricing/.
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
