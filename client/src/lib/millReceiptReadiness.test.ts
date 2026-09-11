import { describe, expect, it } from "vitest";
import { isMillReceiptReadiness, regulationLabel, type MillReceipt } from "./millReceiptReadiness";

const row: MillReceipt = {
  id: "a".repeat(64), card_url: "/card.json", model: "model", axis: "governance", measured_at: null,
  outer_signature: { state: "VALID", alg: "Ed25519", key: "did:web:csoai.org#board-attestation-1" },
  declared_lifecycle: "STAGED_UNSIGNED",
  regulatory_linkage: { state: "UNLINKED", source_state: "UNLINKED", refs: [], regulation_score_eligible: false },
};

describe("mill receipt readiness", () => {
  it("keeps outer validity separate from declared lifecycle", () => {
    expect(isMillReceiptReadiness({ schema: "csoai.mill-receipt-readiness/v1", receipts: [row] })).toBe(true);
    expect(row.outer_signature.state).toBe("VALID");
    expect(row.declared_lifecycle).toBe("STAGED_UNSIGNED");
  });
  it("prohibits regulation-scored language for unlinked receipts", () => {
    expect(regulationLabel(row)).toBe("unlinked; no regulation score");
    const falseClaim = structuredClone(row);
    falseClaim.regulatory_linkage.regulation_score_eligible = true;
    expect(isMillReceiptReadiness({ schema: "csoai.mill-receipt-readiness/v1", receipts: [falseClaim] })).toBe(false);
  });
});
