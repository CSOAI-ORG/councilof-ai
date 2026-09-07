import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FINANCIAL_FACTS_AS_OF, financialFamilyBlock } from "./_gspc_fin_as_of";

describe("by_family.financial.as_of is produced, not typed 2026-08-25", () => {
  it("financialFamilyBlock carries as_of / reader_state / UNMEASURED risk from the producer snapshot", () => {
    const block = financialFamilyBlock(8, 8);
    expect(block.axes).toBe(8);
    expect(block.measured).toBe(8);
    expect(block.as_of).toBe(FINANCIAL_FACTS_AS_OF.as_of);
    expect(typeof block.as_of).toBe("string");
    expect(block.as_of).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(["REACHABLE", "UNREACHABLE"]).toContain(block.reader_state);
    expect(block.risk_verdict).toBe("UNMEASURED");
    expect(block.source).toBe("/interop/financial-facts-as-of.json");
  });

  it("gspc.ts wires financialFamilyBlock into totals.by_family.financial", () => {
    const src = readFileSync(new URL("./gspc.ts", import.meta.url), "utf8");
    expect(src).toContain("financialFamilyBlock");
    expect(src).toContain("./_gspc_fin_as_of");
    expect(src).toContain("...financialFamilyBlock(");
    expect(src).not.toMatch(/financial:\s*\{[^}]*as_of:\s*"2026-08-25"/);
  });

  it("a producer refresh must advance as_of past the stale 2026-08-25 board date", () => {
    // The stub is 1970 until grade_financial_ledgers.py writes a live stamp.
    // After the producer run, as_of is ISO and greater than 2026-08-25.
    if (FINANCIAL_FACTS_AS_OF.as_of === "1970-01-01T00:00:00Z") return;
    expect(FINANCIAL_FACTS_AS_OF.as_of > "2026-08-25T23:59:59Z").toBe(true);
    expect(FINANCIAL_FACTS_AS_OF.risk_verdict).toBe("UNMEASURED");
  });
});
