/** GET /how-it-works/enterprise/ - 308 to the measured lobby. */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/os?lobby=assess&task=enterprise-start",
      "cache-control": "public, max-age=300",
    },
  });
}
