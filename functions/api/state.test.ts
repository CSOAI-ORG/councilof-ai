import { describe, expect, it } from "vitest";

import publicRoot from "../../public/root.json";
import cardIndex from "../../public/signed/card_index.json";
import { deriveCorpusRelation, onRequestGet } from "./state";

describe("GET /api/state corpus truth", () => {
  it("derives and separates public-root leaves from signed-card index entries", async () => {
    const response = await (onRequestGet as unknown as () => Promise<Response>)();
    const body = await response.json();
    const expected = deriveCorpusRelation(publicRoot, cardIndex);
    expect(body.public_root.corpus_relation).toEqual(expected);
    expect(body.signed_cards.corpus_relation).toMatchObject(expected);
    expect(body.signed_cards.corpus_relation.ots_scope_note).toContain("does not anchor");
    expect(body.public_root.signature_state).toMatchObject({
      value: "SIGNED_ENVELOPE_PRESENT",
      source: "public/root.json → sig_ed25519",
    });
    expect(body.public_root.caveat).toContain("root envelope signature");
    expect(body.public_root.caveat).not.toContain("NO_LAPTOP_SIGN");
  });

  it("fails corpus separation closed for overlap, duplicates, malformed ids, and count drift", () => {
    const a = "a".repeat(64);
    const b = "b".repeat(64);
    const validIndex = { n_cards: 1, cards: [{ card: b }] };
    expect(deriveCorpusRelation({ card_count: 1, card_sha256: [a] }, validIndex).relationship).toBe("SEPARATE_CORPORA");
    expect(deriveCorpusRelation({ card_count: 1, card_sha256: [b] }, validIndex).relationship).toBe("UNCHECKABLE");
    expect(deriveCorpusRelation({ card_count: 2, card_sha256: [a, a] }, validIndex)).toMatchObject({
      relationship: "UNCHECKABLE",
      duplicate_public_root_ids: 1,
    });
    expect(deriveCorpusRelation({ card_count: 2, card_sha256: [a] }, validIndex).relationship).toBe("UNCHECKABLE");
    expect(deriveCorpusRelation({ card_count: 1, card_sha256: ["not-a-digest"] }, validIndex).relationship).toBe("UNCHECKABLE");
    expect(deriveCorpusRelation(null, null)).toMatchObject({
      relationship: "UNCHECKABLE",
      public_root_leaves: null,
      separately_indexed_signed_cards: null,
    });
  });
});
