// The capsule-provision sidecar is derived, deterministic and beside the signed batches: it never edits one.
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
// @ts-expect-error: plain ESM script, no type declarations
import { derive, serialise, nodeIo, classify, bindingsFor, OUTPUT, MAP, MANIFEST, CAPSULE_ROOT, SCHEMA_03 } from "./backfill-capsule-provisions.mjs";
import { checkProvisionBinding } from "../../functions/_lib/provisionBinding";

type Io = { readBytes: (p: string) => Buffer; exists: (p: string) => boolean; listDirs: (p: string) => string[] };
type Row = { capsule_id: string; provisions: { provision_id: string; provision_sha256: string; corpus_root: string; relation: string }[] };
type Batch = {
  batch: string; adapter: string; kind: string; classification: string; record: { path: string; sha256: string }; merkle_root: string;
  capsules_file_sha256: string; n_capsules: number; bound_in_capsule: number; bound_by_sidecar: number; provision_ids: string[]; bindings: Row[];
};

const ROOT = join(__dirname, "..", "..");
const io: Io = nodeIo(ROOT);
const readJson = (p: string) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const sha = (b: Buffer | string) => createHash("sha256").update(b).digest("hex");
const map = readJson(MAP);
const manifest = readJson(MANIFEST);
const routeKind: string = map.mappings.find((m: { source: string }) => m.source === "route").kind;

/** io plus one synthetic published batch (record.json + capsules.jsonl.gz) under the capsule root. */
function withBatch(base: Io, name: string, adapter: string, kind: string, caps: object[]) {
  const gz = gzipSync(Buffer.from(caps.map((c) => `${JSON.stringify(c)}\n`).join("")));
  const rec = { adapter, kind, n_capsules: caps.length, merkle_root: "e".repeat(64), capsules_file: { path: "capsules.jsonl.gz", sha256: sha(gz) } };
  const dir = `${CAPSULE_ROOT}/${name}`;
  const recBytes = Buffer.from(JSON.stringify(rec));
  const next: Io = {
    listDirs: (p) => (p === CAPSULE_ROOT ? [...base.listDirs(p), name] : base.listDirs(p)),
    exists: (p) => p === `${dir}/record.json` || base.exists(p),
    readBytes: (p) => (p === `${dir}/record.json` ? recBytes : p === `${dir}/capsules.jsonl.gz` ? gz : base.readBytes(p)),
  };
  return { io: next, gz, recBytes };
}
const capsule = (kind: string, i: number, extra: object = {}) => ({ schema: "csoai.measurement-capsule/0.2", kind, capsule_id: `${i}`.padStart(64, "a"), ...extra });

