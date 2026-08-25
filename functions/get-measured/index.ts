/**
 * GET /get-measured/ - 308 to Council OS measured door.
 * Slash variant. Do not 308 onto itself.
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
