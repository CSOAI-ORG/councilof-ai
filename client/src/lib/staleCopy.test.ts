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

const header = readFileSync(resolve(__dirname, "../components/Header.tsx"), "utf8");
const claim = readFileSync(resolve(__dirname, "../data/anchoringClaim.ts"), "utf8");
const productsFill = readFileSync(resolve(__dirname, "./productFill.ts"), "utf8");

describe("leftover: /xrpl-attest is a public-root reader, not a live DEVNET pointer", () => {
  it("does not present /xrpl-attest as a separate DEVNET pointer", () => {
    expect(claim).not.toMatch(/\/xrpl-attest page is a separate DEVNET pointer/);
    expect(claim).toMatch(/reader of GET \/root\.json/);
    expect(header).not.toMatch(/Devnet pointer — not a grade/);
    expect(header).toMatch(/Public-root reader of \/root\.json/);
    expect(header).not.toMatch(/Free signed assessment/);
    expect(header).not.toMatch(/No account, no fee/);
    expect(productsFill).not.toMatch(/XRPL memo \/ XLS-70 on DEVNET today/);
    expect(productsFill).toMatch(/living feed is GET \/root\.json/);
  });
});
