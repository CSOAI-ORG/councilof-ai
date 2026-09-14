// Evidence notes on /press — the shape and honesty rules each note must keep.
//
// The notes are written by hand from live bytes, so the failure this guards against is drift in the
// copy itself: a superlative slipping in, an accuracy quoted with no signed card beside it, a note
// with no artifact a stranger can fetch, or a social line that no longer fits. Network checks
// (every URL fetches, every quoted number equals its card) run outside CI, where rate budgets allow.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import data from "./evidence-notes.json";

const press = readFileSync(resolve(__dirname, "../pages/PublicPress.tsx"), "utf8");

// Words the owner ruled out of public copy. "aggregate-only" is the name of a retired card class,
// not a superlative, so it is neutralised before matching.
const BANNED = /\b(certified|compliant|safe|endorsed|best|worst|first|only|leading|series a|customers?|partners?)\b/i;
const ALLOWED_HOSTS = new Set(["councilof.ai", "csoai.org", "github.com", "huggingface.co"]);

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

  for (const note of data.notes) {
    describe(note.id, () => {
      it("keeps a short body, a fitting social line, and 1-3 artifacts", () => {
        const words = note.body.split(/\s+/).filter(Boolean).length;
        expect(words).toBeGreaterThanOrEqual(120);
        expect(words).toBeLessThanOrEqual(250);
        expect(note.social.length).toBeLessThanOrEqual(280);
        expect(note.artifacts.length).toBeGreaterThanOrEqual(1);
        expect(note.artifacts.length).toBeLessThanOrEqual(3);
      });

      it("points only at https artifacts on estate or public-record hosts", () => {
        for (const artifact of note.artifacts) {
          const url = new URL(artifact.url);
          expect(url.protocol).toBe("https:");
          expect(ALLOWED_HOSTS.has(url.hostname)).toBe(true);
          if (url.hostname === "github.com") expect(url.pathname.startsWith("/CSOAI-ORG/")).toBe(true);
          if (url.hostname === "huggingface.co") expect(url.pathname.startsWith("/datasets/csoai/")).toBe(true);
        }
      });

      it("carries no ruled-out words and no typed prices", () => {
        for (const text of [note.title, note.summary, note.body, note.social]) {
          expect(text.replace(/aggregate-only/gi, "aggregate_only")).not.toMatch(BANNED);
          expect(text).not.toMatch(/[$£€]/);
        }
      });

      it("quotes an accuracy only with its signed card URL beside it", () => {
        for (const match of note.body.matchAll(/\b0\.\d{2,4}\b/g)) {
          const end = (match.index ?? 0) + match[0].length;
          const after = note.body.slice(end, end + 60);
          expect(after).toContain("(https://councilof.ai/interop/mill-cards-signed/");
        }
      });
    });
  }
});
