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

  it("reads the v2 file (signed receipts) instead of rejecting it whole", () => {
    // Shape of the live /interop/mill-receipt-readiness.json on 6 Oct 2026 (schema v2, SIGNED).
    const signed: MillReceipt = { ...structuredClone(row), declared_lifecycle: "SIGNED" };
    const v2 = {
      schema: "csoai.mill-receipt-readiness/v2",
      truth_rule: "Outer cryptographic validity, inner declared lifecycle, and regulatory linkage are independent states.",
      counts: { receipts: 1, outer_signature_valid: 1, declared_staged_unsigned: 0, declared_signed: 1, regulatory_linked: 0, regulatory_unlinked: 1 },
      receipts: [signed],
    };
    expect(isMillReceiptReadiness(v2)).toBe(true);
  });
  it("shows an INVALID or UNCHECKABLE outer signature rather than hiding the file", () => {
    for (const state of ["INVALID", "UNCHECKABLE"] as const) {
      const r = structuredClone(row);
      r.outer_signature.state = state;
      expect(isMillReceiptReadiness({ schema: "csoai.mill-receipt-readiness/v2", receipts: [r] })).toBe(true);
    }
    const unknown = structuredClone(row) as unknown as { outer_signature: { state: string } };
    unknown.outer_signature.state = "PROBABLY_FINE";
    expect(isMillReceiptReadiness({ schema: "csoai.mill-receipt-readiness/v2", receipts: [unknown] })).toBe(false);
    expect(isMillReceiptReadiness({ schema: "csoai.mill-receipt-readiness/v3", receipts: [row] })).toBe(false);
  });
});
