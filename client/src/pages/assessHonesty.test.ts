/**
 * /assess claims two different things are unavailable, and they have different
 * truth values. This binds each to bytes.
 *
 * Every assertion about page copy runs against the source with its leading
 * block comment REMOVED. That comment explains the old wording and therefore
 * contains the exact strings this file forbids — asserting over the whole file
 * would pass on the explanation instead of the page, which is how
 * CookieConsent.test.ts came to assert "pr-16" against a comment.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/lib/__fixtures__/x402-manifest-2026-09-06.json";

const raw = readFileSync(resolve(__dirname, "AssessTool.tsx"), "utf8");
/** The page, minus the leading /* ... *​/ docstring. */
const copy = raw.replace(/^\s*\/\*[\s\S]*?\*\//, "");

const paths = (manifest as { resources: { url: string }[] }).resources.map(
  (r) => new URL(r.url).pathname,
);

describe("what /assess says is unavailable", () => {
  it("the rail itself is live — the manifest says so", () => {
    expect((manifest as { mode?: string }).mode).toBe("live");
    expect(paths.length).toBe(9);
  });

  it("assessment is genuinely not one of the published doors", () => {
    // The load-bearing fact behind the copy. When assessment IS published as a
    // door, this reds and the sentence on the page must change with it.
    expect(paths).not.toContain("/api/assess");
  });

  it("no longer calls the live rail 'not live yet'", () => {
    expect(copy).not.toMatch(/x402 \(not live yet\)/);
    expect(copy).not.toMatch(/not live yet/);
  });

  it("still says booking is not live, which remains true", () => {
    expect(copy).toContain("Booking is not live");
  });

  it("names the manifest as the source of what is payable", () => {
    expect(copy).toContain("/.well-known/x402.json");
  });

  it("obeys the 6 Sep owner ruling: no prices, no tiers, no processor names", () => {
    expect(copy).not.toMatch(/£|\$\d|\bUSD\b|per (month|year|seat)|\/mo\b/i);
    expect(copy).not.toMatch(/\btiers\b|pricing tier|price tier/i);
    expect(copy).not.toMatch(/stripe|paypal|checkout\.com|adyen|braintree/i);
  });

  it("keeps the legal-tier disclaimer, which is not a pricing tier", () => {
    // The ruling bans PRICING tiers. "establish legal tier, lawfulness" is an
    // EU AI Act risk-tier disclaimer and is the opposite of a sales claim — a
    // bare /\btier\b/ ban would delete a disclaimer to satisfy a pricing rule.
    expect(copy).toMatch(/does not validate the input or establish legal tier/);
  });

  it("does not promise a free signed run", () => {
    expect(copy).toMatch(/Paid measurement/);
    expect(copy).not.toMatch(/free signed (run|card)/i);
  });
});
