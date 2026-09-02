import { describe, expect, it } from "vitest";
import { parseMeasurementEnquiry } from "./lead";

const valid = {
  email: "buyer@example.com",
  organization: "Example Ltd",
  contact_name: "Buyer",
  system: "example/model at immutable revision",
  intended_use: "Support a procurement decision",
  evidence_needed: "GSPC behaviour cells and a private signed pack",
  target_date: "2026-10-01",
  disclosure_preference: "private-pack",
  endpoint: "https://example.com/model-card",
};

describe("measurement enquiry intake", () => {
  it("creates an explicit receipt state and operator work item state", () => {
    const parsed = parseMeasurementEnquiry(valid, "2026-09-02T12:00:00Z", "ME-test");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.record).toMatchObject({
      enquiry_id: "ME-test",
      state: "RECEIVED",
      operator_state: "PENDING_SCOPE",
      disclosure_preference: "private-pack",
    });
    expect(parsed.record.meaning).toMatch(/Not a measurement, score, quote, booking, certificate/i);
  });

  it("rejects a buyer record missing any required scoping fact", () => {
    for (const field of ["organization", "system", "intended_use", "evidence_needed", "target_date"]) {
      const parsed = parseMeasurementEnquiry({ ...valid, [field]: "" }, "2026-09-02T12:00:00Z", "ME-test");
      expect(parsed.ok, field).toBe(false);
    }
  });
});
