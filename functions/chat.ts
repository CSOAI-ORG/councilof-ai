/**
 * GET /chat — 308 to Council OS home.
 * Do not 308 onto the homepage — Home is marketing, not the OS.
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
