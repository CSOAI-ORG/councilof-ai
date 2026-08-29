import { describe, expect, it } from "vitest";
import { ANCHORING_CLAIM, XRPL_STATUS_LABEL } from "./anchoringClaim";

describe("anchoring claim — ledger is a pointer, not a grade", () => {
  it("does not promise mainnet grades or a planned market", () => {
    expect(ANCHORING_CLAIM).toMatch(/DEVNET pointer/i);
    expect(ANCHORING_CLAIM).toMatch(/not issuing GSPC grades/i);
    expect(ANCHORING_CLAIM).not.toMatch(/mainnet is planned/i);
    expect(XRPL_STATUS_LABEL).toBe("devnet pointer — not a grade");
  });
});
