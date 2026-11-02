// The fact table must be a faithful join of the per-cell evidence, not a new opinion.
//   node --test scripts/measurements/gspc-fact-table.node-test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const ROOT = path.resolve(new URL("../../", import.meta.url).pathname);
const OUT = process.env.FACT_TABLE_OUT || path.join(ROOT, "public/interop/gspc-fact-table");
const EVIDENCE = path.join(ROOT, "public/interop/mill-evidence");
const sha = (b) => createHash("sha256").update(b).digest("hex");
const readJsonl = (p) => readFileSync(p, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));

const skip = !existsSync(path.join(OUT, "MANIFEST.json"));
const opt = { skip: skip && "no fact table built yet — run scripts/measurements/build-gspc-fact-table.mjs" };

const measurements = skip ? [] : readJsonl(path.join(OUT, "gspc_measurements.jsonl"));
const items = skip ? [] : readJsonl(path.join(OUT, "gspc_items.jsonl"));
const cells = skip ? [] : readJsonl(path.join(OUT, "gspc_cells.jsonl"));
const manifest = skip ? null : JSON.parse(readFileSync(path.join(OUT, "MANIFEST.json"), "utf8"));

test("every cell's accuracy re-derives from the fact table", opt, () => {
  const byCell = new Map();
  for (const m of measurements) {
    if (!byCell.has(m.cell)) byCell.set(m.cell, { rows: 0, graded: 0, ok: 0 });
    const c = byCell.get(m.cell);
    c.rows++;
    if (m.ok !== null) c.graded++;
    if (m.ok === true) c.ok++;
  }
  for (const cell of cells) {
    const got = byCell.get(cell.cell);
    assert.ok(got, "a cell has no rows in the fact table: " + cell.cell);
    assert.equal(cell.n_joined, got.rows, "joined row count disagrees for " + cell.cell);
    assert.equal(cell.n_graded + cell.n_ungraded, cell.n_joined,
      "graded and ungraded rows must account for every joined row: " + cell.cell);
    assert.equal(cell.n_rows, cell.n_joined + cell.n_skipped,
      "the cell's rows do not account for every source row: " + cell.cell);
    assert.equal(cell.n_graded, got.graded, "graded count disagrees for " + cell.cell);
    assert.equal(cell.n_ok, got.ok, "ok count disagrees for " + cell.cell);
    if (cell.accuracy !== null) {
      assert.ok(Math.abs(cell.accuracy - got.ok / got.graded) < 1e-12,
        "accuracy does not re-derive for " + cell.cell);
    }
  }
});

test("every measurement resolves to an item in the universe", opt, () => {
  const keys = new Set(items.map((i) => i.axis + "|" + i.item_id));
  for (const m of measurements) {
    assert.ok(keys.has(m.axis + "|" + m.item_id),
      "measurement has no item row: " + m.axis + " / " + m.item_id);
  }
});

test("the item universe's own counts re-derive", opt, () => {
  const byItem = new Map();
  for (const m of measurements) {
    const k = m.axis + "|" + m.item_id;
    if (!byItem.has(k)) byItem.set(k, { n: 0, ok: 0 });
    byItem.get(k).n++;
    if (m.ok === true) byItem.get(k).ok++;
  }
  for (const item of items) {
    const got = byItem.get(item.axis + "|" + item.item_id);
    assert.ok(got, "item row has no measurements: " + item.axis + " / " + item.item_id);
    assert.equal(item.n_models_answered, got.n, "answered count disagrees for " + item.item_id);
    assert.equal(item.n_ok, got.ok, "ok count disagrees for " + item.item_id);
  }
});

test("the fact table has exactly as many rows as the evidence has", opt, () => {
  const source = readdirSync(EVIDENCE).filter((n) => n.startsWith("items-") && n.endsWith(".jsonl"));
  let sourceRows = 0;
  for (const name of source) {
    sourceRows += readFileSync(path.join(EVIDENCE, name), "utf8").split("\n").filter((l) => l.trim()).length;
  }
  assert.equal(manifest.source.cell_files, source.length, "the cell count disagrees with the evidence directory");
  assert.equal(
    measurements.length + manifest.counts.rows_without_an_axis + manifest.counts.rows_dropped_as_malformed,
    sourceRows,
    "rows were lost between the evidence files and the fact table");
});

test("no cell file is counted twice, and every cell is indexed", opt, () => {
  const names = cells.map((c) => c.cell);
  assert.equal(new Set(names).size, names.length, "a cell appears twice in the index");
  const onDisk = readdirSync(EVIDENCE).filter((n) => n.startsWith("items-") && n.endsWith(".jsonl")).sort();
  assert.deepEqual(names.slice().sort(), onDisk, "the index does not match the evidence directory");
});

test("each cell's digest is the digest of its own bytes", opt, () => {
  for (const cell of cells) {
    const raw = readFileSync(path.join(EVIDENCE, cell.cell));
    assert.equal(sha(raw), cell.cell_sha256, "cell digest disagrees: " + cell.cell);
  }
});

test("no measurement is left without a key", opt, () => {
  for (const m of measurements) {
    assert.ok(m.axis, "a measurement has no axis: " + m.cell);
    assert.ok(m.item_id, "a measurement has no item id: " + m.cell);
    assert.ok(m.expected !== null, "a measurement has no expected label: " + m.cell);
  }
});

test("the canary never reaches the fact table", opt, () => {
  for (const name of ["gspc_measurements.jsonl", "gspc_items.jsonl", "gspc_cells.jsonl", "MANIFEST.json"]) {
    const text = readFileSync(path.join(OUT, name), "utf8");
    assert.ok(!text.includes("GSPC-CANARY"), "the canary leaked into " + name);
  }
});

test("the manifest counts agree with the tables", opt, () => {
  assert.equal(manifest.counts.measurements, measurements.length);
  assert.equal(manifest.counts.items, items.length);
  assert.equal(manifest.counts.cells, cells.length);
  assert.equal(manifest.counts.axes, new Set(measurements.map((m) => m.axis)).size);
  const models = new Set(measurements.map((m) => m.model).filter(Boolean));
  assert.equal(manifest.counts.models, models.size);
  const unattributed = measurements.filter((m) => !m.model).length;
  assert.equal(manifest.counts.rows_without_a_model, unattributed,
    "the manifest must say how many rows carry no model — a cell whose model is only knowable by opening the file");
});
