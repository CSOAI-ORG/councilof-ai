import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  flagsByStatus,
  NSITES_BOOTSTRAP,
  NSITES_ENVELOPE,
  NSITES_FLAGS,
  NSITES_PUBLIC_CLAIM,
  NSITES_RULING,
  plantedSnippetCount,
  PLUGIN_HARVEST,
} from "./nSitesFlags";

const toolsPage = readFileSync(resolve(__dirname, "../pages/ToolsPage.tsx"), "utf8");
const flagsUi = readFileSync(resolve(__dirname, "../components/NSitesFlags.tsx"), "utf8");

describe("N-sites permissionless flags", () => {
  it("refuses the millions-of-models shortcut and the 2,200 sweep", () => {
    expect(NSITES_RULING).toMatch(/immutable coverage/i);
    expect(NSITES_RULING).toMatch(/not mass uploads/i);
    expect(NSITES_ENVELOPE.responses).toBe(990_000);
    expect(NSITES_ENVELOPE.tokens_approx).toBe(644_000_000);
    expect(NSITES_PUBLIC_CLAIM).toMatch(/dated cohort/);
    expect(NSITES_PUBLIC_CLAIM).not.toMatch(/all Hugging Face|all open-source/i);
    expect(NSITES_BOOTSTRAP[0]).toMatch(/Card v2/);
    expect(flagsByStatus("do-not").some((f) => f.id === "full-sweep")).toBe(true);
    expect(flagsByStatus("do-not").some((f) => f.id === "mass-upload")).toBe(true);
    expect(flagsByStatus("do-not").some((f) => f.id === "share-quotas")).toBe(true);
    expect(flagsByStatus("do-not").some((f) => f.id === "plugin-harvest")).toBe(true);
    expect(flagsByStatus("do-not").some((f) => f.id === "art50-stamp")).toBe(true);
    expect(flagsByStatus("do-not").some((f) => f.id === "scored-millions")).toBe(true);
    expect(flagsByStatus("do-not").some((f) => f.id === "zerogpu-fleet")).toBe(true);
    expect(flagsByStatus("planted").some((f) => f.id === "hf-inference-rail")).toBe(true);
    expect(flagsByStatus("planted").some((f) => f.id === "metamask-not-signer")).toBe(true);
    expect(JSON.stringify(NSITES_FLAGS)).not.toMatch(/\b13\/14\b/);
    expect(NSITES_FLAGS.find((f) => f.id === "hf-inference-rail")?.snippet).toMatch(
      /router\.huggingface\.co\/v1/,
    );
    expect(NSITES_BOOTSTRAP.some((s) => /Hundred unique weight lineages/.test(s))).toBe(true);
  });

  it("plants only receipts we already publish, with copy-ready snippets", () => {
    const planted = flagsByStatus("planted");
    expect(planted.length).toBeGreaterThanOrEqual(20);
    expect(plantedSnippetCount()).toBeGreaterThanOrEqual(20);
    expect(planted.every((f) => f.href.startsWith("https://"))).toBe(true);
    expect(NSITES_FLAGS.some((f) => f.id === "hf-badge" && f.snippet?.includes("/api/badge"))).toBe(true);
    expect(NSITES_FLAGS.some((f) => f.id === "mcp-http" && f.snippet?.includes("councilof.ai/mcp"))).toBe(true);
    expect(NSITES_FLAGS.some((f) => f.id === "mcp-official-registry")).toBe(true);
    expect(NSITES_FLAGS.some((f) => f.id === "zenodo-doi")).toBe(true);
    expect(NSITES_FLAGS.some((f) => f.id === "hf-collection")).toBe(true);
    expect(flagsByStatus("next").some((f) => f.id === "kaggle-benchmark")).toBe(true);
    expect(flagsByStatus("next").some((f) => f.id === "publisher-discussion" && f.snippet)).toBe(true);
  });

  it("keeps the plugin off user data and Article 50 off GSPC-M scores", () => {
    expect(PLUGIN_HARVEST.plugin_never).toContain("user chat bodies");
    expect(PLUGIN_HARVEST.plugin_never).toContain("an Article 50 compliance stamp");
    expect(PLUGIN_HARVEST.art50_is_not).toMatch(/GSPC-M/);
    expect(PLUGIN_HARVEST.art50_is).toMatch(/deployed system/);
    expect(PLUGIN_HARVEST.regulator_path).toMatch(/pull/);
    expect(PLUGIN_HARVEST.publisher_path).toMatch(/No mass mail/);
    const blob = JSON.stringify({ NSITES_FLAGS, PLUGIN_HARVEST, NSITES_RULING });
    expect(blob).not.toMatch(/£79|£499|rank for sale|22\/22|dorado|cibola|all millions/i);
    expect(toolsPage).toContain("NSitesFlags");
    expect(flagsUi).toContain("n-sites-flags");
    expect(flagsUi).toContain("n-sites-plugin-harvest");
    expect(flagsUi).toContain("/products");
    expect(flagsUi).not.toMatch(/£79|£499|rank for sale|dorado|cibola/i);
  });
});
