/**
 * GET /stack — 308 to the published stack index.
 * Serve /stack/* as assets; this hop only covers the bare path.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/stack/index.json",
      "cache-control": "public, max-age=300",
    },
  });
}
