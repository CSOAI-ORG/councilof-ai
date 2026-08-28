/**
 * GET /credential and /credential/ - 308 to the lobby.
 * Retracted credential brand. Measurement, not certification.
 * Do not 308 onto /credential/.
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
