/**
 * GET /agent-council - 308 to the lobby.
 * Retracted 33-agent guarantee. Do not 308 onto /agent-council/.
 * Functions bump after 717f7462 re-landed 313 + chain.json; floor restored 150.
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
