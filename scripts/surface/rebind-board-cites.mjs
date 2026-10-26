#!/usr/bin/env node
/**
 * Rebind the board count in the three live static files that CITE the board but are not built
 * by the prerender: public/interop/gspc-one.json (axes_manifest.rule), public/publisher-health.json
 * (cites["gspc.board.cite"]) and public/owm/v0.1/latest.json (own:board-totals compared values).
 *
 * Every number is DERIVED from this commit's own /api/gspc (commitBoard, the same computation the
 * prerender and deploy use). Nothing is typed. Their producers (Busabase gspc-one export,
 * scripts/adapters/hub_cite.py, fleet/owm/owm.py) read the live board on their next run and will
 * re-observe the same totals once this commit is deployed; until then the cite says where its
 * numbers came from instead of pretending to be a live read. Measure ruling on #3266, 16 Oct 2026.
 *
 *   node scripts/surface/rebind-board-cites.mjs          # write
 *   node scripts/surface/rebind-board-cites.mjs --check  # exit 1 if any file would change
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { commitBoard } from "./commit-board.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CHECK = process.argv.includes("--check");
const c = await commitBoard(REPO);
if (c.status !== 200) throw new Error(`commit /api/gspc answered HTTP ${c.status}`);
const board = JSON.parse(c.raw.toString("utf8"));
const t = board.totals || {};
for (const k of ["axes", "measured_axes", "unmeasured_axes", "public_count"]) {
  if (t[k] === undefined || t[k] === null) throw new Error(`commit board totals.${k} missing — absent is not zero`);
}
const sha = createHash("sha256").update(c.raw).digest("hex");
const PROV = `derived from this commit's /api/gspc (functions/api/gspc.ts, computed offline by scripts/surface/commit-board.mjs; sha256 ${sha}) by scripts/surface/rebind-board-cites.mjs; the producer re-reads the live board on its next run`;

const edits = {
  "public/interop/gspc-one.json": (d) => {
    const m = d.axes_manifest;
    if (!m || typeof m.rule !== "string") throw new Error("gspc-one axes_manifest.rule missing");
    const re = /Board has [^.]*\./;
    if (!re.test(m.rule)) throw new Error("gspc-one rule carries no board-count sentence");
    m.rule = m.rule.replace(re, `Board has ${t.public_count}.`);
    m.board_count_source = PROV;
  },
  "public/publisher-health.json": (d) => {
    const b = d.cites?.["gspc.board.cite"];
    if (!b) throw new Error("publisher-health cites.gspc.board.cite missing");
    Object.assign(b, {
      totals_axes: t.axes, totals_measured_axes: t.measured_axes,
      totals_unmeasured_axes: t.unmeasured_axes, public_count: t.public_count,
      board_count_source: PROV,
    });
  },
  "public/owm/v0.1/latest.json": (d) => {
    const s = (d.subjects || []).find((x) => x.id === "own:board-totals");
    if (!s?.compared) throw new Error("owm own:board-totals missing");
    for (const v of Object.values(s.compared)) {
      Object.assign(v, { axes: t.axes, measured_axes: t.measured_axes, public_count: t.public_count });
    }
    // The recorded evidence digest was over the bytes production served on the old board; it no
    // longer describes these values. The evidence for the rebound values is the commit board's
    // bytes, so that is the digest this row now carries (the door requires one on an observed row).
    s.evidence_sha256 = sha;
    s.board_count_source = PROV;
  },
};

let stale = 0;
for (const [rel, fn] of Object.entries(edits)) {
  const f = path.join(REPO, rel);
  const before = fs.readFileSync(f, "utf8");
  const d = JSON.parse(before);
  fn(d);
  const indent = (before.match(/\n( +)"/) || [, " "])[1].length;
  const after = JSON.stringify(d, null, indent) + (before.endsWith("\n") ? "\n" : "");
  if (after === before) { console.log(`ok   ${rel}`); continue; }
  if (CHECK) { stale++; console.error(`STALE ${rel}`); continue; }
  fs.writeFileSync(f, after);
  console.log(`wrote ${rel} (${t.public_count})`);
}
if (stale) process.exit(1);
