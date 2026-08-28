/**
 * GET /how-it-works/training and /how-it-works/training/ - 308 to the lobby.
 * Leftover "Certify in 8 Weeks" guide. Measurement, not certification.
 * Do not 308 onto /how-it-works/training/.
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
