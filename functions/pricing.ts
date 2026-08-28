/**
 * GET /pricing and /pricing/ — 308 to Council OS Assess door.
 * Do not 308 onto /pricing/ — Pages invokes this Function for both
 * slash and no-slash, which made a self-redirect loop.
 * Do not type public prices here. Home is marketing, not the OS.
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
