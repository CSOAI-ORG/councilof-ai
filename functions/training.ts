/**
 * GET /training and /training/ - 308 to the lobby.
 * Still mounts leftover attestation-exam / competitor-price copy after hydrate.
 * Measurement, not certification. Do not 308 onto /training/.
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
