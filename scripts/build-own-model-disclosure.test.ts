// Pins /independence/'s own-model count to its producer and its producer to the board's rule.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
// @ts-expect-error: plain ESM script, no type declarations
import { derive, isR1, isR2, UNCONFIRMED_TAGS } from "./build-own-model-disclosure.mjs";

const ROOT = join(__dirname, "..");
const read = (p: string) => readFileSync(join(ROOT, p));

describe("own-model disclosure (/independence/)", () => {
  it("the committed JSON is exactly what the producer derives from the signed card index", () => {
    const fresh = derive(read("public/signed/card_index.json"), (url: string) =>
      JSON.parse(readFileSync(join(ROOT, "public", url.replace(/^\/+/, "")), "utf8")),
    );
    const committed = JSON.parse(read("public/independence/own-model-disclosure.json").toString("utf8"));
    expect(committed).toEqual(fresh);
  });

  it("every card lands in exactly one bucket, and the buckets add up to the index", () => {
    const d = JSON.parse(read("public/independence/own-model-disclosure.json").toString("utf8"));
    expect(d.header_agrees).toBe(true);
    expect(d.own_model_cards + d.unconfirmed.cards + d.no_rule_matched.cards).toBe(d.n_cards);
    expect(d.own_model_cards).toBe(d.rules[0].cards + d.rules[1].cards);
  });

  it("R2 is the board's isOwnCouncilModel test, character for character", () => {
    const src = read("functions/api/gspc.ts").toString("utf8");
    expect(src).toContain("/^council\\b/i.test(name.trim()) || /\\(council specialist\\)/i.test(name)");
    for (const [m, want] of [
      ["council-oowm:latest", true],
      ["council-embodiment-v3-light (council specialist)", true],
      ["councillor:7b", false],
      ["llama3.2:3b", false],
    ] as const) expect(isR2(m)).toBe(want);
  });

  it("R1 matches the two prefixes only", () => {
    expect(isR1("clan-law-plain:latest")).toBe(true);
    expect(isR1("sov6-logic-v3-light:latest")).toBe(true);
    expect(isR1("qwen2.5:7b")).toBe(false);
    expect(UNCONFIRMED_TAGS.some((t: string) => isR1(t) || isR2(t))).toBe(false);
  });
});
