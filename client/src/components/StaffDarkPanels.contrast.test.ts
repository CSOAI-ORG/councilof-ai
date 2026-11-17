/**
 * The two dark panels on the staff tab keep their button text readable.
 *
 * MEASURED 2026-11-17 on /dashboard/?tab=staff, live, after #4421: HitlConsole (bg-slate-950, text-amber-50)
 * and PalAskPanel (bg-[#06110c], text-emerald-50) put their light text on 600-step button fills.
 * "Check my answer against the record" (sky-600) read 3.88:1, "APPROVED" (emerald-600) 3.52:1 and
 * "HOLD" (amber-600) 3.09:1, and with the ask dialog open its send button "Ask" (emerald-600) 3.47:1.
 * Normal-size text needs 4.5:1. With the 700 step previewed on the live page, none of 149 text elements
 * read under 4.5:1; the lowest read 4.76:1.
 * Translucent tints (bg-sky-500/10 and the like) sit on the dark box and are not fills, so they stay.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(__dirname, file), "utf8");
// A solid fill (no /alpha) from the 300-600 steps: too light under the panels' light text.
const MID_FILL =
  /(^|[\s"'`{])(?:hover:)?bg-(?:sky|emerald|amber|rose|teal|cyan|green|blue|red|orange|yellow|lime)-(?:300|400|500|600)(?=[\s"'`}]|$)/;

describe("the staff tab's dark panels keep button text readable", () => {
  for (const file of ["HitlConsole.tsx", "PalAskPanel.tsx"]) {
    it(`${file} puts no solid 300-600 fill under its light text`, () => {
      const hits = read(file)
        .split("\n")
        .map((line, i) => `${file}:${i + 1}: ${line.trim()}`)
        .filter((line) => MID_FILL.test(line.slice(line.indexOf(": ") + 2)));
      expect(hits).toEqual([]);
    });
  }

  it("the Check, APPROVED and HOLD buttons and the ask panel's Send use the 700 step", () => {
    const hitl = read("HitlConsole.tsx");
    expect(hitl).toMatch(/className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold/);
    expect(hitl).toContain('"bg-emerald-700"');
    expect(hitl).toContain('"bg-amber-700"');
    expect(read("PalAskPanel.tsx")).toMatch(/data-testid="pal-ask-send"[^>]*\bbg-emerald-700\b/);
  });
});
