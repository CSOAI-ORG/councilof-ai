/**
 * GET /agent-council - 308 to the lobby.
 * Retracted 33-agent guarantee. Do not 308 onto /agent-council/.
 * Functions bump so deploy.yml publishes restored exact-150 after 313-fat tip.
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
