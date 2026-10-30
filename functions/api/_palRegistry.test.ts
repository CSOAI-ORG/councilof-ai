import { describe, expect, it } from "vitest";
import { DESKS, DESK_IDS, deskDisclosure } from "./_chatDesks";
import {
  HOUSE_PAL_SLUGS,
  buildPal,
  housePals,
  isWellFormedDid,
  palDisclosure,
  palTextViolations,
  publicPal,
  suggestPal,
} from "./_palRegistry";

const PRICE = /[$£€]\s?\d|\b\d+(?:[.,]\d+)?\s?(?:usd|gbp|eur|dollars?|pounds?)\b|\bper\s+(?:month|year|minute)\b|\/mo\b/i;
/**
 * A REAL, well-formed ed25519 did:key — one the estate already publishes (the MEOK HIM's Ora).
 * It is here because a DID that merely LOOKS like a did:key is a claim with no key behind it,
 * and the registry has to be able to tell the difference.
 */
const REAL_DID = "did:key:z6MksvqVuqPXddC3h1BEJ3WNXVfhMMnr3tpGMwoXikcPNqZb";

const didFor = (slug: string) => (slug === "measure" ? REAL_DID : "");
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

  it("gives every staff member its own memory namespace", () => {
    for (const p of pals) {
      expect(p.memory_namespace).toBe(`pal:${p.id}`);
    }
    expect(new Set(pals.map((p) => p.memory_namespace)).size).toBe(pals.length);
  });

  it("carries no DID for a staff member with no keypair provisioned", () => {
    // The house staff have no keypair yet. Publishing a DID-shaped string for them would be
    // publishing an identity with no key behind it, so the record says none and the surface
    // says so.
    for (const p of pals) {
      if (p.did === "") {
        expect((publicPal(p) as { signed: boolean }).signed).toBe(false);
      } else {
        expect(isWellFormedDid(p.did)).toBe(true);
      }
    }
    expect(pals.filter((p) => p.did === "").length).toBeGreaterThan(0);
  });

  it("publishes a DID that really is an ed25519 public key", () => {
    const signed = pals.find((p) => p.did !== "")!;
    expect(isWellFormedDid(signed.did)).toBe(true);
    expect((publicPal(signed) as { signed: boolean }).signed).toBe(true);
  });

  it("publishes a record that carries no key material", () => {
    const pub = publicPal(pals[0]) as Record<string, unknown>;
    const text = JSON.stringify(pub);
    // The word "private" appears in a desk's own scope ("Private or unpublished results"), so
    // what is checked here is key MATERIAL and secret-bearing FIELDS, not vocabulary.
    expect(text).not.toMatch(/BEGIN [A-Z ]*PRIVATE KEY/);
    expect(text).not.toMatch(/private_key|privateKey|api_key|apiKey|secret_key|secretKey/);
    expect(Object.keys(pub)).not.toContain("private_key");
    // A DID is a public key and IS published when there is one: that is the point of it.
    if (pub.did) expect(isWellFormedDid(String(pub.did))).toBe(true);
    expect(pub).toHaveProperty("signed");
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

describe("a DID is a key, not a shape", () => {
  it("accepts a real ed25519 did:key", () => {
    expect(isWellFormedDid(REAL_DID)).toBe(true);
  });

  it("refuses one that decodes to the wrong length", () => {
    // A truncated key is the failure mode that actually happened here: a DID copied from a
    // listing that was cut short, with the tail filled in by hand.
    expect(isWellFormedDid("did:key:z6MksvqVuqPXddC3h1BEJ3WNXVfhMMnr3tpGMwoXikcP")).toBe(false);
  });

  it("refuses one with the wrong multicodec prefix", () => {
    expect(isWellFormedDid("did:key:z6MkssSJeZqoQxNz7wYXGPU4mSxKLVN9bQ1pJvHZt4rKvNf")).toBe(false);
  });

  it("refuses one that is not a did:key at all", () => {
    expect(isWellFormedDid("")).toBe(false);
    expect(isWellFormedDid("https://example.com/measure")).toBe(false);
    expect(isWellFormedDid("did:web:csoai.org#measure")).toBe(false);
  });

  it("refuses to build a record carrying a malformed DID", () => {
    expect(() =>
      buildPal({
        id: "forged-csoai",
        slug: "forged",
        name: "Forged",
        one_line: "x",
        owner: "csoai",
        created_at: "2026-10-26T00:00:00Z",
        did: "did:key:zNotARealKeyAtAll",
        scope: { can: [], cannot: [], keywords: [], instructions: "x" },
      }),
    ).toThrow(/malformed did:key/);
  });

  it("builds a record with no DID, because none is provisioned", () => {
    const p = buildPal({
      id: "unsigned-csoai",
      slug: "unsigned",
      name: "Unsigned",
      one_line: "x",
      owner: "csoai",
      created_at: "2026-10-26T00:00:00Z",
      did: "",
      scope: { can: [], cannot: [], keywords: [], instructions: "x" },
    });
    expect(p.did).toBe("");
    expect((publicPal(p) as { signed: boolean }).signed).toBe(false);
  });
});
