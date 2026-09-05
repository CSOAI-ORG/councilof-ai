import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { SKUS } from "./Products";

/**
 * /products states "No page types a count" in its own ENGINE block, and then typed one: the
 * heading read "The four SKUs" over a hand-maintained array. Four was right, but it was right by
 * coincidence — add a fifth entry and the heading would have kept saying four.
 */
describe("/products types no count", () => {
  const src = readFileSync(new URL("./Products.tsx", import.meta.url), "utf8");

  it("derives the SKU heading from the array", () => {
    expect(src).toMatch(/The \{SKUS\.length\} SKUs/);
    expect(src).not.toMatch(/>The four SKUs</);
  });

  it("has the four commercial arms today — and would still be honest with five", () => {
    expect(SKUS.length).toBe(4);
    expect(SKUS.map((s) => s.id).sort()).toEqual(["data", "ledger", "run", "verify"]);
  });

  it("names no public price, on a page whose own ruling forbids them", () => {
    const body = src.replace(/\/\*[\s\S]*?\*\//g, " ");
    expect(body).not.toMatch(/[£$]\s?\d/);
  });
});
