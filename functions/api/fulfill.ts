/**
 * GET /api/fulfill — public fulfillment door is closed.
 *
 * No public prices. A grade is never sold. Verify is free at /gspc-verify.
 * Get measured at /assess. We do not remediate. Empty cells stay empty.
 *
 * @openapi-closed
 */
import { headFromGet } from "./_head";
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

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
