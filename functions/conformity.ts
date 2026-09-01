/**
 * GET /conformity and /conformity/ - 308 to the lobby.
 * Measurement, not certification. We issue no conformity mark.
 * Do not 308 onto /conformity/.
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
