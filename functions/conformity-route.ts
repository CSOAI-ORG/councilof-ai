/**
 * GET /conformity-route and /conformity-route/ - 308 to the lobby.
 * Measurement, not certification. We do not run a conformity assessment.
 * Do not 308 onto /conformity-route/.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/honesty/",
      "cache-control": "public, max-age=300",
    },
  });
}
