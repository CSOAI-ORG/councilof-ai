/**
 * GET /ceasai and /ceasai/ - 308 to the lobby.
 * Retracted credential brand. Measurement, not certification.
 * Do not 308 onto /ceasai/.
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
