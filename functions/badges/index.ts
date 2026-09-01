/** GET /badges/ - 308 to /badge. Measurement, not certification. */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/badge",
      "cache-control": "public, max-age=300",
    },
  });
}
