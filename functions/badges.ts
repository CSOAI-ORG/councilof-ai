/**
 * GET /badges - 308 to /badge (white-label kit).
 * Measurement, not certification. Functions run before _redirects.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/badge",
      "cache-control": "public, max-age=300",
    },
  });
}
