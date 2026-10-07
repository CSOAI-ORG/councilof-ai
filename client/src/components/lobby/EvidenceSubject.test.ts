/**
 * The Evidence pack pane answers for the model the reader named, or says plainly that we hold
 * nothing for it. Re-test 7 Oct 2026: it returned a board index whose rows named other people's
 * models (each axis's leader) under the reader's model name.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { answerForSubject, normaliseModelId, readModelsFile, type MeasuredModel } from "./EvidenceSubject";
import { composeEvidenceIndex } from "./evidenceIndex";

const here = dirname(fileURLToPath(import.meta.url));
const live = readModelsFile(JSON.parse(readFileSync(resolve(here, "../../../../public/interop/models-measured.json"), "utf8")));

const m = (id: string, over: Partial<MeasuredModel> = {}): MeasuredModel => ({
  id,
  name_published: true,
  kind: "third_party",
  cards: 4,
  axes: 3,
  sources: ["mill-cards-signed"],
  admission_receipt: false,
  first_signed_card: null,
  recorded_as: [id],
  ...over,
});

const FIXTURE = readModelsFile({
  schema: "csoai.models-measured/0.1",
  models: [
    m("qwen3:8b", { recorded_as: ["ollama:qwen3:8b@sha256:500a1f067a9f"] , cards: 13, axes: 13 }),
    m("Qwen/Qwen3-8B", { cards: 11, axes: 11 }),
    m("mistral:7b", { cards: 9, axes: 8, first_signed_card: "ab".repeat(32), sources: ["signed-card-index"] }),
    m("clan-law-plain", { kind: "own", cards: 8, axes: 8, recorded_as: ["clan-law-plain:latest"] }),
    m("withheld-name-1", { kind: "own", name_published: false, recorded_as: [] }),
    m("gemma3:12b", { cards: 20, axes: 14 }),
  ],
});

describe("normaliseModelId — the file's own identity rule, nothing more", () => {
  it("drops only the runtime wrapper", () => {
    expect(normaliseModelId(" ollama:qwen3:8b@sha256:500a1f ")).toBe("qwen3:8b");
    expect(normaliseModelId("clan-law-plain:latest")).toBe("clan-law-plain");
    expect(normaliseModelId("Qwen/Qwen3-8B")).toBe("qwen/qwen3-8b");
  });
});

describe("answerForSubject — about the subject named, never another model's evidence", () => {
  it("answers qwen3:8b from the published file, with that record's own numbers", () => {
    const card = answerForSubject("qwen3:8b", live)!;
    const rec = live.models.find((x) => x.id === "qwen3:8b")!;
    expect(rec).toBeDefined();
    expect(card.state).toBe("found");
    expect(card.subject).toBe("qwen3:8b");
    expect(card.numbers.map((n) => n.value)).toEqual([rec.cards, rec.axes]);
    expect(card.sentence).toContain("qwen3:8b");
    // Not a word about any other model: the defect was other people's models under this name.
    for (const other of live.models.filter((x) => x.id !== "qwen3:8b" && x.name_published).map((x) => x.id)) {
      if (!"qwen3:8b".includes(other)) expect(card.sentence.includes(other), other).toBe(false);
    }
    expect((card.details as { matched: string }).matched).toBe("qwen3:8b");
    expect(card.button.href).toMatch(/^\//);
  });

  it("an unknown model gets a plain 'no evidence yet', never a zero score and never a substitute", () => {
    const card = answerForSubject("acme-frontier-9000", live)!;
    expect(card.state).toBe("none");
    expect(card.subject).toBeNull();
    expect(card.chip).toBe("No evidence yet");
    expect(card.sentence).toMatch(/hold no signed measurement for “acme-frontier-9000” yet/);
    expect(card.sentence).toMatch(/not a score or a verdict/);
    expect(card.button.href).toBe("/dashboard?tab=measured");
    expect(card.pick).toEqual([]);
  });

  it("an exact match after the wrapper is removed answers directly", () => {
    expect(answerForSubject("ollama:qwen3:8b@sha256:500a1f067a9f", FIXTURE)!.subject).toBe("qwen3:8b");
    expect(answerForSubject("QWEN3:8B", FIXTURE)!.subject).toBe("qwen3:8b");
  });

  it("a spelling that fits two different builds is never resolved for the reader", () => {
    const card = answerForSubject("qwen3-8b", FIXTURE)!;
    expect(card.state).toBe("ambiguous");
    expect(card.subject).toBeNull();
    expect(card.pick.sort()).toEqual(["Qwen/Qwen3-8B", "qwen3:8b"].sort());
    expect(card.numbers).toEqual([]);
  });

  it("a spelling that fits exactly one model answers and says which id it matched", () => {
    const card = answerForSubject("Gemma3 12B", FIXTURE)!;
    expect(card.state).toBe("found");
    expect(card.subject).toBe("gemma3:12b");
    expect(card.sentence).toMatch(/your spelling matched gemma3:12b/);
  });

  it("near misses are offered to pick from, not answered", () => {
    const card = answerForSubject("gemma3", FIXTURE)!;
    expect(card.state).toBe("none");
    expect(card.pick).toContain("gemma3:12b");
  });

  it("a withheld name is never matched, suggested or shown", () => {
    const card = answerForSubject("withheld-name-1", FIXTURE)!;
    expect(card.state).toBe("none");
    expect(JSON.stringify(card)).not.toMatch(/"matched":"withheld/);
    expect(answerForSubject("withheld", FIXTURE)!.pick).toEqual([]);
  });

  it("our own model is answered as ours and never presented as a comparable result", () => {
    const card = answerForSubject("clan-law-plain:latest", FIXTURE)!;
    expect(card.state).toBe("found");
    expect(card.chip).toBe("Our own model");
    expect(card.tone).toBe("own");
    expect(card.sentence).toMatch(/never counted or ranked against anyone else's model/);
  });

  it("a model with a signed card in the index links straight to checking that card", () => {
    const card = answerForSubject("mistral:7b", FIXTURE)!;
    expect(card.button.href).toBe(`/gspc-verify/?card=${encodeURIComponent(`/signed/cards/${"ab".repeat(32)}.json`)}`);
  });

  it("an empty question has no answer card", () => {
    expect(answerForSubject("   ", FIXTURE)).toBeNull();
  });

  it("the card is plain: no protocol words in the chip or the sentence", () => {
    for (const q of ["qwen3:8b", "acme-frontier-9000", "clan-law-plain"]) {
      const card = answerForSubject(q, q === "qwen3:8b" ? live : FIXTURE)!;
      expect(`${card.chip} ${card.sentence}`).not.toMatch(/x402|MCP|A2UI|Merkle|JSON|sha256|Ed25519/i);
      expect(card.button.label).not.toMatch(/x402|MCP|A2UI|Merkle/i);
    }
  });
});

describe("the board-wide index no longer wears a model's name", () => {
  it("says it describes the board, and that row leaders are usually other models", () => {
    const board = { axes: [], inLane: [], publicCount: "", measuredOn: "", issuer: "", doi: "", license: "", limitations: [] };
    const idx = composeEvidenceIndex({ board, included: [], system: "", provider: "", now: "T" }) as {
      what_this_is: string;
      subject: { system: string };
    };
    expect(idx.what_this_is).toMatch(/for the board as a whole/);
    expect(idx.what_this_is).toMatch(/usually another provider's model/);
    expect(idx.subject.system).toMatch(/describes the board, not one system/);
  });
});
