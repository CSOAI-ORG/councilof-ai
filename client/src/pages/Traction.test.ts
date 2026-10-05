import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Traction.tsx", import.meta.url), "utf8");
const ia = readFileSync(new URL("../data/library-ia.ts", import.meta.url), "utf8");

describe("traction public-truth contract", () => {
  it("derives operating and commercial counters from public JSON", () => {
    for (const endpoint of ["/root.json", "/api/revenue", "/api/commissions", "/api/coverage", "/api/worker", "/api/corrections"]) {
      expect(source).toContain(endpoint);
    }
    expect(source).toContain("No cached number substituted");
  });

  it("counts published corrections from the ledger, never a typed number", () => {
    expect(source).toContain("corrections.value.corrections.length");
    expect(source).toContain('label="Published corrections"');
    expect(source).not.toMatch(/Published corrections" value="\d/);
  });

  it("headlines outside commissions only, never the raw receipt count", () => {
    expect(source).toContain("commissions.value?.by_origin");
    expect(source).toContain('label="Outside commissions"');
    expect(source).toContain("value={live.commissions?.outside}");
    expect(source).not.toContain('label="Open commissions"');
    expect(source).not.toMatch(/value=\{live\.commissions\?\.count\}/);
  });

  it("separates external signals, participation, first-party metrics and commercial proof", () => {
    expect(source).toContain("Independent assessment");
    expect(source).toContain("Listing / discovery");
    expect(source).toContain("Participation / programme");
    expect(source).toContain("First-party measurement");
    expect(source).toContain("Commercial proof");
    expect(source).toContain("Pending / unverified");
    expect(source).toContain("signal.signal_class");
    expect(source).toContain("MEMBERSHIPS.rows.find");
    expect(source).toContain("does not imply endorsement, adoption or a customer");
    expect(source).toContain("does not claim repeat-payer or maintained-renewal evidence");
  });

  it("publishes canonical and JSON-LD discovery metadata without ratings", () => {
    expect(source).toContain('rel="canonical" href="https://councilof.ai/traction/"');
    expect(source).toContain('type="application/ld+json"');
    expect(source).toContain('"@type": "WebPage"');
    expect(source).toContain('"@type": "ItemList"');
    expect(source).not.toMatch(/AggregateRating|ReviewRating|ratingValue/);
  });

  it("does not hard-code stale third-party grades or tool counts", () => {
    expect(source).not.toContain("Glama Quality A");
    expect(source).not.toContain("twelve discoverable tools");
    expect(source).not.toContain("CSOAI-ORG/councilof-ai");
  });

  it("does not promote withdrawn blog routes as live evidence", () => {
    expect(source).toContain("Legacy blog routes remain under the reviewed publication hold");
    expect(source).not.toContain('href="/blog/"');
  });

  it("removes the stale August vanity inventory and keeps traction primary", () => {
    expect(source).not.toMatch(/15574|21091|579 public repos|last audit: 2026-08-10/);
    expect(ia).toMatch(/"\/faq", "\/traction"/);
  });
});
