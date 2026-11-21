import { describe, expect, it } from "vitest";
import { thirdPartyExampleCells } from "./publishedExamplePick";

const hex = (c: string) => c.repeat(64);
const url = (c: string) => `/signed/cards/${hex(c)}.json`;

const matrix = {
  models: [
    { id: "sov-compliance-art5:latest", kind: "own" },
    { id: "clan-law-refusing:latest", kind: "own" },
    { id: "council-x:latest", kind: "own_unconfirmed" },
    { id: "llama3.2:3b", kind: "third_party" },
    { id: "qwen3:0.6b", kind: "third_party" },
  ],
  cells: [
    { model: "sov-compliance-art5:latest", card: hex("a"), card_url: url("a"), signed: true, accuracy: 0.0417 },
    { model: "clan-law-refusing:latest", card: hex("b"), card_url: url("b"), signed: true, accuracy: 0.5 },
    { model: "council-x:latest", card: hex("c"), card_url: url("c"), signed: true, accuracy: 0.9 },
    { model: "llama3.2:3b", card: hex("d"), card_url: url("d"), signed: true, accuracy: 0.77 },
    { model: "qwen3:0.6b", card: hex("e"), card_url: url("e"), signed: true, accuracy: 0 },
    { model: "llama3.2:3b", card: hex("f"), card_url: url("f"), signed: false, accuracy: 0.8 },
    { model: "llama3.2:3b", card: hex("1"), card_url: "/interop/elsewhere.json", signed: true, accuracy: 0.8 },
  ],
};

describe("the verifier's published example comes from a third-party model", () => {
  it("never offers our own models, confirmed or not", () => {
    const models = thirdPartyExampleCells(matrix).map((c) => c.model);
    expect(models).not.toContain("sov-compliance-art5:latest");
    expect(models).not.toContain("clan-law-refusing:latest");
    expect(models).not.toContain("council-x:latest");
  });

  it("keeps only signed cards at a /signed/cards/<sha256>.json path, the loader's own rule", () => {
    expect(thirdPartyExampleCells(matrix)).toEqual([{ id: hex("d"), url: url("d"), model: "llama3.2:3b" }]);
  });

  it("prefers a non-zero cell, and falls back to a zero one rather than to nothing", () => {
    const zerosOnly = { models: matrix.models, cells: [matrix.cells[4]] };
    expect(thirdPartyExampleCells(zerosOnly).map((c) => c.model)).toEqual(["qwen3:0.6b"]);
  });

  it("returns nothing for a missing or malformed matrix, so the page falls back to the chain", () => {
    for (const bad of [null, undefined, "x", {}, { models: [], cells: {} }, { models: {}, cells: [] }]) {
      expect(thirdPartyExampleCells(bad)).toEqual([]);
    }
  });
});
