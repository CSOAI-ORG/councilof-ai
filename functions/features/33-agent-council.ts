/**
 * GET /features/33-agent-council and /features/33-agent-council/ - 308 to the lobby.
 * Retracted Byzantine 33-agent feature. Measurement, not certification.
 * Do not 308 onto /features/33-agent-council/.
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
