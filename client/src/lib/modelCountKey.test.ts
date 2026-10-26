import { describe, expect, it } from "vitest";
import { boardScope, cardMatrixRow, fleetRow, hubCardsRow, modelsMeasuredRow, ownModelsRow } from "./modelCountKey";

describe("which number do I quote", () => {
  it("a failed read is 'not read', never zero", () => {
    for (const build of [fleetRow, modelsMeasuredRow, cardMatrixRow, hubCardsRow, ownModelsRow]) expect(build(null).value).toBeNull();
  });
  it("never totals a partial Hub read", () => {
    const partial = hubCardsRow({ counts: { complete: false }, cells: [{ model: "a" }, { model: "b" }] });
    expect(partial.value).toBeNull();
    expect(partial.detail).toMatch(/partial read/);
    expect(hubCardsRow({ counts: { complete: true }, cells: [{ model: "a" }, { model: "a" }, { model: "b" }] }).value).toBe(2);
  });
  it("splits the card set when the producer does, and says so when it does not", () => {
    const split = cardMatrixRow({ counts: { models: 64, models_third_party: 13, models_own: 48, models_own_unconfirmed: 3 } });
    expect(split.value).toBe(13);
    expect(split.detail).toMatch(/our own 48 \(\+3 unconfirmed\)/);
    expect(cardMatrixRow({ counts: { models: 64 } }).detail).toMatch(/does not split/);
  });
  it("reads the fleet's compared models and the own-model tags", () => {
    const fleet = { axes: { a: { models: [{ model: "m:7b" }, { model: "n:0.5b" }] }, b: { models: [{ model: "m:7b" }] } } };
    expect(fleetRow(fleet).value).toBe(2);
    expect(ownModelsRow({ rules: [{ model_tags: 40 }, { model_tags: 8 }], unconfirmed: { tags: [1, 2, 3] } }).value).toBe(48);
    expect(modelsMeasuredRow({ headline: { third_party_models: 163, own_models_excluded: 48 } }).detail).toMatch(/our own 48/);
  });
});

describe("board scope line", () => {
  it("derives the size range from published tags, never types it", () => {
    const s = boardScope(["deepseek-r1:8b", "gemma3:12b", "llama3.2:3b", "mistral:7b", "qwen2.5:0.5b-instruct", "qwen2.5:3b"]);
    expect(s.range).toEqual(["0.5b", "12b"]);
    expect(s.namesHosted).toBe(false);
  });
  it("gives no range when any tag does not parse, and drops the hosted clause when one is compared", () => {
    expect(boardScope(["mistral:7b", "some-model"]).range).toBeNull();
    expect(boardScope(["gpt-4o", "mistral:7b"]).namesHosted).toBe(true);
  });
});
