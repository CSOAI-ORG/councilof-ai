/**
 * GET /enterprise-plans and /enterprise-plans/ - 308 to the pricing lobby door.
 * _redirects only maps /enterprise-plans (no slash) to /pricing; slash variant still serves the SPA.
 * Do not 308 onto /enterprise-plans/ or /pricing/.
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
