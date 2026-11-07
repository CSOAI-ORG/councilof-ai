import { describe, expect, it } from "vitest";
import { MCP_MAX_JSON_DEPTH, MCP_MAX_JSON_TOKENS, withinJsonBudget } from "./_input_budget";

describe("constant-space JSON preflight", () => {
  it("accepts the exact token budget and rejects the next token", () => {
    expect(withinJsonBudget(JSON.stringify(Array(MCP_MAX_JSON_TOKENS - 1).fill(null)))).toBe(true);
    expect(withinJsonBudget(JSON.stringify(Array(MCP_MAX_JSON_TOKENS).fill(null)))).toBe(false);
  });
  it("counts keys, containers and literals, including wide objects", () => {
    expect(withinJsonBudget(JSON.stringify(Object.fromEntries(Array.from({ length: 13_000 }, (_, n) => [n, 0]))))).toBe(false);
  });
  it("accepts the exact depth budget and rejects the next container", () => {
    for (const [depth, allowed] of [[MCP_MAX_JSON_DEPTH, true], [MCP_MAX_JSON_DEPTH + 1, false]] as const)
      expect(withinJsonBudget("[".repeat(depth) + "0" + "]".repeat(depth))).toBe(allowed);
  });
  it("ignores punctuation and escaped quotes/backslashes inside strings", () => {
    const text = '[{"key":"\\\\\\\"value"},null]'.repeat(20_000);
    expect(withinJsonBudget(JSON.stringify({ card: text }))).toBe(true);
  });
  it.each(["{", "null", "[]", '"unterminated', "[true,false,-1.5e2]"])("leaves syntax/protocol validation to their parsers: %s", body => {
    expect(withinJsonBudget(body)).toBe(true);
  });
});
