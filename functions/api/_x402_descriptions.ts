/**
 * Typed access to the canonical buyer-facing descriptions. JSON is deliberate: the OpenAPI
 * producer and the TypeScript handlers consume the same bytes instead of maintaining two copies.
 *
 * ONE SOURCE (2026-09-28, the prerequisite for the CDP Bazaar listing). Every x402 door's 402
 * (resource.description + accepts[].description — the text the Bazaar extension is catalogued
 * under), its /.well-known/x402.json row, council-os/capabilities.json (and so llms.txt and
 * openapi.json) read these bytes. functions/api/x402-descriptions.test.ts fails when any of them
 * differs. Each text says what is read or measured, which states the door can return, and that
 * verification is free; none carries a price, a grade or a score.
 */
import descriptions from "./x402-descriptions.json";
import DISCOVERY_SUBJECTS from "./discover/subjects.json";

const D = descriptions as Record<string, string>;

export const FREE_DOOR_DESCRIPTION = D.free_door;
export const PROOF_BUNDLE_DESCRIPTION = D.proof_bundle;
export const RECEIPTS_BATCH_DESCRIPTION = D.receipts_batch;
export const REQUEST_ATTESTATION_DESCRIPTION = D.request_attestation;
/**
 * The request-attestation door's listed example subject (7 Oct 2026, sell organ SG-10): a real model
 * with signed cards on file (/signed/card-matrix.json), replacing the placeholder
 * `model-or-subject-id`, which the OpenAPI producer published as a `const` and a self-test paid for
 * on 22 Sep as if it were a model.
 */
export const REQUEST_ATTESTATION_EXAMPLE_SUBJECT = "llama3.2:3b";
export const EVIDENCE_BUNDLE_DESCRIPTION = D.evidence_bundle;
export const DATA_FEED_DESCRIPTION = D.data_feed;
export const RWA_EVIDENCE_DESCRIPTION = D.rwa_evidence;
export const WRAPPER_DESCRIPTION = D.wrapper;
export const WRAPPER_CHANGES_DESCRIPTION = D.wrapper_changes;
export const ART50_MARKING_EVIDENCE_DESCRIPTION = D.art50_marking_evidence;
export const PROVIDER_DIFF_DESCRIPTION = D.provider_diff;
export const FRESH_CAPSULE_DESCRIPTION = D.fresh_capsule;

/** Per-asset wrapper doors (/api/wrapper/asset/<asset>): one template, the asset symbol filled in. */
export const wrapperAssetDescription = (assetSymbol: string) => D.wrapper_asset.replace("{ASSET}", assetSymbol);

/**
 * Zero-priced subject discovery doors (/api/discover/<id>): one template, the subject's label filled
 * in. The labels live in discover/subjects.json so the doors, /.well-known/x402.json and the OpenAPI
 * producer read the same bytes. Before 2026-10-06 the door's own 402, the manifest row and
 * capabilities.json each carried a different sentence.
 */
export const DISCOVERY_SUBJECT_LABELS = DISCOVERY_SUBJECTS as Record<string, string>;
export const subjectDiscoveryDescription = (label: string) => D.subject_discovery.replace("{SUBJECT}", label);

/** Self-serve RAS doors (functions/api/ras/*) — one fresh computation each, receipt signed. */
export const RAS_MCP_PROBE_DESCRIPTION = D.ras_mcp_probe;
export const RAS_X402_CHECK_DESCRIPTION = D.ras_x402_check;
export const RAS_SUPPLY_DESCRIPTION = D.ras_supply;

/** Population doors (GET /api/pop/{population}) — keyed `pop_<id>`; the same bytes the manifest, catalogue and OpenAPI read. */
export const POPULATION_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  Object.entries(D).filter(([k]) => k.startsWith("pop_")).map(([k, v]) => [k.slice("pop_".length), v]),
);

/**
 * The description every door PATH serves, for the surfaces that are keyed by path
 * (council-os/capabilities.json, openapi.json, llms.txt). Population and per-asset doors are
 * resolved from their path shape; everything else is named here once.
 */
export const DESCRIPTION_KEY_BY_PATH: Record<string, string> = {
  "/api/free-door": "free_door",
  "/api/request-attestation": "request_attestation",
  "/api/evidence-bundle": "evidence_bundle",
  "/api/signed-data-feed": "data_feed",
  "/api/proof": "proof_bundle",
  "/api/rwa/evidence": "rwa_evidence",
  "/api/wrapper": "wrapper",
  "/api/wrapper/changes": "wrapper_changes",
  "/api/art50/marking-evidence": "art50_marking_evidence",
  "/api/feeds/provider-diff": "provider_diff",
  "/api/receipts/batch": "receipts_batch",
  "/api/measurement/fresh-capsule": "fresh_capsule",
  "/api/ras/mcp-probe": "ras_mcp_probe",
  "/api/ras/x402-check": "ras_x402_check",
  "/api/ras/supply": "ras_supply",
};

export function descriptionForPath(path: string, assetSymbol?: string): string | null {
  const pop = path.match(/^\/api\/pop\/([^/]+)$/);
  if (pop) return POPULATION_DESCRIPTIONS[pop[1]] ?? null;
  if (/^\/api\/wrapper\/asset\/[^/]+$/.test(path)) return assetSymbol ? wrapperAssetDescription(assetSymbol) : null;
  const discover = path.match(/^\/api\/discover\/([^/]+)$/);
  if (discover) {
    const label = DISCOVERY_SUBJECT_LABELS[discover[1]];
    return label ? subjectDiscoveryDescription(label) : null;
  }
  const key = DESCRIPTION_KEY_BY_PATH[path];
  return key ? D[key] ?? null : null;
}
