/**
 * GET /jobs — leftover careers door onto Council OS.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/dashboard?tab=home",
      "cache-control": "public, max-age=300",
    },
  });
}
