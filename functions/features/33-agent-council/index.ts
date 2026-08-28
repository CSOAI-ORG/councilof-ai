/** GET /features/33-agent-council/ - 308 to the lobby. Retracted Byzantine feature. Measurement, not certification. */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/honesty/",
      "cache-control": "public, max-age=300",
    },
  });
}
