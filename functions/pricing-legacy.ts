/**
 * GET /pricing-legacy and /pricing-legacy/ - 308 to the pricing lobby door.
 * Route still mounts the retired Pricing page after hydrate.
 * Do not 308 onto /pricing-legacy/ or /pricing/.
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
