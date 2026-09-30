/** GET /partners/ - 308 straight to /memberships/ (one hop). We do not remediate. Measurement, not certification. */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/memberships/",
      "cache-control": "public, max-age=300",
    },
  });
}
