/**
 * GET /stripe-checkout.js — 410 Gone.
 * Route retired. Do not restore. Do not redirect.
 */
export function onRequest() {
  return new Response("410 Gone — this route has been permanently removed.", {
    status: 410,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" },
  });
}
