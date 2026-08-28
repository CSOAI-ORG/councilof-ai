/** GET /sovereign-pricing/ - 308 to the pricing lobby door. No public prices. */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/os?lobby=assess&task=pricing-overview",
      "cache-control": "public, max-age=300",
    },
  });
}
