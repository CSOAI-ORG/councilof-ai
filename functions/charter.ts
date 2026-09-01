/**
 * GET /charter and /charter/ - 308 leftover public-price CTA.
 * Live page still shows Founding Patron £50,000 and View All License Tiers.
 * Charter.tsx is too large to rewrite via MCP. Do not 308 onto /charter/.
 * Do not type public prices here.
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
