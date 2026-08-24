/**
 * GET /pricing - 308 to the honest /pricing/ SPA.
 * Apex /pricing without a slash has been serving a leftover £99/£199 Stripe stub.
 * Pages Functions beat a clobbered pricing.html. Do not type public prices here.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/pricing/",
      "cache-control": "public, max-age=300",
    },
  });
}
