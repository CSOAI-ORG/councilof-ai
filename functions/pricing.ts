/**
 * GET /pricing — RETIRED. The price surface now lives at /feed (the FeedLaunchPack
 * offer page, which carries the FEED tier prices under explicit owner approval).
 * Everything else that used to be here is moved to the dashboard pricing pane.
 * Measurement, not certification. Verification is free and needs no account.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      Location: "/dashboard/?tab=measured&task=pricing-overview",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
