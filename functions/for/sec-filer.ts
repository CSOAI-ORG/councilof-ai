/**
 * GET /for/sec-filer and /for/sec-filer/ - 308 to the regulator lobby door.
 * Unknown persona falls through to enterprise sales copy after hydrate.
 * Do not 308 onto /for/sec-filer/.
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
