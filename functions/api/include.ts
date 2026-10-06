/**
 * GET /api/include — not implemented; no Merkle inclusion proof is produced.
 */
// @openapi-not-implemented
import { unavailable } from "./_unavailable";
import { headFromGet } from "./_head";

export const onRequestGet: PagesFunction = async () => unavailable(
  "/api/include",
  "Produce a Merkle inclusion proof for a published card",
);

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
