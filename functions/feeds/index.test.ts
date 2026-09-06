import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { entries as corrections } from "./corrections.xml";
import { entries as cards } from "./cards.xml";
import { entries as roots } from "./roots.xml";

const src = readFileSync(resolve(__dirname, "index.ts"), "utf8");

describe("/feeds is an index that cannot overstate what it indexes", () => {
  it("carries a rel=alternate for every feed it lists", () => {
    // rel=alternate is the mechanism feed readers, crawlers and answer engines actually use.
    // The four feeds shipped without one and were reachable only by knowing the path.
    for (const p of ["/feeds/corrections.xml", "/feeds/corrections.atom", "/feeds/cards.xml", "/feeds/roots.xml"]) {
      expect(src).toContain(p);
    }
    expect(src).toContain('rel="alternate"');
  });

  it("lists every feed module that exists — no feed can be silently omitted", () => {
    const shipped = readdirSync(__dirname)
      .filter((f) => /\.(xml|atom)\.ts$/.test(f))
      .map((f) => "/feeds/" + f.replace(/\.ts$/, ""));
    for (const p of shipped) expect(src).toContain(p);
  });

  it("reads counts from the feed modules rather than typing them", () => {
    // If this page typed a count it would be wrong the first time a feed changed.
    expect(src).toMatch(/entries as corrections/);
    expect(src).toMatch(/entries as cards/);
    expect(src).toMatch(/entries as roots/);
    expect(corrections().length).toBeGreaterThan(0);
    expect(cards().length).toBeGreaterThan(0);
    expect(roots().length).toBe(1);
  });

  it("says UNAVAILABLE rather than 0 when a module will not load", () => {
    // A feed whose entries() throws must not render as "0 items" — that reads as a measured
    // emptiness. absent is not zero.
    expect(src).toContain("UNAVAILABLE");
    expect(src).toMatch(/n:\s*c\?\.length\s*\?\?\s*null/);
  });

  it("does not edit the badger-produced descriptor, and says whose it is", () => {
    expect(src).toContain("csoai-monorepo-fill.py");
    expect(src).toMatch(/rendered here unchanged|NOT edited here/);
  });

  it("keeps the honest line about the legacy feed's frozen titles", () => {
    expect(src).toMatch(/freeze counts the live board has moved past/);
    expect(src).toMatch(/we do not certify/);
  });
});
