/**
 * GET /article-50-kit and /article-50-kit/ - 308 to Council OS.
 * Leftover kit product door (Stripe / public price). Measurement, not a shop.
 * Do not 308 onto /article-50-kit/. Do not touch /article-50 (honest statute page).
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
