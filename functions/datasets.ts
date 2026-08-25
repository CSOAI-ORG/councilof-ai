/**
 * GET /datasets — 308 to published GSPC axis dataset JSON.
 * Pages Functions beat a missing or clobbered public/_redirects 404.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/datasets/gspc-axis-v0.1.0/dataset.json",
      "cache-control": "public, max-age=300",
    },
  });
}
