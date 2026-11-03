import { describe, it, expect } from "vitest";
import { verifySubjectBanks, PINNED_SUBJECT_BANKS } from "../verify-subject-banks.mjs";

describe("verify-subject-banks (E4)", () => {
  it("verifies all 11 subject-family frozen banks on disk with n >= 30 and matching SHA-256", () => {
    const report = verifySubjectBanks();
    expect(report.count).toBe(11);
    expect(report.ok).toBe(true);
    for (const r of report.results) {
      expect(r.status).toBe("VERIFIED");
      expect(r.n).toBeGreaterThanOrEqual(30);
      expect(r.actual_sha256).toBe(r.expected_sha256);
    }
  });

  it("fails closed when a bank_sha256 is altered", () => {
    const tampered = PINNED_SUBJECT_BANKS.map((s, idx) =>
      idx === 0 ? { ...s, bank_sha256: "0".repeat(64) } : s,
    );
    const report = verifySubjectBanks({ specs: tampered });
    expect(report.ok).toBe(false);
    expect(report.results[0].status).toBe("FAIL");
  });
});
