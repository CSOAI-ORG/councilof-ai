// evidence-notes-current-cards.mjs: the land workflows' mechanical citation refresh (A-G2).
// The fixtures are planted; the last test runs the producer's --check over the committed notes.
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ERRATA_MARK, currentCardFor, refreshAll, refreshNote, splitErrata } from "./evidence-notes-current-cards.mjs";
import { copyRuleViolations, stalenessViolations } from "../client/src/data/evidence-notes.ts";

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

  it("the stale note fails the staleness rule before and passes after; the prose gains one update sentence", () => {
    const before = note();
    expect(stalenessViolations(before, chain, [])).toHaveLength(1);
    const { note: after, changes, unresolved } = refreshNote(before, chain, []);
    expect(unresolved).toEqual([]);
    expect(changes.length).toBeGreaterThan(0);
    const [text, errata] = splitErrata(after.body);
    expect(text).toBe(before.body); // the prose above the sentence is untouched
    expect(errata).toBe(
      `${ERRATA_MARK} signed-safety-aaaaaaaaaaaa.json, cited above, is superseded by ${url("signed-safety-cccccccccccc.json")}. ` +
        "The text above describes the cited cards as they stood before that; the current card states its own n and status.",
    );
    expect(errata).not.toMatch(/\b0\.\d/); // quotes no number
    expect(after.artifacts).toEqual([{ label: "Current card (replaces signed-safety-aaaaaaaaaaaa.json)", url: url("signed-safety-cccccccccccc.json") }]);
    expect(stalenessViolations(after, chain, [])).toEqual([]);
    expect(before.artifacts[0].url).toBe(url("signed-safety-aaaaaaaaaaaa.json")); // input not mutated
  });

  it("verifier case: prose calling a card current is corrected in the text, and its receipt link follows the card", () => {
    // honest-unmeasured-n12 before #2802: the body said the model "has a current signed, admitted
    // card" (the old card's URL), and the artifacts held the old card and the old card's receipt.
    const receipts = { "signed-safety-aaaaaaaaaaaa.json": "admission-111111111111.json", "signed-safety-cccccccccccc.json": "admission-333333333333.json" };
    const before = note({
      body: `org/m has a current signed, admitted card on the safety axis (${url("signed-safety-aaaaaaaaaaaa.json")}). It is UNMEASURED.`,
      artifacts: [
        { label: "org/m safety card", url: url("signed-safety-aaaaaaaaaaaa.json") },
        { label: "Hub cards index", url: "https://councilof.ai/interop/hub-cards-index.json" },
        { label: "Admission receipt", url: "https://councilof.ai/interop/mill-evidence/admission-111111111111.json" },
      ],
    });
    const { note: after, unresolved } = refreshNote(before, chain, [], (f) => receipts[f] ?? null);
    expect(unresolved).toEqual([]);
    expect(after.body).toContain(`signed-safety-aaaaaaaaaaaa.json, cited above, is superseded by ${url("signed-safety-cccccccccccc.json")}`);
    expect(after.artifacts.map((a) => a.url)).toEqual([
      url("signed-safety-cccccccccccc.json"),
      "https://councilof.ai/interop/hub-cards-index.json",
      "https://councilof.ai/interop/mill-evidence/admission-333333333333.json",
    ]);
    expect(after.artifacts[2].label).toBe("Current card's admission receipt (replaces admission-111111111111.json)");
    expect(stalenessViolations(after, chain, [])).toEqual([]);
  });

  it("the update sentence is rebuilt, not stacked, when the chain grows, and dropped once the prose names the current card", () => {
    const short = [chain[0]];
    const once = refreshNote(note(), short, []).note;
    expect(once.body).toContain(url("signed-safety-bbbbbbbbbbbb.json"));
    const twice = refreshNote(once, chain, []).note;
    expect(twice.body.split(ERRATA_MARK)).toHaveLength(2);
    expect(twice.body).toContain(url("signed-safety-cccccccccccc.json"));
    expect(twice.body).not.toContain(url("signed-safety-bbbbbbbbbbbb.json"));
    expect(refreshNote(twice, chain, []).changes).toEqual([]); // idempotent
    const rewritten = { ...twice, body: `${splitErrata(twice.body)[0]} The current card is ${url("signed-safety-cccccccccccc.json")}.` };
    const { note: clean } = refreshNote({ ...rewritten, body: `${rewritten.body} ${splitErrata(twice.body)[1]}` }, chain, []);
    expect(clean.body).toBe(rewritten.body);
  });

  it("leaves a note alone where a person already links the current card beside the old one", () => {
    // care-read-n-before-accuracy on master: the body quotes the superseded card, and a person put
    // the current card in the artifacts with a label that says so.
    const handled = note({
      artifacts: [{ label: "current re-run (the body quotes the superseded card)", url: url("signed-safety-cccccccccccc.json") }],
    });
    expect(stalenessViolations(handled, chain, [])).toEqual([]);
    expect(refreshNote(handled, chain, [])).toEqual({ note: handled, changes: [], unresolved: [] });
  });

  it("groups several superseded cards under the card that replaces them all", () => {
    const both = note({ body: `old ${url("signed-safety-aaaaaaaaaaaa.json")} and newer ${url("signed-safety-bbbbbbbbbbbb.json")}.` });
    const { note: after } = refreshNote(both, chain, []);
    expect(after.body).toContain(
      `signed-safety-aaaaaaaaaaaa.json and signed-safety-bbbbbbbbbbbb.json, cited above, are superseded by ${url("signed-safety-cccccccccccc.json")}`,
    );
  });

  it("a note the sentence would push past 250 words is reported for a human, not rewritten", () => {
    const long = note({ body: `${"word ".repeat(240)}(${url("signed-safety-aaaaaaaaaaaa.json")}).` });
    const { note: after, unresolved } = refreshNote(long, chain, []);
    expect(unresolved).toEqual([expect.stringContaining("250 words")]);
    expect(after.body).toBe(long.body);
  });

  it("keeps the copy rules on a real note it rewrites", () => {
    const real = {
      id: "r", date: "2026-09-14", title: "An honest UNMEASURED at n=12",
      summary: "A signed, admitted safety card says UNMEASURED because 12 graded items are fewer than 30.",
      body: `${"Plain words that describe the card. ".repeat(24)}See (${url("signed-safety-aaaaaaaaaaaa.json")}).`,
      artifacts: [{ label: "card", url: url("signed-safety-aaaaaaaaaaaa.json") }],
      social: "x",
    };
    expect(copyRuleViolations(real)).toEqual([]);
    expect(copyRuleViolations(refreshNote(real, chain, []).note)).toEqual([]);
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
