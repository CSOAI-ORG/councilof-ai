/**
 * GET /payg - 308 to the pricing lobby.
 * Still mounts leftover Free-daily / Standard / Deep bundle copy after hydrate.
 * No public prices. A grade is never sold. Do not 308 onto /payg/.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=pricing-overview",
      "cache-control": "public, max-age=300",
    },
  });
}
