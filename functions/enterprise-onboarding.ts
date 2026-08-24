/**
 * GET /enterprise-onboarding and /enterprise-onboarding/ - 308 to the lobby.
 * Leftover wizard still sells AI compliance in minutes.
 * Do not 308 onto /enterprise-onboarding/ - Pages invokes this Function for both.
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
