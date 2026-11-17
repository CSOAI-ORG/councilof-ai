/**
 * The staff pane must stay readable on the light Council OS shell.
 *
 * MEASURED 2026-11-17 (owner report: "this page text is showing white, can't read it"): on
 * /dashboard/?tab=staff every line of the pane read at 1.05-1.67:1 contrast, near-white text
 * (text-emerald-50, text-gray-300, text-sky-200, text-emerald-100/60) on the #fafaf7 shell, at
 * desktop and phone widths, in light and dark colour schemes alike. The pane draws no background of
 * its own, so its colours must be the shell's tokens. PalAskPanel and HitlConsole are separate files:
 * each draws its own dark box (bg-[#06110c], bg-slate-950), and their light text sits on that box.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(__dirname, "DashboardStaffPane.tsx"), "utf8");
const classes = [...source.matchAll(/className="([^"]*)"/g)].map((m) => m[1]);

// Text colours that are only legible on a dark background: white, and the 50-300 steps.
const DARK_ONLY_TEXT =
  /(^|\s)text-(?:white|(?:emerald|sky|amber|gray|slate|zinc|neutral|rose|cyan|teal)-(?:50|100|200|300))(?:\/\d+)?(?=\s|$)/;
// A solid dark fill on the element itself, the one place white text is right.
const SOLID_DARK_FILL = /(^|\s)bg-(?:emerald|sky|slate|gray|zinc|neutral)-(?:600|700|800|900|950)(?=\s|$)/;

describe("the staff pane is readable on the light Council OS shell", () => {
  it("takes the shell's foreground on its root, which draws no background", () => {
    expect(classes.length).toBeGreaterThan(5);
    expect(source).toContain('className="mx-auto max-w-5xl px-4 py-8 text-foreground"');
  });

  it("uses no text colour made for a dark page, except on a solid dark fill", () => {
    for (const c of classes) {
      if (SOLID_DARK_FILL.test(c)) continue;
      expect(c, c).not.toMatch(DARK_ONLY_TEXT);
    }
  });

  it("each Ask button sets its own white text on its own emerald fill", () => {
    const buttons = classes.filter((c) => c.includes("mt-auto rounded-lg"));
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) {
      expect(b).toMatch(/(^|\s)bg-emerald-700(\s|$)/);
      expect(b).toMatch(/(^|\s)text-white(\s|$)/);
    }
  });
});
