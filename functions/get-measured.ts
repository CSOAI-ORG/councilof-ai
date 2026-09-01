/**
 * GET /get-measured — 308 to Council OS Assess door.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/os?lobby=assess&task=get-measured",
      "cache-control": "public, max-age=300",
    },
  });
}
