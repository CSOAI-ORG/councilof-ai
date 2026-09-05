import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  flagsByStatus,
  NSITES_BOOTSTRAP,
  NSITES_ENVELOPE,
  NSITES_FLAGS,
  NSITES_MILL_METHOD,
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

  it("uses Hugging Face Inference Providers as the mill on every N-site", () => {
    expect(NSITES_MILL_METHOD.base_url).toBe("https://router.huggingface.co/v1");
    expect(NSITES_MILL_METHOD.id).toBe("hf-inference-rail");
    expect(NSITES_MILL_METHOD.mill_secret).toBe("HF_INFERENCE_TOKEN");
    expect(NSITES_MILL_METHOD.workflows).not.toContain("hf-inference-mill");
    expect(NSITES_MILL_METHOD.workflows).toContain("hf-fin-shells");
    expect(NSITES_MILL_METHOD.never.join(" ")).toMatch(/ZeroGPU|Ollama/i);
    const plantedCompute = flagsByStatus("planted")
      .filter((f) => f.kind === "compute")
      .map((f) => f.id);
    expect(plantedCompute).toEqual(["hf-inference-rail", "gspc-hf-node"]);
    expect(NSITES_FLAGS.find((f) => f.id === "gspc-hf-node")?.snippet).toMatch(
      /404 by design/,
    );
    expect(NSITES_FLAGS.find((f) => f.id === "gspc-hf-node")?.snippet).not.toMatch(
      /POST https:\/\/csoai-gspc-node\.hf\.space\/v1\/measure/,
    );
    expect(NSITES_MILL_METHOD.snippet).not.toMatch(/hf-inference-mill/);
    expect(flagsByStatus("do-not").some((f) => f.id === "zerogpu-fleet")).toBe(true);
    expect(JSON.stringify(NSITES_FLAGS)).not.toMatch(/ollama pull|localhost:11434/i);
    expect(flagsUi).toContain("n-sites-mill-method");
    expect(flagsUi).toContain("router.huggingface.co/v1");
    expect(flagsUi).toContain("every N-site");
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
    expect(toolsPage).not.toContain("NSitesFlags"); // internal planning envelope — never on a public page
    expect(flagsUi).toContain("n-sites-flags");
    expect(flagsUi).toContain("n-sites-plugin-harvest");
    expect(flagsUi).toContain("/products");
    expect(flagsUi).not.toMatch(/£79|£499|rank for sale|dorado|cibola/i);
  });
});
