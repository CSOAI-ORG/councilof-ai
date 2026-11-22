#!/usr/bin/env node
// Producer for /mechanism/capsule-provision-bindings.json: the provision bindings of capsules that were
// published before they could carry one, held BESIDE the signed batches, never in them.
//
// A published capsule is signed bytes under a Merkle root, so it is never re-emitted to add the optional 0.3
// `provisions` field. This sidecar names, per published batch, the capsules the committed backfill map
// (public/mechanism/capsule-provision-map.json) binds and the pinned binding rows, and pins the batch it read:
// its record.json bytes, Merkle root and capsules-file digest. The match rule is the capsule producer's own
// (packages/venturi-capsule/provision_binding.py): a mapping with source "adapter" matches the batch adapter,
// a mapping with source "route" matches the capsule kind. Unmapped and unclassified adapters bind nothing.
//
// Reads:  the map, the frozen provision manifest, every published v0.2 capsule batch.
// Output: public/mechanism/capsule-provision-bindings.json. No clock time: unchanged inputs give identical bytes.
//
//   node scripts/mechanism/backfill-capsule-provisions.mjs          write
//   node scripts/mechanism/backfill-capsule-provisions.mjs --check  exit 1 if the committed file is stale
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const PRODUCER = "scripts/mechanism/backfill-capsule-provisions.mjs";
export const OUTPUT = "public/mechanism/capsule-provision-bindings.json";
export const MAP = "public/mechanism/capsule-provision-map.json";
export const MANIFEST = "public/interop/frozen-provision-hashes.json";
export const CAPSULE_ROOT = "public/measurement-capsules/v0.2";
export const SCHEMA_03 = "csoai.measurement-capsule/0.3";
const PROVISION_ID = /^3\d{4}[RLD]\d{4}:-?\d+$/;
const HEX64 = /^[0-9a-f]{64}$/;
const RELATIONS = ["PREDICATE", "RELEVANT_TO"];
const KEYS = "corpus_root,provision_id,provision_sha256,relation";

const fail = (msg) => {
  throw new Error(`capsule provision backfill: ${msg}`);
};
const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const publicPath = (p) => `/${p.replace(/^public\//, "")}`;

/** Problems with a binding list against the manifest; [] when every row is well formed and pinned. */
export function bindingProblems(provisions, capsuleSchema, manifest) {
  if (capsuleSchema !== SCHEMA_03) return [`a provisions binding is defined only for ${SCHEMA_03}`];
  if (!Array.isArray(provisions) || provisions.length === 0 || provisions.length > 64) return ["provisions must hold 1 to 64 rows"];
  const out = [];
  const seen = new Set();
  provisions.forEach((b, i) => {
    if (!b || typeof b !== "object" || Array.isArray(b) || Object.keys(b).sort().join() !== KEYS) return void out.push(`[${i}] shape`);
    if (!PROVISION_ID.test(b.provision_id) || !HEX64.test(b.provision_sha256) || !HEX64.test(b.corpus_root) || !RELATIONS.includes(b.relation))
      out.push(`[${i}] field`);
    if (seen.has(`${b.provision_id}|${b.relation}`)) out.push(`[${i}] repeated`);
    seen.add(`${b.provision_id}|${b.relation}`);
    if (manifest.anchors[b.provision_id] !== b.provision_sha256) out.push(`[${i}] ${b.provision_id} is not pinned to the manifest anchor`);
    if (b.corpus_root !== manifest.corpus_root) out.push(`[${i}] corpus_root is not the manifest's root`);
  });
  return out;
}

/** MAPPED, UNMAPPED (listed with a reason) or UNCLASSIFIED (the map does not name the adapter). */
export function classify(adapter, map) {
  if (map.mappings.some((m) => m.source === "adapter" && m.kind === adapter)) return "MAPPED";
  if (map.unmapped_adapters.some((u) => u.adapter === adapter)) return "UNMAPPED";
  return "UNCLASSIFIED";
}

/** The binding rows the map gives a capsule of this adapter and kind, sorted by (provision_id, relation). */
export function bindingsFor(adapter, kind, map, manifest) {
  const rows = new Map();
  for (const m of map.mappings) {
    if (!((m.source === "adapter" && m.kind === adapter) || (m.source === "route" && m.kind === kind))) continue;
    const anchor = manifest.anchors[m.provision_id];
    if (!anchor || anchor !== m.provision_sha256) fail(`map row ${m.provision_id} is not pinned to the frozen manifest`);
    rows.set(`${m.provision_id}|${m.relation}`, { corpus_root: manifest.corpus_root, provision_id: m.provision_id, provision_sha256: anchor, relation: m.relation });
  }
  return [...rows.keys()].sort().map((k) => rows.get(k));
}

