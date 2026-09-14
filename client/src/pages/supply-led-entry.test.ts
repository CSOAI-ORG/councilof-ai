import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) =>
  readFileSync(resolve(__dirname, path), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

const surfaces = [
  ["homepage", source("HomeVerify.tsx")],
  ["board", source("../components/home/HomeGspcBoard.tsx")],
  ["services", source("Services.tsx")],
  ["quickstart", source("Quickstart.tsx")],
] as const;

const hierarchy = [
  "Explore measurements",
  "See what changed",
  "Verify evidence",
  "Access supported feeds",
] as const;

describe("public entry surfaces use the supply-led evidence hierarchy", () => {
  for (const [name, text] of surfaces) {
    it(`${name}: measurements → changes → verification → feeds`, () => {
      const positions = hierarchy.map((label) => text.indexOf(label));
      expect(positions.every((position) => position >= 0)).toBe(true);
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
    });
  }

  it("quickstart keeps commissioning after the four public reads", () => {
    const text = source("Quickstart.tsx");
    expect(text.indexOf("5 · Optional: commission an output"))
      .toBeGreaterThan(text.indexOf("4 · Access supported feeds"));
  });
});
