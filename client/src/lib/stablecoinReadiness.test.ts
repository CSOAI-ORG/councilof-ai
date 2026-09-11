import { describe, expect, it } from "vitest";
import { filterStablecoinReadiness, isStablecoinReadiness, stablecoinEvidenceFlags, type StablecoinReadinessAsset } from "./stablecoinReadiness";

const row = (symbol: string, state: "MEASURED" | "UNMEASURED", review = false): StablecoinReadinessAsset => ({
  id: symbol,
  name: `${symbol} Coin`,
  symbol,
  chains: symbol === "RLUSD" ? ["Ethereum", "XRPL"] : ["Ethereum"],
  chain_deployment_count: symbol === "RLUSD" ? 2 : 1,
  index_state: "INDEXED",
  measurement: { state, depth: state === "MEASURED" ? "PARTIAL_ONE_CHAIN_XRPL" : "NONE", freshness: "AS_RECORDED", evidence_urls: [] },
  signature_state: state === "MEASURED" ? "SIGNED" : "NO_ASSET_MEASUREMENT_SIGNATURE",
  root_state: state === "MEASURED" ? "ROOTED" : "NO_ASSET_MEASUREMENT_IN_CURRENT_ROOT",
  anchor_state: state === "MEASURED" ? "REKOR" : "NO_ASSET_MEASUREMENT_ANCHOR",
  a2a_discovery_state: "GENERIC_CATALOG_ONLY_NO_ASSET_SKILL",
  mcp_discovery_state: "GENERIC_CATALOG_ONLY_NO_ASSET_TOOL",
  x402_door_state: "GENERIC_EXISTING_DATA_DOOR_NO_ASSET_SETTLEMENT_VERIFIED",
  correction_lineage: { state: review ? "SEMANTIC_REVIEW_REQUIRED" : "NONE_DECLARED", note: "", supersedes: [] },
});

describe("stablecoin readiness data", () => {
  it("rejects indexed rows relabeled as measured without a measurement depth", () => {
    const asset = row("USDT", "UNMEASURED");
    asset.measurement.state = "MEASURED";
    const payload = { schema: "csoai.stablecoin-readiness/v1", coverage: { indexed_assets: 1 }, assets: [asset] };
    expect(isStablecoinReadiness(payload)).toBe(false);
  });

  it("searches names, symbols and chains and filters evidence states", () => {
    const assets = [row("USDT", "UNMEASURED"), row("RLUSD", "MEASURED", true)];
    expect(filterStablecoinReadiness(assets, "xrpl", "ALL").map((asset) => asset.symbol)).toEqual(["RLUSD"]);
    expect(filterStablecoinReadiness(assets, "", "UNMEASURED").map((asset) => asset.symbol)).toEqual(["USDT"]);
    expect(filterStablecoinReadiness(assets, "", "REVIEW").map((asset) => asset.symbol)).toEqual(["RLUSD"]);
  });

  it("does not infer signature, root or settlement from measurement state", () => {
    const asset = row("USDT", "MEASURED");
    asset.measurement.evidence_urls = ["https://councilof.ai/cards/example.json"];
    asset.signature_state = "NO_ASSET_MEASUREMENT_SIGNATURE";
    asset.root_state = "NO_ASSET_MEASUREMENT_IN_CURRENT_ROOT";
    expect(stablecoinEvidenceFlags(asset)).toEqual({ measured: true, signed: false, rooted: false, settled: false });
  });
});
