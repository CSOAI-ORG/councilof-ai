import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SKUS } from "./Products";

/**
 * /products — anchored page tests (v2.1 gates, source-scan style: no DOM deps).
 * Asserts the three page anchors: the four public SKU lines, the
 * /pricing-free rail link, and the price-free doctrine.
 */

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, "Products.tsx"), "utf8");

describe("/products anchored page", () => {
  it("exports exactly the four public SKUs the lock names", () => {
    expect(SKUS).toHaveLength(4);
    expect(SKUS.map((s) => s.id)).toEqual(["verify", "run", "ledger", "data"]);
    expect(SKUS[0].href).toBe("/gspc-verify");
    expect(SKUS[1].href).toBe("/assess");
  });

  it("never sells a grade or a certificate in any SKU prose", () => {
    const blob = JSON.stringify(SKUS).toLowerCase();
    expect(blob).not.toMatch(/start certification/);
    expect(blob).not.toMatch(/certified analyst/);
    expect(blob).not.toMatch(/conformity mark/);
    expect(blob).toMatch(/never a purchased public rank|never buy a score/);
  });

  it("links the metered /pricing-free page (free rail wiring)", () => {
    expect(src).toMatch(/href: "\/pricing-free"/);
  });

  it("never prints a price-like string (price-gate doctrine)", () => {
    expect(src).not.toMatch(/[£$€]\s?\d/);
    expect(src).not.toMatch(/stripe|subscribe now|most popular|best value/i);
  });

  it("keeps the Verification-is-free-forever framing", () => {
    expect(src).toMatch(/free forever/i);
    expect(src).toMatch(/Measurement, not certification|verify .* offline|never a purchased public rank/i);
  });
});
