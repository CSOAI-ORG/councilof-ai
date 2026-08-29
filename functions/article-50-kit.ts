/**
 * GET /article-50-kit and /article-50-kit/ — leftover shop door (Stripe / public price).
 * Hide the kit SKU. One C2PA demo lives at /packs/eu-article-50 (measured durability).
 * Do not 308 onto /article-50-kit/. Do not touch /article-50 (honest statute page).
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/packs/eu-article-50",
      "cache-control": "public, max-age=300",
    },
  });
}
