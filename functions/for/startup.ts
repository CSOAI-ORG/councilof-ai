/**
 * GET /for/startup and /for/startup/ - 308 to the sector lobby door.
 * PersonaRouter still sells leftover copy after hydrate.
 * Do not 308 onto /for/startup/.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home&task=sector-brief",
      "cache-control": "public, max-age=300",
    },
  });
}
