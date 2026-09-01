/** GET /advisory/ - 308 to the lobby. We do not remediate. Measurement, not certification. */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/os?lobby=home",
      "cache-control": "public, max-age=300",
    },
  });
}
