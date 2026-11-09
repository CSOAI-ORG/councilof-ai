#!/usr/bin/env node
// Build ONE queryable fact table from the per-cell mill evidence.
//
// WHY
// ---
// The estate holds every measurement, but not as a table. The per-cell evidence lives in
// public/interop/mill-evidence/ as 664 `items-<axis>-<hash>.jsonl` files: one file per
// (model, axis) cell, the model named INSIDE the file, the axis truncated to eight
// characters in the FILENAME, and four different schema versions across the corpus.
//
// So a consumer who wants "how did model X do on axis Y" cannot find the cell without
// opening every file, cannot join the cells without reading all of them, and cannot tell
// from a filename which model a cell belongs to. The published projection
// (csoai/gspc-peritem-rows-2026-08-12, 15,580 rows, 19 models) is a LOSSY, FROZEN subset:
// it drops the prompt, the model revision, the provider route and the elapsed time, and it
// has not moved with the root.
//
// This producer joins the cells into three tables and nothing else:
//   gspc_measurements/part-NNN.jsonl  the long fact table: one row per (model, axis, item),
//                                      written in PARTS because Cloudflare Pages refuses a
//                                      file over 25 MiB and this table grows with every card
//                                      the mill lands; the MANIFEST names the parts
//   gspc_items.jsonl                  the item universe: one row per (axis, item)
//   gspc_cells.jsonl                  the cell index: one row per evidence file, with its digest
//
// It copies no number it did not read. The canary marker files (bank-*.jsonl) are NOT
// measurement rows and are not read as such.
//
//   node scripts/measurements/build-gspc-fact-table.mjs --out public/interop/gspc-fact-table
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(new URL("../../", import.meta.url).pathname);
const sha = (b) => createHash("sha256").update(b).digest("hex");

// Cloudflare Pages refuses a file larger than 25 MiB. The measurements table grows with every
// card the mill lands, so it is written in parts of at most this many bytes each.
const SHARD_BYTES = 8 * 1024 * 1024;

// The filename carries the axis truncated to eight characters; the row usually carries the
// full name. Where the row has none, this is the only way to attribute the cell.
const FILENAME_AXIS = {
  affect: "affect", "art5-saf": "art5-safeguard", care: "care", conforma: "conformance",
  continui: "continuity", "cross-re": "cross-reality", detector: "detector-interop",
  governan: "governance", machiner: "machinery-conformity", openness: "openness",
  provenan: "provenance", safety: "safety", swarm: "swarm", asi: "cross-reality",
  agi: "safety", gov: "governance", mach: "machinery-conformity", mcp: "conformance",
  oss: "openness", prv: "provenance", art5: "art5-safeguard", det: "detector-interop",
  xr: "cross-reality",
};

const asBool = (v) => (v === true || v === "true" ? true : v === false || v === "false" ? false : null);

function readCells(dir) {
  const cells = [];
  for (const name of readdirSync(dir).sort()) {
    if (!name.startsWith("items-") || !name.endsWith(".jsonl")) continue;
    const raw = readFileSync(path.join(dir, name));
    const token = name.slice("items-".length, name.length - ".jsonl".length).replace(/-[0-9a-f]+$/, "");
    const rows = [];
    for (const line of raw.toString("utf8").split("\n")) {
      if (!line.trim()) continue;
      try { rows.push(JSON.parse(line)); } catch { /* a malformed line is a finding, not a row */ }
    }
    cells.push({ name, digest: sha(raw), rows, filenameAxis: FILENAME_AXIS[token] || null });
  }
  return cells;
}

/**
 * Write rows into parts of at most SHARD_BYTES, and return their descriptors.
 *
 * A part is named `<name>/part-000.jsonl`, `part-001.jsonl`, ... The rows are written in the
 * order they come, so the table IS the concatenation of the parts in name order. Each
 * descriptor names the file, the rows it holds and its byte length, and the MANIFEST carries
 * them: a reader is told which files to read rather than left to guess.
 *
 * The pre-shard single file is removed: it is the same rows twice, and it is the file that
 * broke the Pages per-file cap.
 */
function writeShards(target, name, rows) {
  const dir = path.join(target, name);
  rmSync(dir, { recursive: true, force: true });
  rmSync(path.join(target, name + ".jsonl"), { force: true });
  mkdirSync(dir, { recursive: true });
  const parts = [];
  let current = [];
  let currentBytes = 0;
  const flush = () => {
    if (!current.length) return;
    const file = `${name}/part-${String(parts.length).padStart(3, "0")}.jsonl`;
    const body = current.map((r) => JSON.stringify(r)).join("\n") + "\n";
    writeFileSync(path.join(target, file), body);
    parts.push({ file, rows: current.length, bytes: Buffer.byteLength(body) });
    current = [];
    currentBytes = 0;
  };
  for (const row of rows) {
    const bytes = Buffer.byteLength(JSON.stringify(row)) + 1;
    if (current.length && currentBytes + bytes > SHARD_BYTES) flush();
    current.push(row);
    currentBytes += bytes;
  }
  flush();
  if (!parts.length) {
    // An empty table still has a layout: one empty part, so a reader finds a file.
    const file = `${name}/part-000.jsonl`;
    writeFileSync(path.join(target, file), "");
    parts.push({ file, rows: 0, bytes: 0 });
  }
  return parts;
}

