/**
 * GET /chat/ — 308 to Council OS home.
 * Home is marketing, not the OS.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/dashboard?tab=home",
      "cache-control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
