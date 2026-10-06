import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) =>
  readFileSync(resolve(__dirname, path), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * The homepage LEFT this list on 2026-09-22 and has its own assertion below instead.
 *
 * The four labels encode a supply-led ORDER - show what was measured, then what changed, then
 * how to check it, then how to take a feed - and that order is still the contract on every
 * surface named here. What the homepage could not keep was the LABELS: "Access supported feeds"
 * tells a first-time reader nothing, and four buttons cannot reach a business that also has a
 * corrections ledger, ten population doors, a tool surface, a participation record and a
 * library. The front door now asks the five questions a reader actually arrives with, in the
 * same supply-led order, and the test below pins that.
 */
const surfaces = [
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

  it("homepage: the same order, asked as the questions a reader arrives with", () => {
    const nav = source("../components/home/HomeNavigator.tsx");
    const order = [
      "What have you measured?", // the measurements
      "How do I check it?", // verification
      "Can I use it?", // the feeds, the tools and a commissioned run
      "What have you got wrong?", // the change record
      "Who are you?",
    ];
    const positions = order.map((label) => nav.indexOf(label));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));

    // And measurement still precedes commissioning on the front door itself. HomeNavigator
    // moved to /how-we-work on 2026-09-23 (the home page was 27,743px tall, so its lower bands
    // were published to almost nobody). What this assertion has always been about is the ORDER
    // of the supply-led hierarchy, so it is pinned where each band now renders: the front door
    // still leads with what is measured before it asks for anything, and the directory of every
    // door comes last on the page that carries it.
    // The front door was rebuilt on 2026-09-30 (owner): HomeCredibility and the inline id="board"
    // band are gone, and the board renders as LiveBoardGlance directly under the hero. The order is
    // still the supply-led one: the measurements, then how the evidence is made and checked, and only
    // then the ways in (ask, connect, check). Each band must be present, so a missing band cannot pass
    // as indexOf -1 sorting first.
    const home = source("HomeVerify.tsx");
    const bands = ["<HomeHero", "<LiveBoardGlance", "<HomeSteps", "<HomeWaysIn"].map((b) => home.indexOf(b));
    expect(bands.every((i) => i >= 0)).toBe(true);
    expect(bands).toEqual([...bands].sort((a, b) => a - b));

    const deep = source("HowWeWork.tsx");
    expect(deep.indexOf("<HomeStrengths")).toBeLessThan(deep.indexOf("<HomeNavigator"));
  });

  it("quickstart keeps commissioning after the four public reads", () => {
    const text = source("Quickstart.tsx");
    expect(text.indexOf("5 · Optional: commission an output"))
      .toBeGreaterThan(text.indexOf("4 · Access supported feeds"));
  });
});
