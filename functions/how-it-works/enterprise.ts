/**
 * GET /how-it-works/enterprise and slash variant - 308 to the measured lobby.
 * Leftover "AI Compliance Implementation" sales page.
 * Do not 308 onto /how-it-works/enterprise/.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/os?lobby=assess&task=enterprise-start",
      "cache-control": "public, max-age=300",
    },
  });
}
