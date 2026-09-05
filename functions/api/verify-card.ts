/**
 * GET /api/verify-card — not implemented; no card is verified.
 */
// @openapi-not-implemented
import { unavailable } from "./_unavailable";

export const onRequestGet: PagesFunction = async () => unavailable(
  "/api/verify-card",
  "Verify a signed card against its canonical SHA-256 identifier and published signing key",
);