function main(argv) {
  const args = Object.fromEntries(
    argv.slice(2).join(" ").split("--").filter(Boolean)
      .map((s) => s.trim().split(/\s+/)).map(([k, ...v]) => [k, v.join(" ") || true]));
  const check = args.check === true || args.check === "true";
  const out = path.resolve(args.out || path.join(ROOT, "public/interop/gspc-fact-table"));
  const evidence = path.resolve(args.evidence || path.join(ROOT, "public/interop/mill-evidence"));
  if (!existsSync(evidence)) {
    console.error("no evidence directory at " + evidence);
    return 2;
  }
  let scratch = null;
  let target = out;
  if (check) {
    scratch = mkdtempSync(path.join(tmpdir(), "gspc-fact-table-"));
    target = path.join(scratch, "table");
  }
  mkdirSync(target, { recursive: true });

  const cells = readCells(evidence);
  const measurements = [];
  const items = new Map();          // axis|item_id -> item row
  const cellRows = [];
  let malformed = 0;
  let unattributedModel = 0;
  let unattributedAxis = 0;
  let ungraded = 0;

  for (const cell of cells) {
    const axes = new Set();
    const models = new Set();
    let nOk = 0;
    let nGraded = 0;
    let nUngraded = 0;
    let nSkipped = 0;
    for (const r of cell.rows) {
      const axis = typeof r.axis === "string" && r.axis ? r.axis : cell.filenameAxis;
      if (!axis) { unattributedAxis++; nSkipped++; continue; }
      axes.add(axis);
      const model = typeof r.model === "string" && r.model ? r.model : null;
      if (!model) unattributedModel++; else models.add(model);
      const itemId = r.item_id || r.prompt_sha256 || null;
      if (!itemId) { malformed++; nSkipped++; continue; }
      const ok = asBool(r.ok !== undefined ? r.ok : r.grade);
      if (ok === null) { ungraded++; nUngraded++; } else { nGraded++; if (ok) nOk++; }
      measurements.push({
        cell: cell.name,
        axis,
        model,
        item_id: itemId,
        i: r.i === undefined ? null : r.i,
        expected: r.expected ?? null,
        observed: r.observed ?? r.parsed_label ?? null,
        ok,
        elapsed_ms: r.elapsed_ms ?? null,
        raw_output_sha256: r.raw_output_sha256 ?? null,
        prompt_sha256: r.prompt_sha256 ?? null,
      });
      const key = axis + "|" + itemId;
      let item = items.get(key);
      if (!item) {
        item = {
          axis, item_id: itemId, prompt_sha256: r.prompt_sha256 ?? itemId,
          expected: r.expected ?? null, bank_dataset: r.bank_dataset ?? null,
          bank_sha256: r.bank_sha256 ?? null, n_models_answered: 0, n_ok: 0,
        };
        items.set(key, item);
      }
      item.n_models_answered++;
      if (ok) item.n_ok++;
    }
    const first = cell.rows[0] || {};
    cellRows.push({
      cell: cell.name,
      cell_sha256: cell.digest,
      axis: axes.size === 1 ? [...axes][0] : (cell.filenameAxis ?? null),
      axis_ambiguous: axes.size > 1,
      model: models.size === 1 ? [...models][0] : (models.size ? null : null),
      model_ambiguous: models.size > 1,
      schema: first.schema ?? null,
      bank_dataset: first.bank_dataset ?? null,
      bank_sha256: first.bank_sha256 ?? null,
      model_hf_revision: first.model_hf_revision ?? null,
      provider_route: first.provider_route ?? null,
      n_rows: cell.rows.length,
      n_joined: nGraded + nUngraded,
      n_skipped: nSkipped,
      n_ungraded: nUngraded,
      n_graded: nGraded,
      n_ok: nOk,
      accuracy: nGraded ? nOk / nGraded : null,
    });
  }

  const write = (name, rows) =>
    writeFileSync(path.join(target, name), rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""));
  // The measurements table is written in PARTS, not as one file. Cloudflare Pages refuses a
  // file over 25 MiB, and this table grows with every card the mill lands: 20,517 rows were
  // 8.2 MiB on 2026-11-01, one card PR of 1,500 cards took it to 24.4 MiB, and the next one
  // reached 25.3 MiB and broke the deploy. A single table that grows without bound is a
  // deploy that breaks on a data arrival nobody chose to break it, so it is written in parts
  // of at most SHARD_BYTES and the MANIFEST names them.
  const measurementsParts = writeShards(target, "gspc_measurements", measurements);
  write("gspc_items.jsonl", [...items.values()].sort((a, b) => (a.axis + a.item_id).localeCompare(b.axis + b.item_id)));
  write("gspc_cells.jsonl", cellRows);

  const byAxis = {};
  const byModel = {};
  for (const r of measurements) {
    byAxis[r.axis] = (byAxis[r.axis] || 0) + 1;
    const m = r.model || "(unattributed)";
    byModel[m] = (byModel[m] || 0) + 1;
  }
  let commit = "unknown";
  try { commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT }).toString().trim(); } catch { /* not a git checkout */ }
  const manifest = {
    schema: "csoai.gspc-fact-table/0.1",
    produced_at: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
    generator: "scripts/measurements/build-gspc-fact-table.mjs",
    generator_commit: commit,
    what_this_is: "One long-format fact table of every mill measurement the estate holds, joined from the " +
      "per-cell evidence files, plus the item universe it refers to and an index of the cells it came from.",
    what_this_does_not_establish: "That a model is good, or better than another. One run per cell, on one bank, at one time.",
    source: {
      evidence_dir: path.relative(ROOT, evidence),
      cell_files: cells.length,
      source_rows: cells.reduce((n, c) => n + c.rows.length, 0),
      source_digest: sha(cells.map((c) => c.name + " " + c.digest).sort().join("\n")),
    },
    counts: {
      measurements: measurements.length,
      items: items.size,
      cells: cellRows.length,
      axes: Object.keys(byAxis).length,
      models: Object.keys(byModel).length - (byModel["(unattributed)"] ? 1 : 0),
      rows_without_a_model: unattributedModel,
      rows_without_an_axis: unattributedAxis,
      rows_not_graded: ungraded,
      rows_dropped_as_malformed: malformed,
    },
    by_axis: byAxis,
    by_model: Object.fromEntries(Object.entries(byModel).sort((a, b) => b[1] - a[1])),
    // The layout of what was written, so a reader is TOLD which files to read rather than
    // left to guess whether the table is one file or several.
    tables: {
      measurements: {
        layout: "sharded",
        rows: measurements.length,
        bytes: measurementsParts.reduce((n, p) => n + p.bytes, 0),
        part_bytes_limit: SHARD_BYTES,
        parts: measurementsParts,
      },
      items: { layout: "single", file: "gspc_items.jsonl", rows: items.size },
      cells: { layout: "single", file: "gspc_cells.jsonl", rows: cellRows.length },
    },
  };
  writeFileSync(path.join(target, "MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");

  if (check) {
    // The tables are deterministic for a given evidence corpus; the manifest carries a
    // timestamp and a commit, so it is compared on its COUNTS, not on its bytes.
    const problems = [];
    for (const name of ["gspc_items.jsonl", "gspc_cells.jsonl"]) {
      const committed = readFileSync(path.join(out, name));
      const fresh = readFileSync(path.join(target, name));
      if (!committed.equals(fresh)) {
        problems.push(name + " does not match a fresh build (" + committed.length + " committed vs " + fresh.length + " fresh bytes)");
      }
    }
    // The measurements table is compared PART BY PART, from the layout each side declares. A
    // committed table that is one file and a fresh table that is parts is a LAYOUT change, not
    // a byte difference, and it is reported as such rather than as a missing file.
    const committedManifest = JSON.parse(readFileSync(path.join(out, "MANIFEST.json"), "utf8"));
    const committedParts = (committedManifest.tables && committedManifest.tables.measurements && committedManifest.tables.measurements.parts) || [];
    const freshNames = measurementsParts.map((p) => p.file);
    const committedNames = committedParts.map((p) => p.file);
    if (JSON.stringify(committedNames) !== JSON.stringify(freshNames)) {
      problems.push("the measurements table's parts differ from a fresh build (" + committedNames.length + " committed vs " + freshNames.length + " fresh)");
    } else {
      for (const part of measurementsParts) {
        const committed = readFileSync(path.join(out, part.file));
        const fresh = readFileSync(path.join(target, part.file));
        if (!committed.equals(fresh)) {
          problems.push(part.file + " does not match a fresh build (" + committed.length + " committed vs " + fresh.length + " fresh bytes)");
        }
      }
    }
    // The pre-shard single file must not survive beside the parts: it is the same rows twice,
    // and it is the file that broke the Pages per-file cap.
    if (existsSync(path.join(out, "gspc_measurements.jsonl"))) {
      problems.push("gspc_measurements.jsonl is the pre-shard single file and must be removed: the table is now written in parts");
    }
    if (JSON.stringify(committedManifest.counts) !== JSON.stringify(manifest.counts)) {
      problems.push("MANIFEST.json counts differ from a fresh build");
    }
    rmSync(scratch, { recursive: true, force: true });
    if (problems.length) {
      console.error("fact table is STALE:");
      for (const p of problems) console.error("  " + p);
      console.error("fix: node scripts/measurements/build-gspc-fact-table.mjs --out " + path.relative(ROOT, out));
      return 1;
    }
    console.log("fact table matches a fresh build: " + manifest.counts.measurements + " measurement(s), " +
      manifest.counts.items + " item(s), " + manifest.counts.cells + " cell(s)");
    return 0;
  }
  console.log(JSON.stringify({ out, ...manifest.counts }, null, 1));
  return 0;
}

process.exit(main(process.argv));
