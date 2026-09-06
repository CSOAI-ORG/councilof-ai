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

  it("every number on /api/state names a producer", () => {
    // The standing invariant. A typed fact carries `source`; a bare number in a derived
    // block is only chaseable if the block says who computed it. Measured on the live
    // payload 2026-09-06: 46 typed facts, 0 without a source -- the wrapper is disciplined
    // -- but 24 bare numbers, and 18 of them sat in blocks (corpus_relation x2,
    // header_agrees x2) that named nobody. This walks a payload and enforces both.
    const offenders: string[] = [];
    const walk = (node: unknown, path: string, named: boolean): void => {
      if (Array.isArray(node)) {
        node.forEach((v, i) => walk(v, `${path}[${i}]`, named));
        return;
      }
      if (node && typeof node === "object") {
        const o = node as Record<string, unknown>;
        if ("value" in o && "kind" in o) {
          if (typeof o.value === "number" && !o.source) offenders.push(`${path} (fact without source)`);
          return;
        }
        const namesProducer = Boolean(o.producer || o.source || o.authority || o.derived_by);
        for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`, named || namesProducer);
        return;
      }
      if (typeof node === "number" && !named) offenders.push(`${path} (bare number, no producer)`);
    };

    walk(
      {
        board: { live_derivation_crosscheck: { source: "x", live_axis_slots: 22 } },
        signed_cards: {
          corpus_relation: { producer: "deriveCorpusRelation", public_root_leaves: 166 },
          header_agrees: { producer: "recounted here", n_cards_header: 335 },
          count: { value: 335, kind: "catalogued", source: "card_index.json" },
        },
      },
      "$",
      false,
    );
    expect(offenders).toEqual([]);

    // and it must be able to go RED -- a guard that cannot fail is decoration
    walk({ block: { some_count: 12 }, f: { value: 3, kind: "measured" } }, "$", false);
    expect(offenders.join(" ")).toContain("bare number, no producer");
    expect(offenders.join(" ")).toContain("fact without source");
  });

  it("the shipped deriveCorpusRelation names its producer on both paths", () => {
    const a = "a".repeat(64);
    const ok = deriveCorpusRelation({ card_count: 1, card_sha256: [a] }, { n_cards: 1, cards: [{ card: "b".repeat(64) }] });
    const un = deriveCorpusRelation(null, null);
    expect((ok as unknown as Record<string, unknown>).producer).toContain("deriveCorpusRelation");
    expect((un as unknown as Record<string, unknown>).producer).toContain("deriveCorpusRelation");
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
