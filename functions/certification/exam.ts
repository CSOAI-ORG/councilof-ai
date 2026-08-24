/**
 * GET /certification/exam and /certification/exam/ - 308 to the lobby.
 * Retracted exam. Measurement, not certification.
 * Do not 308 onto /certification/exam/.
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
