import { describe, expect, it } from "vitest";
import { ASK_COUNT, AUDIENCES, asksFor } from "./asks";

describe("lobby asks — every demographic we cover", () => {
  it("keeps the homepage buyers in the chip row", () => {
    const ids = AUDIENCES.map((a) => a.id);
    for (const need of ["public", "builder", "insurer", "regulator", "press"]) {
      expect(ids).toContain(need);
    }
  });

  it("returns four suggestions for every audience on Home", () => {
    for (const a of AUDIENCES) {
      const asks = asksFor("/", a.id);
      expect(asks.length).toBe(4);
      expect(new Set(asks).size).toBe(asks.length);
    }
  });

  it("leads with the board questions on the living board", () => {
    const asks = asksFor("/gspc-scoreboard", "press");
    expect(asks[0]).toMatch(/board/i);
  });

  it("cuts compare and Layer 0 to published-material questions", () => {
    expect(asksFor("/compare", "procurement")[0]).toMatch(/measurement|certif/i);
    expect(asksFor("/layer0", "builder")[0]).toMatch(/sign|verif|legal/i);
    expect(asksFor("/for/regulator", "regulator")[0]).toMatch(/measured|measur/i);
  });

  it("computes ASK_COUNT from the registry, never a typed integer", () => {
    expect(ASK_COUNT).toBeGreaterThan(40);
  });
});
