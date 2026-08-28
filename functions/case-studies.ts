/**
 * GET /case-studies and /case-studies/ - 308 leftover View Pricing CTA.
 * CaseStudies.tsx is too large to rewrite via MCP. Do not 308 onto /case-studies/.
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
