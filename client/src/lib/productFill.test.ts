import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FILL_PIPELINE, FILL_ROWS, FILL_RULING, fillByLayer, fillSkuIds } from "./productFill";

const products = readFileSync(resolve(__dirname, "../pages/Products.tsx"), "utf8");

describe("Product fill — one cell, many views", () => {
  it("keeps four SKUs and forbids a fused SOV grade or a Council-issued bond", () => {
    expect(FILL_RULING).toMatch(/Nothing downstream writes MEASURED/);
    expect(fillSkuIds()).toEqual(["verify", "run", "ledger-sku", "data-sku"]);
    expect(FILL_PIPELINE[0]).toMatch(/only MEASURED write/);
    expect(fillByLayer("forbidden").some((r) => r.id === "fused-sov")).toBe(true);
    expect(fillByLayer("forbidden").some((r) => r.id === "release-bond")).toBe(true);
    expect(FILL_ROWS.some((r) => r.id === "xrpl" && r.never.includes("MEASURED"))).toBe(true);
    expect(FILL_ROWS.some((r) => r.id === "trex" && /issuer/i.test(r.never) && /bond/i.test(r.never))).toBe(true);
    expect(FILL_ROWS.some((r) => r.id === "otel" && r.never.includes("MEASURED"))).toBe(true);
    expect(FILL_ROWS.some((r) => r.id === "coverage-index" && /fused SOV grade/i.test(r.never))).toBe(true);
    expect(FILL_ROWS.some((r) => r.id === "corrections" && r.href === "/api/corrections")).toBe(true);
  });

  it("does not invent a tradable index or a public seat price", () => {
    const blob = JSON.stringify({ FILL_ROWS, FILL_RULING, FILL_PIPELINE });
    expect(blob).not.toMatch(/£79|£499|rank for sale|22\/22|dorado|cibola|sovos|sov3/i);
    expect(blob).not.toMatch(/we (?:issue|mint|underwrite) (?:a )?(?:bond|security)/i);
    expect(products).toContain("ProductFill");
  });
});
