/**
 * Typed access to the canonical buyer-facing descriptions. JSON is deliberate: the OpenAPI
 * producer and the TypeScript handlers consume the same bytes instead of maintaining two copies.
 */
import descriptions from "./x402-descriptions.json";

export const PROOF_BUNDLE_DESCRIPTION = descriptions.proof_bundle;
export const RECEIPTS_BATCH_DESCRIPTION = descriptions.receipts_batch;
