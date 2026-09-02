import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TIERS } from "./PricingFree";

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, "PricingFree.tsx"), "utf8");
const app = readFileSync(join(dir, "..", "App.tsx"), "utf8");
const ia = readFileSync(join(dir, "..", "data", "library-ia.ts"), "utf8");
const prerender = readFileSync(join(dir, "..", "..", "..", "scripts", "prerender.mjs"), "utf8");

describe("/pricing-free — the explainer names no price and sells no grade", () => {
  it("has no currency amount, per-unit price, or tier ladder in prose", () => {
    expect(src).not.toMatch(/[£$€]\s?\d/);
    expect(src).not.toMatch(/\d+\s?(?:USDC|usd)\b/i);
    expect(src).not.toMatch(/\bper\s+(?:month|year|seat|user)\b/i);
    expect(src).not.toMatch(/stripe|subscribe now|most popular|best value/i);
  });

  it("carries the three metered tiers, each with a Never line", () => {
    expect(TIERS.map((t) => t.id)).toEqual(["issuance", "evidence_bundle", "data_feed"]);
    for (const t of TIERS) {
      expect(t.never.length).toBeGreaterThan(20);
      expect(t.resource).toMatch(/^\/api\//);
    }
    expect(src).toMatch(/A grade is never sold/);
    expect(src).toMatch(/Measurement, not certification/);
    expect(src).toMatch(/free forever/i);
  });

  it("is wired four ways: route, prerender, PRIMARY_PATHS (no archive banner), and linked from /products", () => {
    expect(app).toMatch(/path="\/pricing-free"/);
    expect(prerender).toMatch(/"\/pricing-free"/);
    expect(ia).toMatch(/"\/pricing-free"/);
    expect(readFileSync(join(dir, "Products.tsx"), "utf8")).toMatch(/href: "\/pricing-free"/);
  });
});
