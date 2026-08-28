/**
 * GET /badges — 308 leftover badge door onto Council OS.
 * A grade is never sold. Home is marketing, not the OS.
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
