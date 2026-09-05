import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ANCHORING_CLAIM, XRPL_STATUS_LABEL } from "./anchoringClaim";
import witness from "../../../public/interop/root-witness-latest.json";

const dashboardAttestations = readFileSync(
  resolve(__dirname, "../components/DashboardAttestationsPane.tsx"),
  "utf8",
);
const chainSource = readFileSync(resolve(__dirname, "./chain.ts"), "utf8");
const registrySource = readFileSync(resolve(__dirname, "../pages/AgentRegistry.tsx"), "utf8");

describe("anchoring claim — ledger is a pointer, not a grade", () => {
  it("does not promise mainnet grades or a planned market", () => {
    expect(ANCHORING_CLAIM).toMatch(/reader of GET \/root\.json/i);
    expect(ANCHORING_CLAIM).toMatch(/writes_board false/);
    expect(ANCHORING_CLAIM).toMatch(/not issuing GSPC grades/i);
    expect(ANCHORING_CLAIM).not.toMatch(/\/xrpl-attest page is a separate DEVNET pointer/i);
    expect(ANCHORING_CLAIM).not.toMatch(/mainnet is planned/i);
    expect(XRPL_STATUS_LABEL).toBe("public-root reader — not a grade");
  });

  it("removes contradictory roadmap copy from registry and chain call sites", () => {
    expect(chainSource).not.toMatch(/OpenTimestamps anchoring is roadmap/i);
    expect(registrySource).not.toMatch(/OpenTimestamps anchoring is roadmap/i);
  });

  it("renders pointer drift as a timestamped historical observation", () => {
    expect(dashboardAttestations).toContain("driftCheckedAt");
    expect(dashboardAttestations).toMatch(/timestamped historical observation/);
    expect(dashboardAttestations).toMatch(/exact-byte check is shown above/);
  });
});

describe("OTS state follows the current root sidecar", () => {
  it("derives the current root state and keeps queued atoms outside it", () => {
    expect(ANCHORING_CLAIM).not.toMatch(/OpenTimestamps anchoring is on the roadmap/i);
    const status = String((witness as any).witnesses?.ots?.status ?? "UNCHECKABLE");
    expect(ANCHORING_CLAIM).toContain(status);
    expect(ANCHORING_CLAIM).toMatch(/exact public root\.json bytes only/i);
    expect(ANCHORING_CLAIM).toMatch(/not the separate signed-card index/i);
    expect(ANCHORING_CLAIM).toMatch(/Queued and candidate atoms are not automatically admitted, published, or anchored/i);
    if (status === "CONFIRMED_BITCOIN") {
      expect(ANCHORING_CLAIM).toMatch(/OpenTimestamps witness(?: at block \d+)?/i);
    } else if (status === "STAMPED_PENDING_BITCOIN") {
      expect(ANCHORING_CLAIM).toMatch(/does not yet prove inclusion in a Bitcoin block/i);
    }
  });
});
