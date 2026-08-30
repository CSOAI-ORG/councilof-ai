import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pack = readFileSync(resolve(__dirname, "../../../functions/api/evidence-pack.ts"), "utf8");
const mcp = readFileSync(resolve(__dirname, "../../../public/.well-known/mcp.json"), "utf8");
const tools = readFileSync(resolve(__dirname, "../pages/ToolsPage.tsx"), "utf8");

describe("stale copy honesty", () => {
  it("RAS pack cites the living board, not a 13-axis product", () => {
    expect(pack).toMatch(/Not a 13-axis product/);
    expect(pack).toMatch(/GET \/api\/gspc/);
    expect(pack).toMatch(/cite the live length/);
    expect(pack).not.toMatch(/13 real self-caught/);
    expect(pack).not.toMatch(/13 axes × 8 frameworks/);
  });

  it("mcp.json names the planted four-read door as the measured product", () => {
    const j = JSON.parse(mcp);
    expect(j.planted.tools).toEqual(["board_totals", "get_axis", "verify_card", "list_cards"]);
    expect(j.measured.tools).toEqual(["board_totals", "get_axis", "verify_card", "list_cards"]);
    expect(j.planted.note).toMatch(/Four read tools/);
    expect(j.measured.note).toMatch(/not this product/);
    expect(tools).toContain("WatchlistPane");
    expect(tools).toContain("board_totals · get_axis · verify_card · list_cards");
  });
});
