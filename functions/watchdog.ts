/**
 * GET /watchdog — 308 leftover analyst-training/earnings door off the public rail.
 * Home is marketing, not the OS.
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
