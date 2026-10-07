// evidence-notes-current-cards.mjs: the land workflows' mechanical citation refresh (A-G2).
// The fixtures are planted; the last test runs the producer's --check over the committed notes.
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { currentCardFor, refreshAll, refreshNote } from "./evidence-notes-current-cards.mjs";
import { stalenessViolations } from "../client/src/data/evidence-notes.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const url = (f) => `https://councilof.ai/interop/mill-cards-signed/${f}`;
const note = (over = {}) => ({
  id: "n1",
  date: "2026-09-14",
  title: "t",
  summary: "s",
  body: `reads 0.5 at n=30 (${url("signed-safety-aaaaaaaaaaaa.json")}).`,
  artifacts: [{ label: "card", url: url("signed-safety-aaaaaaaaaaaa.json") }],
  social: "x",
  ...over,
});
const chain = [
  { superseded_file: "signed-safety-aaaaaaaaaaaa.json", by_file: "signed-safety-bbbbbbbbbbbb.json" },
  { superseded_file: "signed-safety-bbbbbbbbbbbb.json", by_file: "signed-safety-cccccccccccc.json" },
];

describe("evidence-notes-current-cards", () => {
  it("follows the supersession chain to its end", () => {
    expect(currentCardFor("signed-safety-aaaaaaaaaaaa.json", chain)).toBe("signed-safety-cccccccccccc.json");
    expect(currentCardFor("signed-x.json", chain)).toBe("signed-x.json");
  });

  it("the stale note fails the staleness rule before, and passes after, without touching the prose", () => {
    const before = note();
    expect(stalenessViolations(before, chain, [])).toHaveLength(1);
    const { note: after, changes, unresolved } = refreshNote(before, chain, []);
    expect(unresolved).toEqual([]);
    expect(changes).toHaveLength(1);
    expect(after.artifacts).toHaveLength(2);
    expect(after.artifacts[1].url).toBe(url("signed-safety-cccccccccccc.json"));
    expect(after.body).toBe(before.body);
    expect(stalenessViolations(after, chain, [])).toEqual([]);
    expect(before.artifacts).toHaveLength(1); // input not mutated
  });

  it("keeps the 1-3 artifact rule: a full note re-points the old card's own link when the prose still cites it", () => {
    const full = note({
      artifacts: [
        { label: "card", url: url("signed-safety-aaaaaaaaaaaa.json") },
        { label: "board", url: "https://councilof.ai/api/gspc" },
        { label: "index", url: "https://councilof.ai/interop/hub-cards-index.json" },
      ],
    });
    const { note: after, unresolved } = refreshNote(full, chain, []);
    expect(unresolved).toEqual([]);
    expect(after.artifacts).toHaveLength(3);
    expect(after.artifacts[0].url).toBe(url("signed-safety-cccccccccccc.json"));
    expect(stalenessViolations(after, chain, [])).toEqual([]);
  });

  it("a full note whose prose does not name the old card gives up its last non-card artifact instead", () => {
    const full = note({
      body: "no card URL in the prose",
      artifacts: [
        { label: "card", url: url("signed-safety-aaaaaaaaaaaa.json") },
        { label: "board", url: "https://councilof.ai/api/gspc" },
        { label: "index", url: "https://councilof.ai/interop/hub-cards-index.json" },
      ],
    });
    const { note: after } = refreshNote(full, chain, []);
    expect(after.artifacts.map((a) => a.url)).toEqual([
      url("signed-safety-aaaaaaaaaaaa.json"),
      "https://councilof.ai/api/gspc",
      url("signed-safety-cccccccccccc.json"),
    ]);
    expect(stalenessViolations(after, chain, [])).toEqual([]);
  });

  it("three mill-card artifacts and no free slot is reported, not guessed", () => {
    const full = note({
      body: "no card URL in the prose",
      artifacts: [
        { label: "a", url: url("signed-safety-aaaaaaaaaaaa.json") },
        { label: "d", url: url("signed-safety-dddddddddddd.json") },
        { label: "e", url: url("signed-safety-eeeeeeeeeeee.json") },
      ],
    });
    const { unresolved } = refreshNote(full, chain, []);
    expect(unresolved).toHaveLength(1);
  });

  it("a withdrawn current card gets its correction id on the citing artifact's label", () => {
    const withdrawn = [{ withdrawn_file: "signed-safety-aaaaaaaaaaaa.json", correction: "C-TEST-01" }];
    const before = note();
    expect(stalenessViolations(before, [], withdrawn)).toHaveLength(1);
    const { note: after } = refreshNote(before, [], withdrawn);
    expect(after.artifacts[0].label).toContain("C-TEST-01");
    expect(stalenessViolations(after, [], withdrawn)).toEqual([]);
  });

  it("refreshAll is a no-op on notes that already cite current cards", () => {
    const doc = { notes: [note({ body: "nothing", artifacts: [{ label: "b", url: "https://councilof.ai/api/gspc" }] })] };
    expect(refreshAll(doc, chain, []).changes).toEqual([]);
  });

  it("the committed notes need no rewrite against the committed ledgers", () => {
    const out = execFileSync("node", [join(HERE, "evidence-notes-current-cards.mjs"), "--check"], { encoding: "utf8" });
    expect(out).toMatch(/cite current cards/);
  });
});
