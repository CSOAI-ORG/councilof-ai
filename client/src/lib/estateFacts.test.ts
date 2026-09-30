import { describe, expect, it } from "vitest";
import chainFacts from "../data/chain-facts.json";
import { ESTATE_FACTS_OBSERVED, estateFactsFromPayload } from "./estateFacts";

// WHY. /honesty rendered "335 signed measurement cards … all 335 verify" with nothing beside it
// saying where the number came from (row 23 / B-05, 2026-09-22). The number IS derived — by
// scripts/derive-chain-facts.mjs from the bytes, live from GET /api/state — but the prerendered
// page showed the committed derivation as if it were the present. The count stays derived; the
// page now says which derivation it is showing. These tests pin that no number is typed here
// and that the provenance travels with the sentence.

describe("estateFacts derives, never types", () => {
  it("the committed derivation is the committed artifact, dated by the artifact", () => {
    const cf = chainFacts as { as_of: string; bodies: { published: number; verified_valid: number; verified_at: string } };
    expect(ESTATE_FACTS_OBSERVED.live).toBe(false);
    expect(ESTATE_FACTS_OBSERVED.bodiesPublished).toBe(cf.bodies.published);
    expect(ESTATE_FACTS_OBSERVED.bodiesValid).toBe(cf.bodies.verified_valid);
    // Dated by the verification run, not by card_index.json's creation date (audit 2026-09-28 #17).
    expect(ESTATE_FACTS_OBSERVED.asOf).toBe(cf.bodies.verified_at);
    expect(cf.bodies.verified_at).not.toBe(cf.as_of);
    expect(ESTATE_FACTS_OBSERVED.verifiedSentence).toContain(`${cf.bodies.published} signed measurement cards`);
  });

  it("a non-live rendering carries its provenance and date in the same sentence", () => {
    const note = ESTATE_FACTS_OBSERVED.provenanceNote;
    expect(note).toContain("committed derivation");
    expect(note).toContain((chainFacts as { bodies: { verified_at: string } }).bodies.verified_at.slice(0, 10));
    expect(note).toContain("GET /api/state wins");
  });

  it("the live payload wins, is marked live, and carries the endpoint's as_of", () => {
    const payload = {
      card_chain: {
        bodies_published: { value: 7, as_of: "2026-09-22T00:00:00Z" },
        bodies_verified_valid: { value: 6, as_of: "2026-09-22T00:00:00Z" },
        bodies_withheld: { value: 1 },
        withheld_attested_by_published_parent: { value: 0 },
        manifest_signed: { value: true },
      },
    };
    const live = estateFactsFromPayload(payload)!;
    expect(live.live).toBe(true);
    expect(live.asOf).toBe("2026-09-22T00:00:00Z");
    expect(live.provenanceNote).toBe("");
    // catalogued ≠ verified is said, never smoothed over
    expect(live.verifiedSentence).toContain("7 signed measurement cards");
    expect(live.verifiedSentence).toContain("6 verify");
    expect(live.verifiedSentence).toContain("Catalogued ≠ pin-verified");
  });

  it("a payload missing a measured field yields null, never an invented count", () => {
    expect(estateFactsFromPayload({ card_chain: { bodies_published: { value: 7 } } })).toBeNull();
    expect(estateFactsFromPayload(null)).toBeNull();
  });
});
