/**
 * GET /council-licensing and /council-licensing/ - 308 to the lobby.
 * Leftover sales page. No public prices. Do not 308 onto /council-licensing/.
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
