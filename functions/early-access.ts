/**
 * GET /early-access and /early-access/ - 308 to the lobby.
 * Leftover sales page. Get measured is /assess. Do not 308 onto /early-access/.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/os?lobby=home",
      "cache-control": "public, max-age=300",
    },
  });
}
