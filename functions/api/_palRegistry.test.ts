import { describe, expect, it } from "vitest";
import { DESKS, DESK_IDS, deskDisclosure } from "./_chatDesks";
import {
  HOUSE_PAL_SLUGS,
  buildPal,
  housePals,
  palDisclosure,
  palTextViolations,
  publicPal,
  suggestPal,
} from "./_palRegistry";

const PRICE = /[$£€]\s?\d|\b\d+(?:[.,]\d+)?\s?(?:usd|gbp|eur|dollars?|pounds?)\b|\bper\s+(?:month|year|minute)\b|\/mo\b/i;
const DID = /^did:key:z[1-9A-HJ-NP-Za-km-z]{40,}$/;

const didFor = (slug: string) => `did:key:z${slug.padEnd(44, "7").slice(0, 44)}`;
const pals = housePals(didFor, "2026-10-26T00:00:00Z");

describe("the PAL registry is the desk list, not a second copy of it", () => {
  it("has exactly one PAL per desk", () => {
    expect([...HOUSE_PAL_SLUGS].sort()).toEqual([...DESK_IDS].sort());
    expect(pals).toHaveLength(DESK_IDS.length);
  });

  for (const id of DESK_IDS) {
    it(`${id}: the PAL carries the desk's own scope, not a paraphrase`, () => {
      const pal = pals.find((p) => p.slug === id)!;
      const d = DESKS[id];
      expect(pal.name).toBe(d.name);
      expect(pal.one_line).toBe(d.role);
      expect(pal.scope.can).toEqual(d.can);
      expect(pal.scope.cannot).toEqual(d.cannot);
      expect(pal.scope.keywords).toEqual(d.keywords);
      expect(pal.scope.instructions).toBe(d.instructions);
    });

    it(`${id}: the Art. 50 notice is the desk's own sentence`, () => {
      const pal = pals.find((p) => p.slug === id)!;
      expect(palDisclosure(pal.name)).toBe(deskDisclosure(DESKS[id].name));
      expect(palDisclosure(pal.name)).toContain("You are talking to an AI agent, not a person.");
    });

    it(`${id}: makes no certification claim and quotes no price`, () => {
      const pal = pals.find((p) => p.slug === id)!;
      // The PROMISES the PAL makes. The guardrails are deliberately not in this text: a rule
      // that reads "never say a system is certified" names the word in order to forbid it, and
      // a test that greps for the word cannot tell a prohibition from a claim. The guardrails
      // are checked for CONTENT in the next test instead.
      const promises = [
        pal.name,
        pal.one_line,
        pal.scope.instructions,
        ...pal.scope.can,
        ...pal.scope.cannot,
        ...pal.objectives.map((o) => o.goal),
        palDisclosure(pal.name),
      ].join("\n");
      expect(promises).not.toMatch(/certif/i);
      expect(promises).not.toMatch(PRICE);
    });

    it(`${id}: holds the rules it promises to hold`, () => {
      const pal = pals.find((p) => p.slug === id)!;
      const rules = pal.guardrails.map((g) => `${g.rule} ${g.because}`).join("\n");
      // Facts from records, no certification, no price, not a person, empty stays empty.
      expect(rules).toMatch(/number comes from a published record/i);
      expect(rules).toMatch(/never say a system is certified/i);
      expect(rules).toMatch(/never quote a fee/i);
      expect(rules).toMatch(/never state or imply that you are a human/i);
      expect(rules).toMatch(/say UNMEASURED when no record answers/i);
    });
  }

  it("gives every staff member its own identity and memory namespace", () => {
    const dids = pals.map((p) => p.did);
    expect(new Set(dids).size).toBe(dids.length);
    for (const p of pals) {
      expect(p.did).toMatch(DID);
      expect(p.memory_namespace).toBe(`pal:${p.id}`);
    }
    expect(new Set(pals.map((p) => p.memory_namespace)).size).toBe(pals.length);
  });

  it("publishes a record that carries no key material", () => {
    const pub = publicPal(pals[0]) as Record<string, unknown>;
    const text = JSON.stringify(pub);
    // The word "private" appears in a desk's own scope ("Private or unpublished results"), so
    // what is checked here is key MATERIAL and secret-bearing FIELDS, not vocabulary.
    expect(text).not.toMatch(/BEGIN [A-Z ]*PRIVATE KEY/);
    expect(text).not.toMatch(/private_key|privateKey|api_key|apiKey|secret_key|secretKey/);
    expect(Object.keys(pub)).not.toContain("private_key");
    // The DID is a public key and IS published: that is the point of it.
    expect(pub.did).toMatch(DID);
  });

  it("refuses text that claims a certification or a price", () => {
    expect(palTextViolations("This system is certified safe to deploy.").length).toBeGreaterThan(0);
    expect(palTextViolations("It costs $99 per month.").length).toBeGreaterThan(0);
    expect(palTextViolations("I am a human being.").length).toBeGreaterThan(0);
    expect(palTextViolations("The board counts 33 axes and 23 are measured.")).toEqual([]);
  });
});

describe("suggestion is a suggestion, never an answer", () => {
  it("points a question at the desk whose scope covers it", () => {
    const s = suggestPal(pals, "How do I verify a signed card?");
    expect(s.pal?.slug).toBe("verify");
    expect(s.score).toBeGreaterThan(0);
  });

  it("returns nothing rather than guessing when no scope covers the question", () => {
    const s = suggestPal(pals, "zzz qqq xyzzy");
    expect(s.pal).toBeNull();
  });
});
