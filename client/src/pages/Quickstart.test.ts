import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "Quickstart.tsx"), "utf8");
const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");
const nav = readFileSync(resolve(__dirname, "../components/HeaderNav.tsx"), "utf8");
const library = readFileSync(resolve(__dirname, "../data/library-ia.ts"), "utf8");
const prerender = readFileSync(resolve(__dirname, "../../../scripts/prerender.mjs"), "utf8");

describe("/quickstart — the agent path from discovery to a verified paid response", () => {
  it("carries all four wirings a new page needs (route, title, prerender MUST, PRIMARY_PATHS) and a nav entry", () => {
    expect(app).toContain('const Quickstart = lazy(() => import("./pages/Quickstart"))');
    expect(app).toContain('<Route path="/quickstart" component={Quickstart} />');
    expect(app).toMatch(/"\/quickstart": "Agent quickstart/);
    expect(prerender).toContain('"/quickstart"');
    expect(library).toContain('"/quickstart"');
    expect(nav).toContain("href: '/quickstart'");
  });

  it("reads doors, tool names and the verify route from the live manifest — none are typed", () => {
    expect(page).toContain('const MANIFEST = "/.well-known/x402.json"');
    expect(page).toContain("manifest?.mcp?.free_tools");
    expect(page).toContain("manifest?.mcp?.paid_tools");
    expect(page).not.toMatch(/board_totals|commission_card|rwa_evidence/); // tool names come from the manifest, not the page
  });

  it("types no price, no count and no verdict — the amount lives only in the 402", () => {
    expect(page).not.toMatch(/\$\s?\d/);
    expect(page).not.toMatch(/\b\d+(\.\d+)?\s?USDC\b/);
    expect(page).not.toMatch(/\b(compliant|approved|guaranteed?)\b/i); // "never certification" is the disclaimer, not a claim
    expect(page).not.toMatch(/(?<!UN)MEASURED\b/);
    expect(page).not.toMatch(/\b\d+ (doors|cards|axes|payers)\b/);
  });

  it("walks the five steps and names the honesty rules that bound them", () => {
    for (const s of ["1 · Discover", "2 · Read what is free", "3 · Pay a door", "4 · Verify", "5 · Correct"]) expect(page).toContain(s);
    expect(page).toContain("A settlement of zero is not a purchase");
    expect(page).toContain("does not make the read correct");
    expect(page).toContain("Measurement, never certification");
  });
});
