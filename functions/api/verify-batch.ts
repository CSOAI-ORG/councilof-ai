/**
 * GET /api/verify-batch — not implemented; no cards are verified.
 */
// @openapi-not-implemented
import { unavailable } from "./_unavailable";

export const onRequestGet: PagesFunction = async () => unavailable(
  "/api/verify-batch",
  "Verify a batch of signed cards against published keys and canonicalisation rules",
);
