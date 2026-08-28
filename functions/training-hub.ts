/**
 * GET /training-hub and /training-hub/ - 308 to the lobby.
 * Still sells Get Certified / certification exam after hydrate.
 * Measurement, not certification. Do not 308 onto /training-hub/.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/os?lobby=home",
      "cache-control": "public, max-age=300",
    },
  });
}
