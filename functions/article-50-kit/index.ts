/** GET /article-50-kit/ — leftover shop. One C2PA demo is /packs/eu-article-50. */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/packs/eu-article-50",
      "cache-control": "public, max-age=300",
    },
  });
}
