import { describe, expect, it } from "vitest";
import { acknowledgedLeadStorage } from "./leadReceipt";

describe("assessment enquiry acknowledgement", () => {
  it("accepts only the exact stored:true and ok:true response", () => {
    expect(acknowledgedLeadStorage(200, { ok: true, stored: true })).toBe(true);
    for (const value of [
      null, {}, [], "stored", { ok: true }, { stored: true },
      { ok: "true", stored: true }, { ok: true, stored: "true" },
      { ok: true, stored: false }, { ok: false, stored: true },
    ]) {
      expect(acknowledgedLeadStorage(200, value)).toBe(false);
    }
  });
  it("does not claim a lead was saved from another status or an unknown response", () => {
    for (const status of [201, 202, 204, 400, 403, 500, 503]) {
      expect(acknowledgedLeadStorage(status, { ok: true, stored: true })).toBe(false);
    }
  });
});
