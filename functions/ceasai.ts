/**
 * GET /ceasai — 308 retracted certification door onto Council OS.
 * CEASAI is retracted. Home is marketing, not the OS.
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
