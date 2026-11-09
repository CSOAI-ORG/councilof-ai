import { describe, it, expect } from "vitest";
import { evaluatePostMergeBatch, verifyCardEd25519 } from "../verify-post-merge-batch.mjs";

describe("verify-post-merge-batch (E1)", () => {
  const sampleSha = "001e8bd830605eb149a4bc6423019f609e90a048919c9383adf28aea975a9429";
  const sampleSig = "a".repeat(128);

  it("evaluates all four post-merge lines as PASS when live invariants hold", () => {
    const res = evaluatePostMergeBatch({
      gspcPayload: {
        totals: {
          public_count: "34 axes · 34 measured",
          measured_axes: 34,
          unmeasured_axes: 0,
        },
      },
      axesHtml: "<html><body>GSPC 34 axes reconciliation" + "x".repeat(1100) + "</body></html>",
      cardPayload: {
        card: {
          sha256: sampleSha,
          sig_ed25519: sampleSig,
          did: "did:web:csoai.org#card-attestation-1",
        },
      },
      expectedSha64: sampleSha,
      rootPayload: {
        merkle_root: "4e57607854bea40122c738aa83bbcfcd0d7bd7461add1683af4ee011e1e08aa0",
        leaves: [sampleSha],
      },
      bundlePayload: {
        merkle_root: "4e57607854bea40122c738aa83bbcfcd0d7bd7461add1683af4ee011e1e08aa0",
        cards: {
          [sampleSha]: { card: { sha256: sampleSha, sig_ed25519: sampleSig } },
        },
      },
    });
    expect(res.ok).toBe(true);
    expect(res.lines).toHaveLength(4);
    expect(res.lines.every((l) => l.status === "PASS")).toBe(true);
  });

  it("returns UNCHECKABLE when sig_ed25519 is missing", () => {
    const v = verifyCardEd25519({ card: { sha256: sampleSha, sig_ed25519: null } });
    expect(v.verdict).toBe("UNCHECKABLE");
  });
});
