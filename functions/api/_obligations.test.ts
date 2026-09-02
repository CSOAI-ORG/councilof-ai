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

  it("only Article 50 is counsel-confirmed; the others ship their honesty note", () => {
    for (const o of Object.values(OBLIGATIONS)) {
      if (o.counsel_confirmed) expect(o.honesty).toBeNull();
      else expect(o.honesty).toMatch(/counsel|not (?:yet )?in the .*crosswalk|conformity/i);
    }
  });

  it("relevance needs BOTH the subject and an obligation keyword — never subject alone", () => {
    const card = { sha256: "a".repeat(64), subject: "gpt-4o system-card behaviour", surface: "gspc.behavioural", tags: ["framework:eu-ai-act"], did: null, as_of: null, proof_len: 3 };
    expect(isRelevant(card, "gpt-4o", OBLIGATIONS["article-53"])).toBe(true);
    expect(isRelevant(card, "gpt-4o", OBLIGATIONS["article-50"])).toBe(false); // no transparency/marking keyword
    expect(isRelevant(card, "", OBLIGATIONS["article-53"])).toBe(false); // an empty subject matches nothing
    expect(isRelevant(card, "claude", OBLIGATIONS["article-53"])).toBe(false);
  });
});
