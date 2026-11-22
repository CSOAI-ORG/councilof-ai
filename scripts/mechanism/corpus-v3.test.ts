// Pins public/interop/corpus-v3 to its bytes: file digests, anchors, per-instrument roots and the corpus root.
// Text-level re-hashing uses the frozen Python normaliser (scripts/mechanism/verify_corpus_v3.py).
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");
const D = join(ROOT, "public", "interop", "corpus-v3");
const sha = (b: Buffer | string) => createHash("sha256").update(b).digest("hex");
const man = JSON.parse(readFileSync(join(D, "manifest.json"), "utf8"));
const jsonl = (p: string) => readFileSync(p, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
const root = (a: Record<string, string>) => {
  const h = createHash("sha256");
  for (const k of Object.keys(a).sort()) { h.update(k); h.update(a[k]); }
  return h.digest("hex");
};
const reg = new Map(jsonl(join(D, "registry.jsonl")).map((r: any) => [r.instrument_id, r]));
const rows = readdirSync(join(D, "provisions")).filter((f) => f.endsWith(".jsonl")).flatMap((f) => jsonl(join(D, "provisions", f)));

describe("corpus v3", () => {
  it("every listed file matches its manifest digest", () => {
    for (const [rel, digest] of Object.entries(man.files as Record<string, string>)) expect(sha(readFileSync(join(ROOT, rel))), rel).toBe(digest);
  });
  it("anchors equal the hashed rows and the corpus root recomputes", () => {
    const a: Record<string, string> = {};
    for (const r of rows) if (r.provision_sha256) a[r.provision_id] = r.provision_sha256;
    expect(a).toEqual(man.anchors);
    expect(root(a)).toBe(man.corpus_root);
    expect(Object.keys(a).length).toBe(man.counts.provisions_hashed);
  });
  it("instrument roots recompute and every provision has a registry row", () => {
    const by: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      expect(reg.has(r.instrument_id), r.provision_id).toBe(true);
      if (r.provision_sha256) (by[r.instrument_id] ??= {})[r.provision_id] = r.provision_sha256;
    }
    for (const [iid, rt] of Object.entries(man.instrument_roots as Record<string, string>)) expect(root(by[iid] ?? {}), iid).toBe(rt);
  });
  it("withheld texts belong only to instruments not cleared for republication", () => {
    for (const r of rows) if (r.text_withheld) expect((reg.get(r.instrument_id) as any).text_published, r.provision_id).toBe(false);
  });
  it("v1 stays immutable and identical v1 rows keep their hashes", () => {
    const v1 = JSON.parse(readFileSync(join(ROOT, "public", "interop", "frozen-provision-hashes.json"), "utf8"));
    expect(v1.corpus_root).toBe(man.supersedes_relation.v1_root);
    for (const r of rows) if (r.v1_relation === "IDENTICAL") expect(v1.anchors[r.provision_id], r.provision_id).toBe(r.provision_sha256);
  });
  it("registry statuses carry citations", () => {
    for (const r of reg.values() as any) if (r.status) expect((r.status_citations ?? []).length, r.instrument_id).toBeGreaterThan(0);
  });
});
