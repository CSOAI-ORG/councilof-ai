import { describe, expect, it } from "vitest";
import { HOW_TO_VERIFY, howToVerifyLinks } from "./attestations";

const LEAF = "056a1efd58d1324912ee3fcfced1c7308e7571348167dfe27e0e261701dbce54";

describe("howToVerifyLinks — every link is followable", () => {
  it("never ships the bare /api/proof?sha= (a 400 by design)", () => {
    for (const leaves of [[LEAF], [], null, undefined, "x", ["not-hex"]]) {
      const links = howToVerifyLinks(leaves);
      expect(links.map((l) => l.href)).not.toContain("/api/proof?sha=");
      expect(links).toHaveLength(HOW_TO_VERIFY.length);
      expect(new Set(links.map((l) => l.label)).size).toBe(links.length);
    }
  });

  it("fills the proof door with a leaf of the root read on this load", () => {
    const proof = howToVerifyLinks(["nope", LEAF.toUpperCase()]).find((l) => l.href.startsWith("/api/proof"));
    expect(proof?.href).toBe(`/api/proof?sha=${LEAF}`);
    expect(proof?.label).toContain("of the root read on this load");
  });

  it("with no leaf read, points at root.json and says the example is UNCHECKABLE", () => {
    const links = howToVerifyLinks(null);
    const proof = links.find((l) => l.label.startsWith("GET /api/proof"));
    expect(proof?.href).toBe("/root.json");
    expect(proof?.label).toContain("UNCHECKABLE");
  });

  it("leaves every other link untouched", () => {
    const others = howToVerifyLinks([LEAF]).filter((l) => !l.label.startsWith("GET /api/proof"));
    expect(others).toEqual(HOW_TO_VERIFY.filter((l) => l.href !== "/api/proof?sha="));
  });
});
