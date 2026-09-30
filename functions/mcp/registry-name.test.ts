/**
 * The flagship's canonical MCP Registry name is `ai.councilof/gspc` (owner ruling 2026-09-26): it is
 * domain-backed (the key served at /.well-known/mcp-registry-auth matches the live record) and it is
 * the name registry search ranks first. `io.github.CSOAI-ORG/gspc` is the SAME door listed under the
 * GitHub-org namespace — its deprecated alias. The owner deprecates it in the registry; that needs his
 * GitHub login, so the alias stays listed until he does.
 *
 * Until this test, every discovery file the site serves named the alias as the id. This pins:
 *   1. every field that states the registry name states the canonical one;
 *   2. wherever a discovery file still mentions the alias, the word "deprecated" sits beside it —
 *      a bare mention reads as the canonical id, which is exactly the defect.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");
const CANONICAL = "ai.councilof/gspc";
const ALIAS = "io.github.CSOAI-ORG/gspc";
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");
const json = (p: string) => JSON.parse(read(p));

function walk(dir: string): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((n) => {
    const p = join(dir, n);
    return statSync(join(ROOT, p)).isDirectory() ? walk(p) : [p];
  });
}

/** Every file an agent or a person reads to discover the door (and the producers of the generated ones). */
const DISCOVERY = [
  ...walk("public/.well-known").filter((p) => /\.(json|txt)$/.test(p)),
  "public/llms.txt",
  "public/llms-full.txt",
  "scripts/llms/llms.txt.tmpl",
  "scripts/llms/llms-full.txt.tmpl",
  "mcp/gspc-server/server.json",
  "mcp/gspc-server/package.json",
  "mcp/gspc-server/README.md",
  "mcp/gspc-server/REGISTRY-SUBMISSIONS.md",
  "council-os/distribution.json",
  ...walk("distribution").filter((p) => !p.includes("io.github.CSOAI-ORG-gspc")),
];

/** Mentions of the alias with no "deprecated" within `span` characters either side. */
function bareAliasMentions(text: string, span = 200): number[] {
  const out: number[] = [];
  for (let i = text.indexOf(ALIAS); i >= 0; i = text.indexOf(ALIAS, i + 1)) {
    const ctx = text.slice(Math.max(0, i - span), i + ALIAS.length + span);
    if (!/deprecated/i.test(ctx)) out.push(i);
  }
  return out;
}

describe("the canonical MCP Registry name is ai.councilof/gspc; io.github.CSOAI-ORG/gspc is its deprecated alias", () => {
  it("every field that states the registry name states the canonical one", () => {
    expect(json("public/.well-known/mcp/server.json").name).toBe(CANONICAL);
    expect(json("public/.well-known/mcp.json").servers[0].registry.name).toBe(CANONICAL);
    expect(json("public/.well-known/mcp.json").servers[0].registry.deprecated_alias).toBe(ALIAS);
    expect(json("public/.well-known/agents.json").mcp.registry_entry).toBe(CANONICAL);
    expect(json("mcp/gspc-server/server.json").name).toBe(CANONICAL);
    expect(json("mcp/gspc-server/package.json").mcpName).toBe(CANONICAL);
    const names = json("council-os/distribution.json").registry_names;
    expect(names.canonical).toBe(CANONICAL);
    expect(names.domain).toBe(CANONICAL);
    expect(names.deprecated_alias).toBe(ALIAS);
  });

  it("the discovery set is real (this cannot pass vacuously)", () => {
    expect(DISCOVERY.length).toBeGreaterThan(20);
    expect(DISCOVERY).toContain("public/.well-known/mcp/server-card.json");
    const mentioning = DISCOVERY.filter((p) => read(p).includes(CANONICAL));
    expect(mentioning.length).toBeGreaterThanOrEqual(8);
  });

  it("no discovery file names the alias without calling it deprecated", () => {
    const bad = DISCOVERY.flatMap((p) => bareAliasMentions(read(p)).map((i) => `${relative(ROOT, join(ROOT, p))}@${i}`));
    expect(bad, "a discovery file names io.github.CSOAI-ORG/gspc as if it were the id").toEqual([]);
  });

  it("control: the sentence that shipped is caught; the corrected one is not", () => {
    expect(bareAliasMentions("- MCP flagship: POST https://councilof.ai/mcp — registry id io.github.CSOAI-ORG/gspc")).toHaveLength(1);
    expect(bareAliasMentions(`registry id ${CANONICAL} (deprecated alias: ${ALIAS})`)).toHaveLength(0);
  });

  it("the alias's own registry descriptor still exists (the owner needs it to deprecate the name)", () => {
    expect(json("distribution/mcp-registry/io.github.CSOAI-ORG-gspc/server.json").name).toBe(ALIAS);
  });
});
