/**
 * GET /api/verify-card — not implemented; no card is verified.
 */
// @openapi-not-implemented
import { unavailable } from "./_unavailable";
import { headFromGet } from "./_head";

export const onRequestGet: PagesFunction = async () => unavailable(
  "/api/verify-card",
  "Verify a signed card against its canonical SHA-256 identifier and published signing key",
);

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
