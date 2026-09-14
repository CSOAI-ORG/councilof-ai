// Evidence notes on /press and /notes — the shape and honesty rules each note must keep.
//
// The notes are written by hand from live bytes, so the failure this guards against is drift in the
// copy itself: a superlative slipping in, an accuracy quoted with no signed card beside it, a note
// with no artifact a stranger can fetch, or a social line that no longer fits. Network checks
// (every URL fetches, every quoted number equals its card) run outside CI, where rate budgets allow.
//
// The rules themselves live in ./evidence-notes.ts (copyRuleViolations) so the /notes pages test
// applies the same definition rather than a copy of it.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import data from "./evidence-notes.json";
import { copyRuleViolations, type CopyRule } from "./evidence-notes";

const press = readFileSync(resolve(__dirname, "../pages/PublicPress.tsx"), "utf8");
const only = (note: (typeof data.notes)[number], rule: CopyRule) =>
  copyRuleViolations(note).filter((v) => v.rule === rule);

describe("evidence notes", () => {
  it("are rendered by the press page from this one data file", () => {
    expect(press).toContain('import evidenceNotes from "@/data/evidence-notes.json";');
    expect(press).toContain("evidenceNotes.notes.map");
  });

  it("have unique ids, a date, and a publisher", () => {
    expect(data.notes.length).toBeGreaterThan(0);
    expect(new Set(data.notes.map((n) => n.id)).size).toBe(data.notes.length);
    expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.publisher).toContain("16939677");
  });

  it("the rule set can fail (a planted violation is caught by every rule)", () => {
    const bad = {
      ...data.notes[0],
      title: "The best result",
      body: "short body 0.5865 with no card",
      artifacts: [{ label: "x", url: "http://example.com/x" }],
    };
    const rules = new Set(copyRuleViolations(bad).map((v) => v.rule));
    for (const r of ["shape", "hosts", "words", "accuracy"] as const) expect(rules.has(r)).toBe(true);
  });

  for (const note of data.notes) {
    describe(note.id, () => {
      it("keeps a short body, a fitting social line, and 1-3 artifacts", () => {
        expect(only(note, "shape")).toEqual([]);
      });

      it("points only at https artifacts on estate or public-record hosts", () => {
        expect(only(note, "hosts")).toEqual([]);
      });

      it("carries no ruled-out words and no typed prices", () => {
        expect(only(note, "words")).toEqual([]);
      });

      it("quotes an accuracy only with its signed card URL beside it", () => {
        expect(only(note, "accuracy")).toEqual([]);
      });
    });
  }
});
