/**
 * GET /about-credential and /about-credential/ - 308 to the lobby.
 * Still mounts AboutCEASAI after hydrate. Measurement, not certification.
 * Do not 308 onto /about-credential/.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300",
    },
  });
}
