import { describe, expect, it } from "vitest";
import { DESKS, DESK_IDS, betterDesk, deskDisclosure, deskList, deskOf } from "./_chatDesks";

const PRICE = /[$£€]\s?\d|\b\d+(?:[.,]\d+)?\s?(?:usd|gbp|eur|dollars?|pounds?)\b|\bper\s+(?:month|year|minute)\b|\/mo\b/i;

describe("AI desks persona ratchet", () => {
  it("has exactly the six public desks", () => {
    expect(DESK_IDS.sort()).toEqual(["academy", "measure", "press", "revenue", "verify", "watchdog"]);
  });

  for (const id of DESK_IDS) {
    const d = DESKS[id];
    const text = [d.name, d.role, d.instructions, ...d.can, ...d.cannot, deskDisclosure(d.name)].join("\n");
    it(`${id}: no certification wording`, () => expect(text).not.toMatch(/certif/i));
    it(`${id}: no price`, () => expect(text).not.toMatch(PRICE));
    it(`${id}: grounded or UNMEASURED`, () => expect(d.instructions).toContain("UNMEASURED"));
    it(`${id}: Art. 50 disclosure present`, () => {
      const row = deskList().find((r) => r.id === id)!;
      expect(row.kind).toBe("AI agent");
      expect(row.disclosure).toContain("You are talking to an AI agent, not a person.");
      expect(row.disclosure).toContain(`${d.name} is an automated assistant run by CSOAI Ltd.`);
    });
  }

  it("reads desk tags loosely and rejects unknown ones", () => {
    expect(deskOf(" Measure ")?.id).toBe("measure");
    expect(deskOf("sales")).toBeNull();
    expect(deskOf(3)).toBeNull();
  });

  it("points an out-of-scope question at the right desk", () => {
    expect(betterDesk(DESKS.academy, "How do I verify a signed card?")?.id).toBe("verify");
    expect(betterDesk(DESKS.verify, "How do I verify a signed card?")).toBeNull();
  });
});
