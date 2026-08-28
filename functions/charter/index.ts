/**
 * GET /charter/ - 308 leftover public-price CTA.
 * Slash variant. Do not 308 onto itself.
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
