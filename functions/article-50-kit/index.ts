/** GET /article-50-kit/ - 308 to Council OS. Measurement, not a shop. */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/os?lobby=home",
      "cache-control": "public, max-age=300",
    },
  });
}
