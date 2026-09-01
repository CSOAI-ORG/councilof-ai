/**
 * GET /how-it-works/dashboard and slash variant - 308 to the lobby.
 * Leftover certification/jobs guide. Measurement, not certification.
 * Do not 308 onto /how-it-works/dashboard/.
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
