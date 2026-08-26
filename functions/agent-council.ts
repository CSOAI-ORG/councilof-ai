/**
 * GET /agent-council - 308 to the lobby.
 * Retracted 33-agent guarantee. Do not 308 onto /agent-council/.
 * Functions bump so deploy.yml publishes exact-150 after #795 (sov3* extras gone).
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
