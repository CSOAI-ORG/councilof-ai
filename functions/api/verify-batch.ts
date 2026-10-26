/**
 * GET /api/verify-batch — not implemented; no cards are verified.
 */
// @openapi-not-implemented
import { unavailable } from "./_unavailable";
import { headFromGet } from "./_head";

export const onRequestGet: PagesFunction = async () => unavailable(
  "/api/verify-batch",
  "Verify a batch of signed cards against published keys and canonicalisation rules",
);

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
