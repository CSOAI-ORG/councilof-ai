/**
 * GET /pricing and /pricing/ - 308 to the lobby pricing door.
 * Do not 308 onto /pricing/ - Pages invokes this Function for both
 * slash and no-slash, which made a self-redirect loop.
 * Do not type public prices here.
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
