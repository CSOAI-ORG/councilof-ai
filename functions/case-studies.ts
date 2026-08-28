/**
 * GET /case-studies — 308 to Council OS Assess door.
 * Do not type public prices. Home is marketing, not the OS.
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
