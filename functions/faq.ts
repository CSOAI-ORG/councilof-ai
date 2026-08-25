/**
 * GET /faq and /faq/ - 308 leftover paid-plans copy off the public rail.
 * FAQ.tsx is too large to rewrite via MCP. Do not 308 onto /faq/.
 * Do not type public prices here.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=pricing-overview",
      "cache-control": "public, max-age=300",
    },
  });
}
