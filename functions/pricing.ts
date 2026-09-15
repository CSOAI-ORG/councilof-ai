/**
 * GET /pricing — 308 directly to the canonical Council OS pricing overview.
 * Do not route through the retired /os compatibility door. Do not type public prices.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/dashboard/?tab=measured&task=pricing-overview",
      "cache-control": "public, max-age=300",
    },
  });
}
