import { describe, it, expect } from "vitest";
import { SKUS } from "./Products";

describe("Series A SKU lock", () => {
  it("exposes exactly four public lines", () => {
    expect(SKUS).toHaveLength(4);
    expect(SKUS.map((s) => s.id)).toEqual(["verify", "run", "ledger", "data"]);
  });

  it("never sells a grade or a certificate", () => {
    const blob = JSON.stringify(SKUS).toLowerCase();
    expect(blob).not.toMatch(/start certification/);
    expect(blob).not.toMatch(/certified analyst/);
    expect(blob).not.toMatch(/conformity mark/);
    expect(blob).toMatch(/never a purchased public rank|never buy a score/);
  });

  it("keeps Verify free, scopes commissions, and leaves enterprise arms on enquiry", () => {
    expect(SKUS[0].href).toBe("/gspc-verify");
    expect(SKUS[1].href).toBe("/dashboard?tab=measured");
    expect(SKUS[1].tag).toBe("Scoped commission");
    expect(SKUS[1].what).toMatch(/does not promise an instant fresh measurement/);
    expect(SKUS[0].tag.toLowerCase()).toMatch(/free/);
    expect(SKUS[2].tag.toLowerCase()).toMatch(/enquiry/);
    expect(SKUS[2].href).toBe("/contact?arm=ledger");
    expect(SKUS[3].href).toBe("/contact?arm=data");
  });
});
