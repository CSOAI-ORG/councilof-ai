import { describe, expect, it } from "vitest";
import { OBLIGATIONS, resolveObligation, isRelevant } from "./_obligations";

describe("obligation map — SKU-2 assembles against real obligations, never determines", () => {
  it("covers the four deadline obligations and resolves aliases", () => {
    expect(Object.keys(OBLIGATIONS).sort()).toEqual(["article-50", "article-53", "cra", "dora"]);
    expect(resolveObligation("art50")?.id).toBe("article-50");
    expect(resolveObligation("EU-AI-Act Art 53")?.id).toBe("article-53");
    expect(resolveObligation("gpai")?.id).toBe("article-53");
    expect(resolveObligation("eu-dora")?.id).toBe("dora");
    expect(resolveObligation("nonsense")).toBeNull();
  });

  it("a counsel-confirmed obligation ships no honesty note; every other one ships its note", () => {
    for (const o of Object.values(OBLIGATIONS)) {
      if (o.counsel_confirmed) expect(o.honesty).toBeNull();
      else expect(o.honesty).toMatch(/counsel|not (?:yet )?in the .*crosswalk|conformity/i);
    }
  });

  // Sell organ SG-08 (7 Oct 2026): article-50 read counsel_confirmed: true from 6383bf3d0 (2 Sep)
  // with no counsel named, no date and no sign-off on record. No obligation is counsel-confirmed
  // until the owner names the counsel and the date; article-50 says so on every output.
  it("no obligation claims a counsel review that has no record; article-50 carries its review note", () => {
    for (const o of Object.values(OBLIGATIONS)) expect(o.counsel_confirmed, o.id).toBe(false);
    const a50 = OBLIGATIONS["article-50"];
    expect(a50.review_note).toMatch(/Counsel review of the Article 50 wording is pending/);
    expect(a50.honesty).toMatch(/not a legal determination/);
  });

  it("relevance always needs an obligation keyword; a given subject must also match, an absent one constrains nothing", () => {
    const card = { sha256: "a".repeat(64), subject: "gpt-4o system-card behaviour", surface: "gspc.behavioural", tags: ["framework:eu-ai-act"], did: null, as_of: null, proof_len: 3 };
    expect(isRelevant(card, "gpt-4o", OBLIGATIONS["article-53"])).toBe(true);
    expect(isRelevant(card, "gpt-4o", OBLIGATIONS["article-50"])).toBe(false); // no transparency/marking keyword
    // An ABSENT subject is no constraint (PR #1310, measured 2026-09-05: the free preview of the
    // largest SKU returned 0 cards against 1039 because "" was ANDed as false). The keyword is
    // still required, so an obligation-wide request is bounded by the obligation, never by nothing.
    expect(isRelevant(card, "", OBLIGATIONS["article-53"])).toBe(true); // keyword match, obligation-wide
    expect(isRelevant(card, "", OBLIGATIONS["article-50"])).toBe(false); // no keyword: absent subject does not rescue it
    expect(isRelevant(card, "claude", OBLIGATIONS["article-53"])).toBe(false);
  });

  it("article-50 relevance is about marking, not any card that says 'disclosure' (2026-09-30)", () => {
    const a50 = OBLIGATIONS["article-50"];
    const base = { sha256: "b".repeat(64), did: null, as_of: null, proof_len: 3 };
    // Real subjects/tags from the 2026-09-30 corpus: 80 of 93 obligation-wide hits matched on "disclosure" alone.
    const custody = { ...base, subject: "GSPC custody-disclosure UNMEASURED coverage", surface: "public.notice", tags: ["coverage:UNMEASURED", "not-a-grade", "no-composite"] };
    const bank = {
      ...base,
      subject: "Circle disclosure page facts: 43 attestation PDF links, term hits, cadence — PROBED",
      surface: "public.notice",
      tags: ["eater:xrpl-swift", "axis:reserve-attestation", "axis:custody-disclosure", "axis:regulatory-framework"],
    };
    const reserveTransparency = { ...base, subject: "Issuer reserve transparency report", surface: "public.notice", tags: [] };
    expect(isRelevant(custody, "", a50)).toBe(false);
    expect(isRelevant(bank, "", a50)).toBe(false);
    expect(isRelevant(reserveTransparency, "", a50)).toBe(false);
    // What stays: cards whose own subject/surface/tags name Article 50 marking or agent disclosure.
    const marking = { ...base, subject: "Anthropic — art50_marking: bytes changed 2026-09-12", surface: "public.notice", tags: ["provider-diff", "surface:art50_marking"] };
    const census = { ...base, subject: "Art 50 generator content-marking census", surface: "public.notice", tags: ["public-notice", "art50", "marking-census"] };
    const agent = { ...base, subject: "agent disclosure probe", surface: "agent.disclosure", tags: [] };
    expect(isRelevant(marking, "", a50)).toBe(true);
    expect(isRelevant(census, "", a50)).toBe(true);
    expect(isRelevant(agent, "", a50)).toBe(true);
  });
});
