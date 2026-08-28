/**
 * GET /certified and /certified/ - 308 to the lobby.
 * Leftover certification door. Measurement, not certification.
 * Do not 308 onto /certified/. Do not touch /certificates (signed-in).
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
