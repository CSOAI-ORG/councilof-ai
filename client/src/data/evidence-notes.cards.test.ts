// Evidence notes against the signed card bytes in this repository — no network.
//
// 1. A note never quotes a superseded card without the card that replaced it, nor a withdrawn card
//    without its correction id (SUPERSEDED.jsonl / WITHDRAWN.jsonl).
// 2. Every accuracy quoted beside a card URL equals that card's signed body.accuracy.
// Both rules are shown failing on planted notes first: a guard never seen failing is decoration.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import data from "./evidence-notes.json";
import {
  currentCardFor,
  quotedAccuracies,
  quotedAccuracyMismatches,
  stalenessViolations,
  type SupersessionRow,
  type WithdrawalRow,
} from "./evidence-notes";

const DIR = resolve(__dirname, "../../../public/interop/mill-cards-signed");
const jsonl = <T>(name: string): T[] =>
  readFileSync(resolve(DIR, name), "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l) as T);
const SUPERSEDED = jsonl<SupersessionRow>("SUPERSEDED.jsonl");
const WITHDRAWN = jsonl<WithdrawalRow>("WITHDRAWN.jsonl");
const accuracyOf = (file: string): number | null | undefined => {
  const p = resolve(DIR, file);
  if (!existsSync(p)) return undefined;
  const card = JSON.parse(readFileSync(p, "utf8")) as { body?: { accuracy?: number | null } };
  return card.body?.accuracy ?? null;
};

describe("evidence notes cite current signed cards", () => {
  const base = data.notes[0];

  it("the staleness rule can fail: a superseded card cited alone is caught, and passes once its replacement is cited", () => {
    const row = SUPERSEDED.find((r) => currentCardFor(r.superseded_file, SUPERSEDED) === r.by_file)!;
    expect(row).toBeTruthy();
    const url = (f: string) => `https://councilof.ai/interop/mill-cards-signed/${f}`;
    const alone = { ...base, body: `cites ${url(row.superseded_file)} only`, artifacts: [{ label: "old", url: url(row.superseded_file) }] };
    expect(stalenessViolations(alone, SUPERSEDED, WITHDRAWN)).toEqual([expect.stringContaining(row.by_file)]);
    const both = { ...alone, artifacts: [...alone.artifacts, { label: "current", url: url(row.by_file) }] };
    expect(stalenessViolations(both, SUPERSEDED, WITHDRAWN)).toEqual([]);
  });

  it("the staleness rule follows a chain to its end and names a withdrawal without its correction", () => {
    const chain: SupersessionRow[] = [
      { superseded_file: "signed-x-a.json", by_file: "signed-x-b.json" },
      { superseded_file: "signed-x-b.json", by_file: "signed-x-c.json" },
    ];
    expect(currentCardFor("signed-x-a.json", chain)).toBe("signed-x-c.json");
    const viaMiddle = { ...base, body: "mill-cards-signed/signed-x-a.json and mill-cards-signed/signed-x-b.json", artifacts: [] };
    expect(stalenessViolations(viaMiddle, chain, [])).toHaveLength(2);
    const withdrawn = { ...base, body: "mill-cards-signed/signed-x-c.json", artifacts: [] };
    expect(stalenessViolations(withdrawn, chain, [{ withdrawn_file: "signed-x-c.json", correction: "C-TEST-01" }])).toEqual([expect.stringContaining("C-TEST-01")]);
  });

  it("the accuracy rule can fail: a number that is not the signed body is caught", () => {
    const row = SUPERSEDED[0];
    const signed = accuracyOf(row.by_file);
    expect(typeof signed).toBe("number");
    const wrong = signed === 0.1234 ? "0.4321" : "0.1234";
    const planted = { ...base, body: `reads ${wrong} at n=30 (https://councilof.ai/interop/mill-cards-signed/${row.by_file}).` };
    expect(quotedAccuracyMismatches(planted, accuracyOf)).toHaveLength(1);
    const honest = { ...planted, body: `reads ${String(signed)} at n=30 (https://councilof.ai/interop/mill-cards-signed/${row.by_file}).` };
    expect(quotedAccuracyMismatches(honest, accuracyOf)).toEqual([]);
  });

  it("the accuracy rule is not vacuous: it pairs quoted accuracies with cards across the real notes", () => {
    const pairs = data.notes.flatMap((n) => quotedAccuracies(n));
    const quotedInBodies = data.notes.flatMap((n) => [...n.body.matchAll(/\b0\.\d{2,4}\b/g)]).length;
    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs.length).toBe(quotedInBodies);
  });

  for (const note of data.notes) {
    describe(note.id, () => {
      it("cites no superseded card without its current replacement, and no withdrawn card without its correction", () => {
        expect(stalenessViolations(note, SUPERSEDED, WITHDRAWN)).toEqual([]);
      });
      it("quotes every accuracy exactly as the cited card's signed body", () => {
        expect(quotedAccuracyMismatches(note, accuracyOf)).toEqual([]);
      });
    });
  }
});
