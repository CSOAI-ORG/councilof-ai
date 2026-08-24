/** GET /certification/review/ - 308 to the lobby. Measurement, not certification. */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300",
    },
  });
}
