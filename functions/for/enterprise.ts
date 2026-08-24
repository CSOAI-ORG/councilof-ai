/**
 * GET /for/enterprise - 308 to Council OS measured door.
 * PersonaRouter still sells Measure once. Show the signed card after hydrate.
 * Do not 308 onto /for/enterprise/ - Pages invokes this Function for both slashes.
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
