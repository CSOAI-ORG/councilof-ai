/**
 * GET /settings/billing - 308 to the measured pricing-overview lobby.
 * Do not 308 onto /settings/billing/. No public prices. A grade is never sold.
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
