/**
 * GET /api/fulfill — public fulfillment door is closed.
 *
 * No public prices. A grade is never sold. Verify is free at /gspc-verify.
 * Get measured at /assess. We do not remediate. Empty cells stay empty.
 */
export const onRequestGet: PagesFunction = async () => {
  return Response.json(
    {
      configured: false,
      public_prices: false,
      message:
        "No public prices. A grade is never sold. Verify is free at /gspc-verify. Get measured at /assess. Email nicholas@csoai.org.",
    },
    { status: 404 },
  );
};
