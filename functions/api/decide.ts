/**
 * GET /api/decide — not implemented; no decision attestation is created.
 */
// @openapi-not-implemented
import { unavailable } from "./_unavailable";

export const onRequestGet: PagesFunction = async () => unavailable(
  "/api/decide",
  "Persist and sign a decision attestation",
);
