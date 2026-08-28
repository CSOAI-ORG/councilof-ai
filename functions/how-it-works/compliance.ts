/**
 * GET /how-it-works/compliance and slash variant - 308 to the lobby.
 * Leftover implementation-steps sales page. We measure. We do not remediate.
 * Do not 308 onto /how-it-works/compliance/.
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
