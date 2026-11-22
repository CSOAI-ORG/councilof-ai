// The capsule-to-provision backfill map is derived, not chosen: every row must follow from committed files.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
// @ts-expect-error: plain ESM script, no type declarations
import { articlesIn } from "./build-coverage.mjs";
import { OBLIGATIONS } from "../../functions/api/_obligations";

const ROOT = join(__dirname, "..", "..");
const readJson = (p: string) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const MAP = readJson("public/mechanism/capsule-provision-map.json");
const MANIFEST = readJson("public/interop/frozen-provision-hashes.json");
const COVERAGE = readJson("public/mechanism/coverage.json");
const SOURCE = readJson("scripts/mechanism/coverage.source.json");
const REGULATOR_CELEX: Record<string, string> = { "eu-ai-act": "32024R1689", "eu-dora": "32022R2554", "eu-cra": "32024R2847" };

describe("capsule-provision backfill map", () => {
  it("is pinned to the frozen manifest", () => {
    expect(MAP.corpus_root).toBe(MANIFEST.corpus_root);
    for (const m of MAP.mappings) expect(m.provision_sha256, m.kind).toBe(MANIFEST.anchors[m.provision_id]);
  });

  it("maps only what an implemented predicate names, from that predicate's own code", () => {
    for (const m of MAP.mappings) {
      const p = SOURCE.predicates.find((x: { id: string }) => x.id === m.predicate);
      expect(p, m.predicate).toBeTruthy();
      expect(`${p.celex}:${p.article}`).toBe(m.provision_id);
      expect(p.code).toContain(m.code);
      expect(m.relation).toBe("PREDICATE");
      expect(readFileSync(join(ROOT, m.code), "utf8")).toContain(JSON.stringify(m.kind));
    }
  });

  it("classifies every published v0.2 capsule adapter exactly once", () => {
    const published = [...new Set(COVERAGE.capsule_adapters.map((a: { adapter: string }) => a.adapter))].sort();
    const mappedAdapters = MAP.mappings.filter((m: { source: string }) => m.source === "adapter").map((m: { kind: string }) => m.kind);
    const listed = [...MAP.unmapped_adapters.map((a: { adapter: string }) => a.adapter), ...mappedAdapters].sort();
    expect(listed).toEqual(published);
    for (const a of MAP.unmapped_adapters) expect(existsSync(join(ROOT, "public/measurement-capsules/v0.2", a.adapter)) || COVERAGE.capsule_adapters.some((c: { adapter: string }) => c.adapter === a.adapter)).toBe(true);
  });

  it("obligation aliases are the Article numbers in each obligation's title, and only those", () => {
    expect(Object.keys(MAP.obligation_aliases).sort()).toEqual(Object.keys(OBLIGATIONS).sort());
    for (const [id, ob] of Object.entries(OBLIGATIONS)) {
      const alias = MAP.obligation_aliases[id];
      const celex = REGULATOR_CELEX[ob.regulator];
      expect(alias.celex, id).toBe(celex);
      const derived = (articlesIn(ob.title).articles as string[]).map((a) => `${celex}:${a}`);
      expect(alias.provisions, id).toEqual(derived);
      for (const pid of alias.provisions) expect(MANIFEST.anchors[pid], pid).toBeTruthy();
    }
  });

  it("states no count", () => {
    const text = JSON.stringify({ ...MAP, mappings: [], obligation_aliases: {}, corpus_root: "" });
    expect(text).not.toMatch(/\b\d{2,}\b/);
  });
});
