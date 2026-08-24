/**
 * GET /for/healthcare and /for/healthcare/ - 308 to the sector lobby door.
 * PersonaRouter still sells leftover copy after hydrate.
 * Do not 308 onto /for/healthcare/.
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
