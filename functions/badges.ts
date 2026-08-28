/**
 * GET /badges - 308 to the lobby.
 * Still mounts leftover Council-Verified / EU-AI-Act-Ready badge copy after hydrate.
 * Measurement, not certification. Do not 308 onto /badges/.
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
