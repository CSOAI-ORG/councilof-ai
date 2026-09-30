import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import FREE from "../../../functions/mcp/gspc-tools.json";
import PAID from "../../../functions/mcp/paid-tools.json";
import { CLAUDE_CODE_CMD, EXAMPLE_PROMPTS, FREE_DOOR, ONE_LINE, TOOLS } from "./ConnectClaude";

// /connect/claude documents the free door. It must list exactly what that door serves, carry
// 3-5 working example prompts (Software Directory Policy 3.E asks for at least three), and state
// no price and no certification.
const SRC = readFileSync(resolve(__dirname, "ConnectClaude.tsx"), "utf8");
const freeNames = (FREE as { tools: { name: string }[] }).tools.map((t) => t.name);
const paidNames = (PAID as { tools: { name: string }[] }).tools.map((t) => t.name);

describe("/connect/claude", () => {
  it("lists exactly the free door's tools, each with its own one-line description", () => {
    expect(TOOLS.map((t) => t.name)).toEqual(freeNames);
    expect(Object.keys(ONE_LINE).sort()).toEqual([...freeNames].sort());
    for (const line of Object.values(ONE_LINE)) expect(line.length).toBeLessThanOrEqual(140);
  });

  it("points at /mcp/free, never at the door that carries the metered tools", () => {
    expect(FREE_DOOR).toBe("https://councilof.ai/mcp/free");
    expect(CLAUDE_CODE_CMD).toContain(FREE_DOOR);
    // Whole identifiers only: the free evidence_bundle_preview contains the paid name evidence_bundle as a prefix.
    for (const name of paidNames) expect(SRC).not.toMatch(new RegExp(`\\b${name}\\b(?!_)`));
    expect(SRC).not.toMatch(/x_payment|USDC|\bwallet\b/);
  });

  it("carries three to five example prompts", () => {
    expect(EXAMPLE_PROMPTS.length).toBeGreaterThanOrEqual(3);
    expect(EXAMPLE_PROMPTS.length).toBeLessThanOrEqual(5);
  });

  it("states no price, types no board count, and makes no certification claim", () => {
    expect(SRC).not.toMatch(/[$£€]\s?\d/);
    expect(SRC).not.toMatch(/\b\d+\s+(?:axis|axes)\b/i);
    const certif = SRC.match(/[^.\n]*certif[^.\n]*/gi) ?? [];
    for (const s of certif) expect(s, s).toMatch(/not certification|no certification claim/i);
  });
});
