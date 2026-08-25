/**
 * GET /jobs — 308 leftover analyst-jobs door off the public rail.
 * Do not 308 onto itself. Do not type public prices here.
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
