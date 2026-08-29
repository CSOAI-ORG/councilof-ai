import { describe, it, expect } from "vitest";
import { SKUS } from "./Products";

describe("Series A SKU lock", () => {
  it("exposes exactly four public SKUs", () => {
    expect(SKUS).toHaveLength(4);
    expect(SKUS.map((s) => s.id)).toEqual(["verify", "os", "ledger", "data"]);
  });

  it("never sells a grade or a certificate", () => {
    const blob = JSON.stringify(SKUS).toLowerCase();
    expect(blob).not.toMatch(/start certification/);
    expect(blob).not.toMatch(/certified analyst/);
    expect(blob).not.toMatch(/conformity mark/);
    expect(blob).toMatch(/never a purchased public rank|never buy a score/);
  });

  it("keeps Verify free and OS as the workspace", () => {
    expect(SKUS[0].href).toBe("/gspc-verify");
    expect(SKUS[1].href).toBe("/os");
    expect(SKUS[0].tag.toLowerCase()).toMatch(/free/);
  });
});
