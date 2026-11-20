import { describe, expect, it } from "vitest";
import {
  MCP_MAX_JSON_DEPTH,
  MCP_MAX_JSON_TOKENS,
  withinJsonBudget,
  withinValueBudget,
} from "./_input_budget";

describe("constant-space JSON preflight", () => {
  it("accepts the exact token budget and rejects the next token", () => {
    expect(
      withinJsonBudget(
        JSON.stringify(Array(MCP_MAX_JSON_TOKENS - 1).fill(null)),
      ),
    ).toBe(true);
    expect(
      withinJsonBudget(JSON.stringify(Array(MCP_MAX_JSON_TOKENS).fill(null))),
    ).toBe(false);
  });
  it("counts keys, containers and literals, including wide objects", () => {
    expect(
      withinJsonBudget(
        JSON.stringify(
          Object.fromEntries(Array.from({ length: 13_000 }, (_, n) => [n, 0])),
        ),
      ),
    ).toBe(false);
  });
  it("accepts the exact depth budget and rejects the next container", () => {
    for (const [depth, allowed] of [
      [MCP_MAX_JSON_DEPTH, true],
      [MCP_MAX_JSON_DEPTH + 1, false],
    ] as const)
      expect(
        withinJsonBudget("[".repeat(depth) + "0" + "]".repeat(depth)),
      ).toBe(allowed);
  });
  it("ignores punctuation and escaped quotes/backslashes inside strings", () => {
    const text = '[{"key":"\\\\\\\"value"},null]'.repeat(20_000);
    expect(withinJsonBudget(JSON.stringify({ card: text }))).toBe(true);
  });
  it("bounds parsed arrays/records without treating a large string as a collection", () => {
    expect(withinValueBudget(Array(10_000).fill(null))).toBe(true);
    expect(withinValueBudget(Array(10_001).fill(null))).toBe(false);
    expect(
      withinValueBudget(
        Object.fromEntries(Array.from({ length: 10_001 }, (_, n) => [n, 0])),
      ),
    ).toBe(false);
    expect(withinValueBudget({ payload: "A".repeat(1024 * 1024) })).toBe(true);
  });
  it("can count encoded collection elements without re-parsing number lexemes", () => {
    expect(
      withinJsonBudget(JSON.stringify(Array(10_000).fill(null)), 10_000),
    ).toBe(true);
    expect(
      withinJsonBudget(JSON.stringify(Array(10_001).fill(null)), 10_000),
    ).toBe(false);
    expect(withinJsonBudget('[{"a":[1.0,1e-05]}]', 4)).toBe(true);
    expect(withinJsonBudget('[{"a":[1.0,1e-05]}]', 3)).toBe(false);
    expect(
      withinJsonBudget(JSON.stringify({ a: ':,"[]{}'.repeat(20_000) }), 1),
    ).toBe(true);
    expect(withinJsonBudget('{"a":0,"b":1}', 1)).toBe(false);
  });
  it.each(["{", "null", "[]", '"unterminated', "[true,false,-1.5e2]"])(
    "leaves syntax/protocol validation to their parsers: %s",
    (body) => {
      expect(withinJsonBudget(body)).toBe(true);
    },
  );
});
