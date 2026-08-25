/**
 * GET /get-measured - 308 to Council OS measured door.
 * Pages Functions beat a missing or clobbered public/_redirects 404.
 * Do not 308 onto /get-measured/.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=get-measured",
      "cache-control": "public, max-age=300",
    },
  });
}
