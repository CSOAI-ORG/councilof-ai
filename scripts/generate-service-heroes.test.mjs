import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = (slug) => readFileSync(join(REPO, "public/images/services", `${slug}.svg`), "utf8");

// Only the 48x48 marks. A naive /<rect/ count also catches the frame and the background,
// which is how an earlier hand-count of this file came out as 17 of 16.
const countMarks = (s) => {
  const rects = [...s.matchAll(/<rect[^>]*width="48"[^>]*height="48"[^>]*>/g)].map((m) => m[0]);
  return { total: rects.length, filled: rects.filter((r) => r.includes("fill=\"#0f766e\"")).length };
};
const title = (s) => s.match(/<title>([\s\S]*?)<\/title>/)[1];

// These assertions read the numbers out of each hero's OWN caption rather than hard-coding them.
// The heroes are volatile on purpose — they plot the live board — so a fixed expectation would
// go red on a data change nobody made. What must never drift is the caption agreeing with the
// picture: a hero that SAYS 13 of 16 and DRAWS something else is worse than no hero.
describe("service heroes: the caption and the picture are the same number", () => {
  it("finance-rwa draws exactly the XRPL signature count it claims", () => {
    const s = svg("finance-rwa");
    const [, signed, total] = title(s).match(/^(\d+) of (\d+) XRPL instruments/);
    expect(countMarks(s)).toEqual({ filled: Number(signed), total: Number(total) });
  });

  it("model-measurement draws one mark per axis and fills the measured ones", () => {
    const s = svg("model-measurement");
    const [, axes] = title(s).match(/^(\d+) axes measured/);
    expect(countMarks(s)).toEqual({ filled: Number(axes), total: Number(axes) });
  });

  it("legacy-systems prints the root leaf count it names in its caption", () => {
    const s = svg("legacy-systems");
    const [, leaves] = title(s).match(/(\d+) leaves under one public root/);
    expect(s).toContain(`>${leaves}</text>`);
  });

  it("every hero is 3:2 and carries its caption as the accessible name", () => {
    for (const slug of ["finance-rwa", "compliance", "model-measurement", "agent-rails", "legacy-systems"]) {
      const s = svg(slug);
      expect(s).toContain('viewBox="0 0 1200 800"');
      expect(title(s)).toEqual(s.match(/aria-label="([^"]*)"/)[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"'));
      expect(title(s).length).toBeGreaterThan(20);
    }
  });

  it("no caption is clipped by the frame", () => {
    // 19px monospace advances 0.6em; the usable width is 1200 - 88 - 88 = 1024px, i.e. 89
    // characters. The producer wraps at 88, so a line longer than that would run off the edge.
    for (const slug of ["finance-rwa", "compliance", "model-measurement", "agent-rails", "legacy-systems"]) {
      for (const [, line] of svg(slug).matchAll(/font-size="19"[^>]*>([^<]*)</g)) {
        expect(line.length).toBeLessThanOrEqual(89);
      }
    }
  });
});
