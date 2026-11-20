#!/usr/bin/env node
// Verifies the published source texts of the frozen provision corpus against the frozen manifest.
//
// Reads public/interop/frozen-provision-sources-v1.jsonl (one row per provision) and
// public/interop/frozen-provision-hashes.json, recomputes every provision hash from its text with
// normaliser v1.0.0 and the corpus root, and fails unless all of them reproduce. The coverage
// producer (build-coverage.mjs) calls verifySources() and reports the source-bytes state from its
// result, so the state on /mechanism/ is derived from these bytes, not typed.
//
//   node scripts/mechanism/frozen-sources.mjs          verify and print a summary
//
// The same check in Python, with the original normaliser: scripts/mechanism/verify_frozen_sources.py
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NORMALISER_VERSION, corpusRoot, provisionHash } from "./normaliser-v1.mjs";

export const SOURCES = "public/interop/frozen-provision-sources-v1.jsonl";
export const MANIFEST = "public/interop/frozen-provision-hashes.json";
/** Rows whose text is exactly this long were cut there before hashing; the hash covers the cut text. */
export const FROZEN_TEXT_CAP = 10000;

export function parseSources(bytes) {
  return bytes
    .toString("utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l, i) => {
      try {
        return JSON.parse(l);
      } catch {
        throw new Error(`${SOURCES}: line ${i + 1} is not JSON`);
      }
    });
}

/** Every check that decides the state. Returns a report; `ok` is true only if nothing failed. */
export function verifySources(rows, manifest) {
  const anchors = manifest.anchors || {};
  const problems = [];
  const recomputed = {};
  const bySourceKind = {};
  const atCap = [];
  for (const r of rows) {
    const pid = r.provision_id;
    if (Object.hasOwn(recomputed, pid)) problems.push(`${pid}: more than one row`);
    if (r.normaliser_version !== NORMALISER_VERSION) problems.push(`${pid}: normaliser_version ${r.normaliser_version}`);
    if (typeof r.text !== "string") {
      problems.push(`${pid}: no text`);
      continue;
    }
    const h = provisionHash(r.text);
    recomputed[pid] = h;
    if (h !== r.provision_sha256) problems.push(`${pid}: text hashes to ${h}, row says ${r.provision_sha256}`);
    if (anchors[pid] !== h) problems.push(`${pid}: text hash is not the manifest anchor`);
    const kind = r.source?.kind ?? "UNSTATED";
    bySourceKind[kind] = (bySourceKind[kind] ?? 0) + 1;
    if ([...r.text].length === FROZEN_TEXT_CAP) atCap.push(pid);
  }
  for (const pid of Object.keys(anchors)) if (!Object.hasOwn(recomputed, pid)) problems.push(`${pid}: in the manifest, no source row`);
  for (const pid of Object.keys(recomputed)) if (!Object.hasOwn(anchors, pid)) problems.push(`${pid}: source row, not in the manifest`);
  const root = corpusRoot(recomputed);
  if (root !== manifest.corpus_root) problems.push(`corpus root from texts ${root} is not the manifest's ${manifest.corpus_root}`);
  const reproduced = Object.entries(recomputed).filter(([pid, h]) => anchors[pid] === h).length;
  return {
    ok: problems.length === 0,
    rows: rows.length,
    manifest_provisions: Object.keys(anchors).length,
    hashes_reproduced: reproduced,
    corpus_root: root,
    corpus_root_reproduced: root === manifest.corpus_root,
    normaliser_version: NORMALISER_VERSION,
    rows_by_source_kind: Object.fromEntries(Object.entries(bySourceKind).sort()),
    texts_at_frozen_cap: atCap.sort(),
    problems,
  };
}

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const bytes = readFileSync(join(root, SOURCES));
  const manifest = JSON.parse(readFileSync(join(root, MANIFEST), "utf8"));
  const report = { sources: SOURCES, sources_sha256: createHash("sha256").update(bytes).digest("hex"), ...verifySources(parseSources(bytes), manifest) };
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
