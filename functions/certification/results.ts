/**
 * GET /certification/results and /certification/results/ - 308 to the lobby.
 * Retracted exam. Measurement, not certification.
 * Do not 308 onto /certification/results/.
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