export function derive(io) {
  const mapBytes = io.readBytes(MAP);
  const manifestBytes = io.readBytes(MANIFEST);
  const map = JSON.parse(mapBytes.toString("utf8"));
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  if (map.corpus_root !== manifest.corpus_root) fail("map corpus_root is not the frozen manifest's root");

  const batches = io
    .listDirs(CAPSULE_ROOT)
    .filter((d) => io.exists(`${CAPSULE_ROOT}/${d}/record.json`))
    .sort()
    .map((d) => {
      const dir = `${CAPSULE_ROOT}/${d}`;
      const recBytes = io.readBytes(`${dir}/record.json`);
      const rec = JSON.parse(recBytes.toString("utf8"));
      const gz = io.readBytes(`${dir}/${rec.capsules_file.path}`);
      if (sha256(gz) !== rec.capsules_file.sha256) fail(`${dir}: capsules file sha256 does not match its record`);
      const classification = classify(rec.adapter, map);
      let n = 0;
      let inCapsule = 0;
      const ids = new Set();
      const bindings = [];
      for (const line of gunzipSync(gz).toString("utf8").split("\n")) {
        if (!line.trim()) continue;
        n++;
        const c = JSON.parse(line);
        if (ids.has(c.capsule_id)) fail(`${dir}: capsule ${c.capsule_id} appears twice`);
        ids.add(c.capsule_id);
        if (c.provisions !== undefined) {
          const bad = bindingProblems(c.provisions, c.schema, manifest);
          if (bad.length) fail(`${dir}: capsule ${c.capsule_id} carries a binding that is not pinned: ${bad.slice(0, 2).join("; ")}`);
          inCapsule++;
          continue;
        }
        const rows = bindingsFor(rec.adapter, c.kind, map, manifest);
        if (rows.length) bindings.push({ capsule_id: c.capsule_id, provisions: rows });
      }
      if (n !== rec.n_capsules) fail(`${dir}: ${n} capsules read, record says ${rec.n_capsules}`);
      bindings.sort((a, b) => (a.capsule_id < b.capsule_id ? -1 : a.capsule_id > b.capsule_id ? 1 : 0));
      return {
        batch: d,
        adapter: rec.adapter,
        kind: rec.kind,
        classification,
        record: { path: publicPath(`${dir}/record.json`), sha256: sha256(recBytes) },
        merkle_root: rec.merkle_root,
        capsules_file_sha256: rec.capsules_file.sha256,
        n_capsules: n,
        bound_in_capsule: inCapsule,
        bound_by_sidecar: bindings.length,
        provision_ids: [...new Set(bindings.flatMap((b) => b.provisions.map((p) => p.provision_id)))].sort(),
        bindings,
      };
    });

  const sum = (k) => batches.reduce((a, b) => a + b[k], 0);
  return {
    schema: "csoai.capsule-provision-bindings/0.1",
    what_this_is:
      "The provision bindings of published capsules, held beside their signed batches. Each row names a capsule by capsule_id inside a batch pinned by its record bytes and Merkle root, with the binding rows the backfill map gives it, each pinned to the frozen provision manifest.",
    what_this_is_not:
      "Not a re-emission of any capsule: no published capsule, batch, Merkle root or signature changes. Not a finding that a capsule measures what a provision requires, and never a compliance determination.",
    rule: "A capsule is bound when the backfill map maps its producer: a mapping with source adapter matches the batch adapter, a mapping with source route matches the capsule kind. Capsules that already carry the 0.3 provisions field are counted as bound in the capsule and are not repeated here. Unmapped and unclassified adapters bind nothing.",
    generated_from: {
      producer: PRODUCER,
      map: { path: publicPath(MAP), sha256: sha256(mapBytes) },
      manifest: { path: publicPath(MANIFEST), sha256: sha256(manifestBytes), corpus_root: manifest.corpus_root },
      capsule_root: publicPath(CAPSULE_ROOT),
    },
    totals: {
      batches: batches.length,
      capsules: sum("n_capsules"),
      bound_in_capsule: sum("bound_in_capsule"),
      bound_by_sidecar: sum("bound_by_sidecar"),
    },
    batches,
  };
}

export const serialise = (obj) => `${JSON.stringify(obj, null, 2)}\n`;

export function nodeIo(root = ROOT) {
  return {
    readBytes: (p) => readFileSync(join(root, p)),
    exists: (p) => existsSync(join(root, p)),
    listDirs: (p) =>
      readdirSync(join(root, p), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name),
  };
}

function main() {
  const out = serialise(derive(nodeIo()));
  const target = join(ROOT, OUTPUT);
  if (process.argv.includes("--check")) {
    const have = existsSync(target) ? readFileSync(target, "utf8") : "";
    if (have !== out) {
      console.error(`${OUTPUT} is stale: run node ${PRODUCER}`);
      process.exit(1);
    }
    console.log(`${OUTPUT} is current`);
    return;
  }
  writeFileSync(target, out);
  const d = JSON.parse(out);
  console.log(JSON.stringify(d.totals));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
