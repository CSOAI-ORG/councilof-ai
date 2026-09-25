/**
 * Typed access to the canonical buyer-facing descriptions. JSON is deliberate: the OpenAPI
 * producer and the TypeScript handlers consume the same bytes instead of maintaining two copies.
 */
import descriptions from "./x402-descriptions.json";

export const PROOF_BUNDLE_DESCRIPTION = descriptions.proof_bundle;
export const RECEIPTS_BATCH_DESCRIPTION = descriptions.receipts_batch;

export const REQUEST_ATTESTATION_DESCRIPTION = descriptions.request_attestation;

/** Self-serve RAS doors (functions/api/ras/*) — one fresh computation each, receipt signed. */
export const RAS_MCP_PROBE_DESCRIPTION = descriptions.ras_mcp_probe;
export const RAS_X402_CHECK_DESCRIPTION = descriptions.ras_x402_check;
export const RAS_SUPPLY_DESCRIPTION = descriptions.ras_supply;

/** Population doors (GET /api/pop/{population}) — keyed `pop_<id>`; the same bytes the manifest, catalogue and OpenAPI read. */
export const POPULATION_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  Object.entries(descriptions as Record<string, string>).filter(([k]) => k.startsWith("pop_")).map(([k, v]) => [k.slice("pop_".length), v]),
);
