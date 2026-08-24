/**
 * GET /for/ - 308 to Council OS measured door.
 * Do not 308 onto /for/enterprise/.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=enterprise-start",
      "cache-control": "public, max-age=300",
    },
  });
}
