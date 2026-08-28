/**
 * GET /readiness-assessment — 308 to /assess.
 * Functions beat _redirects; a 404 here made the live door dead.
 * Measurement not certification.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/assess",
      "cache-control": "public, max-age=300",
    },
  });
}
