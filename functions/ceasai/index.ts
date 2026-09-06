/** GET /ceasai/ - 308 to honesty. Retracted credential brand. */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/honesty/",
      "cache-control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
