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
const attestation = readFileSync(join(dir, "AttestationNetwork.tsx"), "utf8");
const products = readFileSync(join(dir, "Products.tsx"), "utf8");

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

  it("routes the canonical buyer explainer into the real job chooser", () => {
    expect(app).toMatch(/path="\/pricing" component=\{Pricing\}/);
    expect(app).not.toMatch(/path="\/pricing" component=\{PlansPage\}/);
    expect(app).not.toMatch(/const PlansPage = lazy/);
    expect(app).toMatch(/path="\/pricing-free" component=\{ContentReviewNotice\}/);
    expect(prerender).toMatch(/"\/pricing-free"/);
    expect(ia).toMatch(/"\/pricing-free"/);
    expect(products).toMatch(/href: "\/dashboard\?task=pricing-overview&tab=measured"/);
    expect(products).toMatch(/Paid routes disclose the exact amount only in their live 402 challenge/);
    expect(attestation).not.toMatch(/href="\/pricing-free"/);
    expect(attestation.match(/href="\/pricing"/g)).toHaveLength(2);
  });

  it("labels unpublished integrations as source or notes rather than installs", () => {
    expect(products).not.toMatch(/href="\/extension\/"/);
    expect(products).toMatch(/Browser extension source/);
    expect(products).toMatch(/No browser-store install claimed/);
    expect(products).toMatch(/Grok integration source/);
    expect(products).toMatch(/Source, not a store listing/);
    expect(products).toMatch(/Hermes integration notes/);
    expect(products).toMatch(/No public installation package/);
    expect(products).not.toMatch(/~\/.hermes\/skills/);
  });
});
