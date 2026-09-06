/** GET /landing/ - 308 to the lobby. Measurement, not certification. */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/os?lobby=home",
      "cache-control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
