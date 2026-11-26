// Pins /mechanism/coverage.json to its producer and every count in it to the bytes it was read from.
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
// @ts-expect-error: plain ESM script, no type declarations
import { derive, serialise, nodeIo, articlesIn, corpusRoot, routeFiles, readInventory, SOURCE, OUTPUT, PROVISION_ID_RE } from "./build-coverage.mjs";
// @ts-expect-error: plain ESM script, no type declarations
import { derive as deriveSidecar, serialise as serialiseSidecar, OUTPUT as SIDECAR, CAPSULE_ROOT, MAP as CAPSULE_MAP } from "./backfill-capsule-provisions.mjs";
import { gzipSync } from "node:zlib";

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

  it("the source-bytes state comes from the published texts: an edited text fails the producer", () => {
    const io = nodeIo(ROOT);
    const src = readJson(SOURCE);
    expect(out.corpus.source_database_state).toBe("SOURCE_BYTES_RECOVERED");
    expect(out.corpus.inventory_source_database_state).toBe(inventory.frozen_provisions.source_database_state);
    const edited = {
      ...io,
      readBytes: (p: string) => {
        if (p !== src.sources.source_texts) return io.readBytes(p);
        const lines = io.readBytes(p).toString("utf8").split("\n");
        const r = JSON.parse(lines[0]);
        r.text = `${r.text} `.replace(/a/, "b");
        lines[0] = JSON.stringify(r);
        return Buffer.from(lines.join("\n"));
      },
    };
    expect(() => derive(read(SOURCE), edited)).toThrow(/does not reproduce the manifest/);
    const without = { ...src, sources: { ...src.sources, source_texts: undefined } };
    const prior = derive(Buffer.from(JSON.stringify(without)), io);
    expect(prior.corpus.source_database_state).toBe(inventory.frozen_provisions.source_database_state);
    expect(prior.corpus.source_texts).toBeNull();
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

describe("mechanism coverage derives CAPSULE_BOUND", () => {
  type Io = { readBytes: (p: string) => Buffer; exists: (p: string) => boolean; listDirs: (p: string) => string[]; readText: (p: string) => string; readJson: (p: string) => unknown };
  type Adapter = { n_capsules: number; capsules_binding_a_provision: number; capsules_bound_by_sidecar: number; provision_map: string };

  it("is the sum of in-capsule and sidecar bindings over the published batches, and the source file types no count", () => {
    const cb = out.capsule_binding;
    const adapters = out.capsule_adapters as Adapter[];
    const inCapsule = adapters.reduce((a, b) => a + b.capsules_binding_a_provision, 0);
    const bySidecar = adapters.reduce((a, b) => a + b.capsules_bound_by_sidecar, 0);
    expect(cb.bound_in_capsule).toBe(inCapsule);
    expect(cb.bound_by_sidecar).toBe(bySidecar);
    expect(cb.CAPSULE_BOUND).toBe(inCapsule + bySidecar);
    expect(cb.capsules).toBe(adapters.reduce((a, b) => a + b.n_capsules, 0));
    expect(cb.state).toBe(cb.CAPSULE_BOUND ? "CAPSULE_BOUND" : "NO_CAPSULE_BOUND");
    const sidecar = readJson(SIDECAR);
    expect(cb.bound_by_sidecar).toBe(sidecar.totals.bound_by_sidecar);
    expect(cb.sidecar.sha256).toBe(createHash("sha256").update(read(SIDECAR)).digest("hex"));
    expect(JSON.stringify(readJson(SOURCE))).not.toMatch(/CAPSULE_BOUND|capsule_binding/);
  });

  it("a sidecar that is not the backfill producer's output fails the producer", () => {
    const io: Io = nodeIo(ROOT);
    const edited: Io = {
      ...io,
      readBytes: (p) => {
        if (p !== SIDECAR) return io.readBytes(p);
        const d = JSON.parse(io.readBytes(p).toString("utf8"));
        d.totals.bound_by_sidecar += 1;
        return Buffer.from(serialiseSidecar(d));
      },
    };
    expect(() => derive(read(SOURCE), edited)).toThrow(/capsule-provision-bindings\.json is stale/);
  });

  it("a published batch of a mapped kind raises CAPSULE_BOUND by its capsules, through the sidecar", () => {
    const io: Io = nodeIo(ROOT);
    const map = readJson(CAPSULE_MAP);
    const kind = map.mappings.find((m: { source: string }) => m.source === "route").kind;
    const caps = [1, 2].map((i) => ({ schema: "csoai.measurement-capsule/0.2", kind, capsule_id: `${i}`.padStart(64, "b") }));
    const gz = gzipSync(Buffer.from(caps.map((c) => `${JSON.stringify(c)}\n`).join("")));
    const dir = `${CAPSULE_ROOT}/zz_route_fixture`;
    const rec = Buffer.from(JSON.stringify({ adapter: "route_fixture", kind, capsule_schema: "csoai.measurement-capsule/0.2", n_capsules: 2, merkle_root: "e".repeat(64), capsules_file: { path: "capsules.jsonl.gz", sha256: createHash("sha256").update(gz).digest("hex") } }));
    let sidecar: Buffer | null = null;
    const next: Io = {
      ...io,
      listDirs: (p) => (p === CAPSULE_ROOT ? [...io.listDirs(p), "zz_route_fixture"] : io.listDirs(p)),
      exists: (p) => p === `${dir}/record.json` || io.exists(p),
      readBytes: (p) => (p === `${dir}/record.json` ? rec : p === `${dir}/capsules.jsonl.gz` ? gz : p === SIDECAR && sidecar ? sidecar : io.readBytes(p)),
    };
    sidecar = Buffer.from(serialiseSidecar(deriveSidecar(next)));
    const d = derive(read(SOURCE), next);
    expect(d.capsule_binding.CAPSULE_BOUND).toBe(out.capsule_binding.CAPSULE_BOUND + 2);
    expect(d.capsule_binding.state).toBe("CAPSULE_BOUND");
    const row = d.capsule_adapters.find((a: { batch: string }) => a.batch === "zz_route_fixture");
    expect([row.capsules_binding_a_provision, row.capsules_bound_by_sidecar]).toEqual([0, 2]);
    expect(d.capsule_binding.provision_ids_bound).toEqual(expect.arrayContaining(map.mappings.filter((m: { kind: string }) => m.kind === kind).map((m: { provision_id: string }) => m.provision_id)));
  });
});
