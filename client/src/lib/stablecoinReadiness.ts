export type StablecoinReadinessAsset = {
  id: string;
  name: string;
  symbol: string;
  chains: string[];
  chain_deployment_count: number;
  index_state: "INDEXED";
  measurement: {
    state: "MEASURED" | "UNMEASURED";
    depth: string;
    freshness: string;
    as_of?: string;
    evidence_urls: string[];
    measured_chains?: string[];
    unmeasured_scope?: string;
  };
  signature_state: string;
  root_state: string;
  anchor_state: string;
  a2a_discovery_state: string;
  mcp_discovery_state: string;
  x402_door_state: string;
  correction_lineage: { state: string; note: string; supersedes: string[] };
};

export type StablecoinReadiness = {
  schema: "csoai.stablecoin-readiness/v1";
  as_of: string;
  purpose: string;
  coverage: {
    indexed_assets: number;
    indexed_chain_deployments: number;
    distinct_asset_reported_chains: number;
    deeply_measured_assets: number;
    unmeasured_assets: number;
    asset_measurements_signed: number;
    asset_measurements_current_root_included: number;
    asset_measurements_rekor_witnessed_via_root: number;
    asset_measurements_bitcoin_anchored_via_current_root: number;
    asset_specific_a2a_skills: number;
    asset_specific_mcp_tools: number;
    asset_specific_x402_doors: number;
    asset_specific_x402_settlements_verified: number;
    post_freeze_discovery_candidates: number;
  };
  shared_evidence: {
    index_commitment: {
      commitment_card_url: string;
      root_sha256: string;
      merkle_root: string;
      rekor: { state: string; log_index: number | null; url: string | null };
      opentimestamps: { state: string; bitcoin_blocks: number[]; truth_rule: string };
      scope: string;
    };
  };
  shared_discovery: {
    a2a: { agent_card: string };
    mcp: { endpoint: string };
    x402: { endpoint: string; sku: string; fresh_compute_excluded: boolean };
  };
  assets: StablecoinReadinessAsset[];
  discovery_candidates: Array<{
    id: string;
    name: string;
    symbol: string;
    issuer: string;
    reported_chain: string;
    discovery_state: "REPORTED_BY_ISSUER_NOT_IN_FROZEN_INDEX";
    measurement_state: "UNMEASURED";
    source: { url: string; claim_scope: string };
  }>;
};

export function isStablecoinReadiness(value: unknown): value is StablecoinReadiness {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<StablecoinReadiness>;
  if (data.schema !== "csoai.stablecoin-readiness/v1" || !Array.isArray(data.assets)) return false;
  if (!Array.isArray(data.discovery_candidates)) return false;
  if (!data.coverage || data.assets.length !== data.coverage.indexed_assets) return false;
  return data.assets.every((asset) =>
    asset?.index_state === "INDEXED" &&
    Array.isArray(asset.chains) &&
    asset.chain_deployment_count === asset.chains.length &&
    (asset.measurement?.state === "MEASURED" || asset.measurement?.state === "UNMEASURED") &&
    !(asset.measurement?.state === "UNMEASURED" && asset.measurement?.depth !== "NONE") &&
    !(asset.measurement?.state === "MEASURED" && (
      asset.measurement?.depth === "NONE" || !asset.measurement?.evidence_urls?.length
    ))
  ) && data.discovery_candidates.every((candidate) =>
    candidate.discovery_state === "REPORTED_BY_ISSUER_NOT_IN_FROZEN_INDEX" &&
    candidate.measurement_state === "UNMEASURED"
  );
}

export function filterStablecoinReadiness(
  assets: StablecoinReadinessAsset[],
  query: string,
  state: "ALL" | "MEASURED" | "UNMEASURED" | "REVIEW",
): StablecoinReadinessAsset[] {
  const needle = query.trim().toLocaleLowerCase();
  return assets.filter((asset) => {
    const matchesQuery = !needle || [asset.name, asset.symbol, asset.id, ...asset.chains]
      .some((part) => String(part).toLocaleLowerCase().includes(needle));
    const matchesState = state === "ALL" ||
      (state === "REVIEW"
        ? asset.correction_lineage.state !== "NONE_DECLARED"
        : asset.measurement.state === state);
    return matchesQuery && matchesState;
  });
}

export function stablecoinEvidenceFlags(asset: StablecoinReadinessAsset) {
  return {
    measured: asset.measurement.state === "MEASURED",
    signed: asset.signature_state === "ASSET_MEASUREMENT_SIGNED_ED25519",
    rooted: asset.root_state === "ASSET_MEASUREMENT_IN_CURRENT_ROOT",
    settled: asset.x402_door_state.includes("SETTLEMENT_VERIFIED") &&
      !asset.x402_door_state.includes("NO_ASSET_SETTLEMENT_VERIFIED"),
  };
}

export async function loadStablecoinReadiness(signal?: AbortSignal): Promise<StablecoinReadiness> {
  const response = await fetch("/interop/stablecoin-universe-2026-09/readiness.json", {
    signal,
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`readiness unavailable (${response.status})`);
  const value: unknown = await response.json();
  if (!isStablecoinReadiness(value)) throw new Error("readiness contract invalid");
  return value;
}
