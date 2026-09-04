/**
 * GET /api/include — not implemented; no Merkle inclusion proof is produced.
 */
// @openapi-not-implemented
import { unavailable } from "./_unavailable";

export const onRequestGet: PagesFunction = async () => unavailable(
  "/api/include",
  "Produce a Merkle inclusion proof for a published card",
);
