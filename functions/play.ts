/**
 * GET /play — 308 to Council Space arena.
 * Space family: /simulate already hops here. Do not invent /os?lobby=play.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/gspc-arena",
      "cache-control": "public, max-age=300",
    },
  });
}
