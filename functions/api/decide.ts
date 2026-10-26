/**
 * GET /api/decide — not implemented; no decision attestation is created.
 */
// @openapi-not-implemented
import { unavailable } from "./_unavailable";
import { headFromGet } from "./_head";

export const onRequestGet: PagesFunction = async () => unavailable(
  "/api/decide",
  "Persist and sign a decision attestation",
);

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
