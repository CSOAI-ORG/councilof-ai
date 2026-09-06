/**
 * PHASE C. /services must be the rail's doors, not a brochure.
 *
 * Copy assertions run against the source with its leading docstring stripped —
 * that docstring names the old typed tiles and the dead /legacy link, so
 * asserting over the whole file would pass on the explanation.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/lib/__fixtures__/x402-manifest-2026-09-06.json";
import { GROUPS, buildCatalogue } from "@/lib/servicesCatalogue";

const raw = readFileSync(resolve(__dirname, "Services.tsx"), "utf8");
const copy = raw.replace(/^\s*import[\s\S]*?\/\*[\s\S]*?\*\//, "");
const nav = readFileSync(resolve(__dirname, "../components/HeaderNav.tsx"), "utf8");

describe("/services reads the rail, never a typed list", () => {
  it("fetches the manifest", () => {
    expect(raw).toContain('"/.well-known/x402.json"');
    expect(raw).toContain("buildCatalogue");
  });

  it("carries no typed door list any more", () => {
    expect(copy).not.toMatch(/const SERVICES\s*[:=]/);
    for (const p of ["/api/free-door", "/api/proof", "/api/rwa/evidence"]) {
      expect(copy).not.toContain(p);
    }
  });

  it("no longer sends visitors to /legacy, which renders a withdrawal notice", () => {
    expect(copy).not.toContain('"/legacy"');
  });

  it("renders all five groups, including any that are empty", () => {
    const c = buildCatalogue(manifest);
    expect(c.groups.map((g) => g.group.id)).toEqual(GROUPS.map((g) => g.id));
    expect(raw).toContain("No door in this group is published on the rail today");
  });

  it("shows the nine live doors the fixture publishes", () => {
    const c = buildCatalogue(manifest);
    expect(c.total).toBe(9);
    expect(c.groups.flatMap((g) => g.cards).length).toBe(9);
    expect(c.ungrouped).toEqual([]);
  });

  it("surfaces an ungrouped door loudly rather than dropping it", () => {
    expect(raw).toContain("services-ungrouped");
    expect(raw).toContain("Published on the rail, not yet grouped here");
  });

  it("renders nothing rather than inventing doors when the manifest is unread", () => {
    expect(raw).toContain("services-unread");
    expect(copy).toMatch(/listing a door we could not read/);
  });

  it("obeys the 6 Sep ruling: no prices, no tiers, no processor names", () => {
    expect(copy).not.toMatch(/£|\$\d|\bUSD\b|per (month|year|seat)/i);
    expect(copy).not.toMatch(/\btiers\b|pricing tier/i);
    expect(copy).not.toMatch(/stripe|paypal|adyen|braintree|checkout\.com/i);
  });

  it("takes the pay line from the manifest, not from this page", () => {
    expect(copy).toContain("c.payLine");
    expect(copy).not.toContain("Pay-as-you-go x402 at the 402.");
  });
});

describe("the header offers Services between Board and Verify", () => {
  it("is a primary link", () => {
    expect(nav).toContain('{ name: "Services", href: "/services" }');
  });

  it("sits between Verify and Board", () => {
    const order = [...nav.matchAll(/\{ name: "([^"]+)", href: "([^"]+)" \}/g)].map((m) => m[1]);
    const i = order.indexOf("Services");
    expect(i).toBeGreaterThan(-1);
    expect(order[i - 1]).toBe("Verify");
    expect(order[i + 1]).toBe("Board");
  });
});

describe("a primary nav destination is not an archived page", () => {
  it("is registered in PRIMARY_PATHS", () => {
    const ia = readFileSync(resolve(__dirname, "../data/library-ia.ts"), "utf8");
    // Without this, ArchivedBanner renders "Reference / archive — kept for the
    // record" on a page the header links to as a primary destination. Measured
    // on the preview before it was added.
    expect(ia).toContain('"/services"');
  });
});
