/**
 * GET /agent-council - 308 to the lobby.
 * Retracted 33-agent guarantee. Do not 308 onto /agent-council/.
 * Functions bump after 313-fat merge c271d32 / eb894c23. Card restored exact-150.
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
