// Pins /mechanism/coverage.json to its producer and every count in it to the bytes it was read from.
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
// @ts-expect-error: plain ESM script, no type declarations
import { derive, serialise, nodeIo, articlesIn, corpusRoot, routeFiles, readInventory, SOURCE, OUTPUT, PROVISION_ID_RE } from "./build-coverage.mjs";

const ROOT = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p));
const readJson = (p: string) => JSON.parse(read(p).toString("utf8"));
const out = readJson(OUTPUT);
const manifest = readJson("public/interop/frozen-provision-hashes.json");
// The current stamped version, through the pointer: the 2026-09-10 snapshot is frozen history.
const inventory = readInventory("public/interop/regulatory-inventory-latest.json", nodeIo(ROOT));

describe("mechanism coverage", () => {
  it("committed JSON is exactly the producer's output", () => {
    expect(read(OUTPUT).toString("utf8")).toBe(serialise(derive(read(SOURCE), nodeIo(ROOT))));
  });

  it("the manifest's corpus root recomputes and the inventory pins the manifest bytes", () => {
    expect(corpusRoot(manifest.anchors)).toBe(manifest.corpus_root);
    expect(createHash("sha256").update(read("public/interop/frozen-provision-hashes.json")).digest("hex")).toBe(
      inventory.frozen_provisions.evidence_sha256,
    );
    expect(out.corpus.corpus_root).toBe(manifest.corpus_root);
  });

  it("counts are the data's, not the directive's", () => {
    const byWhat = Object.fromEntries(out.recovered_counts.map((r: { what: string; value: number }) => [r.what, r.value]));
    expect(byWhat["provision hashes"]).toBe(Object.keys(manifest.anchors).length);
    expect(byWhat["authority-routing records"]).toBe(inventory.authority_adapters.length);
    expect(byWhat["crosswalk assets"]).toBe(inventory.crosswalk_assets.length);
    expect(byWhat["instruments with provisions in the manifest"]).toBe(
      new Set(Object.keys(manifest.anchors).map((k) => k.split(":")[0])).size,
    );
    const sum = out.instruments.reduce((n: number, i: { provisions: number }) => n + i.provisions, 0);
    expect(sum).toBe(out.corpus.provisions);
    const statusSum = Object.values(out.totals as Record<string, number>).reduce((a, b) => a + b, 0);
    expect(statusSum).toBe(out.corpus.provisions);
  });

  it("every provision it lists is in the manifest with the manifest's hash", () => {
    for (const p of out.provisions_touched) expect(manifest.anchors[p.provision_id]).toBe(p.provision_sha256);
  });

  it("the article parser reads ranges and single articles and leaves annexes unresolved", () => {
    expect(articlesIn("Annex III high-risk safety obligations (Arts 8–15)")).toEqual({
      articles: ["8", "9", "10", "11", "12", "13", "14", "15"],
      unresolved: ["Annex III"],
    });
    expect(articlesIn("Article 5(1)(b) — exploitation").articles).toEqual(["5"]);
    expect(articlesIn("Art. 12").articles).toEqual(["12"]);
    expect(articlesIn("GOVERN core function").articles).toEqual([]);
  });

  it("every route the report names is a route App.tsx serves", () => {
    const rf = routeFiles(read("client/src/App.tsx").toString("utf8"));
    for (const j of out.jurisdictions)
      for (const p of j.prose_pages) {
        const r = rf.get(p.path.replace(/\/$/, ""));
        expect(r, p.path).toBeTruthy();
        expect(r.file && existsSync(join(ROOT, r.file)), p.path).toBeTruthy();
      }
    expect(rf.get("/mechanism")?.component).toBe("Mechanism");
  });

  it("only the manifest itself cites frozen provision ids among the files the report reads", () => {
    const src = readJson(SOURCE);
    for (const f of [...Object.values(src.sources as Record<string, string>)].filter((f) => f.endsWith(".json") || f.endsWith(".tsx"))) {
      if (f === src.sources.manifest) continue;
      expect((read(f).toString("utf8").match(PROVISION_ID_RE) || []).length, f).toBe(0);
    }
  });

  it("names nothing it must not: no internal codename, no certify wording in our own statements", () => {
    const text = JSON.stringify(out).toLowerCase();
    for (const bad of ["venturi", "pontius", "sovos", "laputa", "defoneos"]) expect(text).not.toContain(bad);
    for (const s of out.statements as string[]) expect(s).not.toMatch(/\bcertif(y|ied)\b/i);
  });

  it("a stale or tampered input fails the producer", () => {
    const io = nodeIo(ROOT);
    const tampered = {
      ...io,
      readBytes: (p: string) => {
        if (p !== "public/interop/frozen-provision-hashes.json") return io.readBytes(p);
        const m = JSON.parse(io.readBytes(p).toString("utf8"));
        const k = Object.keys(m.anchors).sort()[0];
        m.anchors[k] = "0".repeat(64);
        return Buffer.from(JSON.stringify(m));
      },
    };
    expect(() => derive(read(SOURCE), tampered)).toThrow(/corpus_root does not recompute/);
  });
});

describe("mechanism coverage reads the inventory through its pointer", () => {
  const io = nodeIo(ROOT);
  const pointerPath = "public/interop/regulatory-inventory-latest.json";
  const pointer = readJson(pointerPath);
  const withPointer = (patch: Record<string, unknown>) => ({
    ...io,
    readJson: (p: string) => (p === pointerPath ? { ...pointer, ...patch } : io.readJson(p)),
  });

  it("reads exactly the stamped version the pointer selects, never the frozen snapshot by name", () => {
    const viaPointer = readInventory(pointerPath, io);
    expect(createHash("sha256").update(read(pointer.index_url.replace(/^\//, "public/"))).digest("hex")).toBe(pointer.index_sha256);
    expect(viaPointer).toEqual(readJson(pointer.index_url.replace(/^\//, "public/")));
  });

  it("fails closed on a pointer whose digest does not name those bytes, or that leaves the versioned set", () => {
    expect(() => readInventory(pointerPath, withPointer({ index_sha256: "0".repeat(64) }))).toThrow(/is not the bytes/);
    expect(() => readInventory(pointerPath, withPointer({ index_url: "/interop/../signed/x.json" }))).toThrow(/outside the versioned/);
  });
});
