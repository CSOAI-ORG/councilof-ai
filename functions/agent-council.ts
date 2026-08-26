/**
 * GET /agent-council - 308 to the lobby.
 * Retracted 33-agent guarantee. Do not 308 onto /agent-council/.
 * Functions bump after untyping well-known 14-slot / 14-of-14 copy.
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
