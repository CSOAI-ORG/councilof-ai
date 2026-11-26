import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { verifySubjectBanks, PINNED_SUBJECT_BANKS, reconcileSubjectBank } from "../verify-subject-banks.mjs";

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

describe("subject bank internal consistency", () => {
  const spec = PINNED_SUBJECT_BANKS.find(s => s.axis === "lab-practice");
  const load = s => JSON.parse(readFileSync(new URL("../../" + (s.bank.startsWith("public/") ? s.bank : "public/" + s.bank), import.meta.url), "utf8"));
  const canon = v => v === null || typeof v !== "object" ? JSON.stringify(v) : Array.isArray(v) ? "[" + v.map(canon).join(",") + "]" : "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
  it("preserves frame ordinal gaps and recomputes every payload", () => {
    const b = load(spec);
    expect(b.items.some((r, i) => r.ordinal !== i + 1)).toBe(true);
    const result = reconcileSubjectBank(b, spec);
    expect(result.ok).toBe(true);
    expect(result.details.recomputed_positive).toBe(spec.n);
    expect(result.details.recomputed_digest_mutation_controls).toBe(spec.n);
  });
  for (const [name, mutate, error] of [
    ["inflated denominator", b => b.n_valid++, "BANK_DENOMINATOR"],
    ["wrong method", b => b.method_sha256 = "0".repeat(64), "METHOD_BINDING"],
    ["duplicate identity", b => b.items[1] = structuredClone(b.items[0]), "ITEM_ID:1"],
    ["wrong ordinal", b => b.items[0].ordinal = 0, "ITEM_BINDING:0"],
    ["changed payload", b => b.items[0].payload.content_sha256 = "0".repeat(64), "PAYLOAD_DIGEST:0"],
    ["forged presence count even after repin", b => {
      b.items[0].payload.checks_present = 0;
      b.items[0].expected_payload_sha256 = createHash("sha256").update(canon(b.items[0].payload)).digest("hex");
    }, "PRESENCE_COUNT:0"],
    ["false control verdict", b => b.items[0].negative_control_verdict = "VALID", "NEGATIVE_CONTROL:0"],
    ["changed score", b => b.score = .1234, "DISCLOSURE_SCORE"],
  ]) {
    it("rejects " + name, () => {
      const b = load(spec); mutate(b);
      const result = reconcileSubjectBank(b, spec);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain(error);
    });
  }
  it("reports claim observation rows separately from distinct claims", () => {
    const c = PINNED_SUBJECT_BANKS.find(s => s.axis === "claim-maintenance");
    const b = load(c);
    const result = reconcileSubjectBank(b, c);
    expect(result.ok).toBe(true);
    expect(result.details).toMatchObject({ observation_rows:182, reachable_rows:174, unique_claim_ids:91, distinct_canonical_rows:157, independence_established:false });
    b.counts.CHANGED++;
    expect(reconcileSubjectBank(b, c).errors).toContain("CLAIM_COUNT:CHANGED");
  });
  it("rejects duplicate axis specs even if every file individually verifies", () => {
    const specs = [...PINNED_SUBJECT_BANKS.slice(0,10), PINNED_SUBJECT_BANKS[0]];
    expect(verifySubjectBanks({specs}).ok).toBe(false);
  });
});
