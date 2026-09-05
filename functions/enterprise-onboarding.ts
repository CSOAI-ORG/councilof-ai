/**
 * GET /enterprise-onboarding — 308 to Council OS Assess door.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/dashboard?tab=measured&task=enterprise-start",
      "cache-control": "public, max-age=300",
    },
  });
}
