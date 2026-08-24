/**
 * GET /for/regulator and /for/regulator/ - 308 to the regulator lobby door.
 * Do not 308 onto /for/regulator/.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home&task=regulator-brief",
      "cache-control": "public, max-age=300",
    },
  });
}
