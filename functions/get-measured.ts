/**
 * GET /get-measured — 308 to Council OS Assess door.
 * Do not 308 onto /get-measured/. Home is marketing, not the OS.
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
