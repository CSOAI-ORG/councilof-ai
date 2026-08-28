/**
 * GET /certification and /certification/ - 308 to the lobby.
 * Measurement, not certification. Do not 308 onto /certification/.
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
