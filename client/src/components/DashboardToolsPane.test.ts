import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FREE_TOOLS,
  METERED_TOOLS,
  PUBLISHED_TOOL_COUNT,
} from "./DashboardToolsPane";

describe("dashboard MCP inventory", () => {
  it("matches the runtime's free and paid tools, by name", () => {
    expect(FREE_TOOLS).toEqual([
      "board_totals",
      "get_axis",
      "verify_card",
      "list_cards",
      "get_root",
      "get_card",
      "verify_inclusion",
      "x402_trust",
      "mcp_trust",
      "measurement_index",
      "verify_capsule",
      "server_evidence",
      "evidence_bundle_preview",
      "route",
      "axis_governance",
      "axis_safety",
      "axis_provenance",
      "axis_continuity",
      "axis_conformance",
      "axis_openness",
      "axis_machinery-conformity",
      "axis_care",
      "axis_cross-reality",
      "axis_detector-interop",
      "axis_art5-safeguard",
      "axis_swarm",
      "axis_affect",
      "axis_jail",
      "axis_effect-binding",
      "axis_provenance-controls",
      "axis_reserve-attestation",
      "axis_regulatory-framework",
      "axis_distribution-integrity",
      "axis_custody-disclosure",
      "axis_ai-adoption-components",
      "axis_labour-components",
      "axis_humanoid-labour-index",
      "axis_lab-practice",
      "axis_company-practice",
      "axis_measurer-integrity",
      "axis_harness-fidelity",
      "axis_interop-conformance",
      "axis_humanoid-deployment",
      "axis_regulator-transparency",
      "axis_interpretability-reproducibility",
      "axis_claim-maintenance",
      "axis_serving-fidelity",
    ]);
    expect(METERED_TOOLS).toEqual([
      "commission_card",
      "art50_marking_evidence",
      "rwa_evidence",
      "receipts_batch",
      "evidence_bundle",
    ]);
    expect(PUBLISHED_TOOL_COUNT).toBe(52);
  });

  it("does not advertise the quarantined witness SKU", () => {
    const source = readFileSync(
      resolve(__dirname, "./DashboardToolsPane.tsx"),
      "utf8",
    );
    expect(source).not.toContain('"witness_hash"');
  });
});