describe("capsule-provision sidecar", () => {
  const out = derive(io);

  it("the committed sidecar is exactly the producer's output, and a second run gives the same bytes", () => {
    expect(readFileSync(join(ROOT, OUTPUT), "utf8")).toBe(serialise(out));
    expect(serialise(derive(io))).toBe(serialise(out));
    expect(serialise(out)).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/); // no clock time
  });

  it("pins every published batch it read by record bytes, Merkle root and capsules file, and covers them all", () => {
    const dirs = io.listDirs(CAPSULE_ROOT).filter((d) => io.exists(`${CAPSULE_ROOT}/${d}/record.json`)).sort();
    expect(out.batches.map((b: Batch) => b.batch)).toEqual(dirs);
    for (const b of out.batches as Batch[]) {
      const recBytes = io.readBytes(`${CAPSULE_ROOT}/${b.batch}/record.json`);
      const rec = JSON.parse(recBytes.toString("utf8"));
      expect(b.record.sha256, b.batch).toBe(sha(recBytes));
      expect(b.merkle_root).toBe(rec.merkle_root);
      expect(b.capsules_file_sha256).toBe(sha(io.readBytes(`${CAPSULE_ROOT}/${b.batch}/${rec.capsules_file.path}`)));
      expect(b.n_capsules).toBe(rec.n_capsules);
      expect(b.bound_by_sidecar).toBe(b.bindings.length);
    }
    expect(out.totals.capsules).toBe((out.batches as Batch[]).reduce((a, b) => a + b.n_capsules, 0));
  });

  it("binds only what the map maps: unmapped adapters (a2a_card and claim_watch among them) bind nothing", () => {
    for (const a of ["a2a_card", "claim_watch"]) {
      expect(classify(a, map)).toBe("UNMAPPED");
      expect(bindingsFor(a, `measurement.${a}`, map, manifest)).toEqual([]);
    }
    for (const b of out.batches as Batch[]) {
      expect(b.classification, b.batch).toBe(classify(b.adapter, map));
      if (b.classification !== "MAPPED" && b.kind !== routeKind) expect(b.bindings, b.batch).toEqual([]);
    }
    expect(classify("no_such_adapter", map)).toBe("UNCLASSIFIED");
  });

  it("a published batch of a mapped kind is bound in the sidecar, pinned, and its bytes are untouched", () => {
    const caps = [capsule(routeKind, 2), capsule(routeKind, 1), capsule(routeKind, 3)];
    const { io: next, gz, recBytes } = withBatch(io, "zz_route_fixture", "route_fixture", routeKind, caps);
    const gzBefore = Buffer.from(gz);
    const d = derive(next);
    const b = (d.batches as Batch[]).find((x) => x.batch === "zz_route_fixture")!;
    expect(b.bound_by_sidecar).toBe(3);
    expect(b.bindings.map((r) => r.capsule_id)).toEqual([...caps.map((c) => c.capsule_id)].sort());
    for (const r of b.bindings) expect(checkProvisionBinding(r.provisions, SCHEMA_03).state).toBe("PINNED");
    expect(b.provision_ids).toEqual([...new Set(map.mappings.filter((m: { kind: string }) => m.kind === routeKind).map((m: { provision_id: string }) => m.provision_id))].sort());
    expect(d.totals.bound_by_sidecar).toBe(out.totals.bound_by_sidecar + 3);
    expect(gz.equals(gzBefore)).toBe(true);
    expect(b.record.sha256).toBe(sha(recBytes));
  });

  it("a capsule that already carries a pinned binding counts in the capsule; an unpinned one fails the producer", () => {
    const pinned = bindingsFor(null, routeKind, map, manifest);
    const good = capsule(routeKind, 7, { schema: SCHEMA_03, provisions: pinned });
    const d = derive(withBatch(io, "zz_bound", "route_fixture", routeKind, [good]).io);
    const b = (d.batches as Batch[]).find((x) => x.batch === "zz_bound")!;
    expect([b.bound_in_capsule, b.bound_by_sidecar]).toEqual([1, 0]);
    const bad = capsule(routeKind, 8, { schema: SCHEMA_03, provisions: [{ ...pinned[0], provision_sha256: "0".repeat(64) }] });
    expect(() => derive(withBatch(io, "zz_bad", "route_fixture", routeKind, [bad]).io)).toThrow(/not pinned/);
  });

  it("a map not pinned to the frozen manifest, or a batch whose file does not match its record, fails", () => {
    const tampered: Io = {
      ...io,
      readBytes: (p) => (p === MAP ? Buffer.from(JSON.stringify({ ...map, corpus_root: "0".repeat(64) })) : io.readBytes(p)),
    };
    expect(() => derive(tampered)).toThrow(/corpus_root/);
    const { io: next } = withBatch(io, "zz_swap", "route_fixture", routeKind, [capsule(routeKind, 1)]);
    const swapped: Io = { ...next, readBytes: (p) => (p.endsWith("zz_swap/capsules.jsonl.gz") ? gzipSync(Buffer.from("{}\n")) : next.readBytes(p)) };
    expect(() => derive(swapped)).toThrow(/does not match its record/);
  });
});
