/**
 * GET /evidence — 404 Not Found.
 * Route dropped from live catalog; soft-live chrome removed.
 * Measurement not certification.
 */
export function onRequest() {
  return new Response("404 Not Found — this page does not exist.", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
