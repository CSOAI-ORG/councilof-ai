import { describe, expect, it } from "vitest";
import { ANCHORING_CLAIM, XRPL_STATUS_LABEL } from "./anchoringClaim";

describe("anchoring claim — ledger is a pointer, not a grade", () => {
  it("does not promise mainnet grades or a planned market", () => {
    expect(ANCHORING_CLAIM).toMatch(/reader of GET \/root\.json/i);
    expect(ANCHORING_CLAIM).toMatch(/writes_board false/);
    expect(ANCHORING_CLAIM).toMatch(/not issuing GSPC grades/i);
    expect(ANCHORING_CLAIM).not.toMatch(/\/xrpl-attest page is a separate DEVNET pointer/i);
    expect(ANCHORING_CLAIM).not.toMatch(/mainnet is planned/i);
    expect(XRPL_STATUS_LABEL).toBe("public-root reader — not a grade");
  });
});

describe("OTS is err, not a shipped product", () => {
  it("does not call OpenTimestamps live", () => {
    expect(ANCHORING_CLAIM).not.toMatch(/OpenTimestamps anchoring is on the roadmap/i);
  });
});
