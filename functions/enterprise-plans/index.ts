/**
 * GET /enterprise-plans/ — 308 to Council OS Assess door. No public prices.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/dashboard?tab=measured&task=pricing-overview",
      "cache-control": "public, max-age=300",
    },
  });
}
