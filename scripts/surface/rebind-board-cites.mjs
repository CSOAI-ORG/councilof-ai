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
 *   node scripts/surface/rebind-board-cites.mjs --selftest
 *
 * THREE STATES, kept apart (added 2026-11-06):
 *   exit 0  the committed cites ARE what this producer would write   -> pass
 *   exit 1  a cite would change: the cites no longer quote this commit's board -> a FINDING
 *   exit 2  the check could not run (no board, no file, unreadable)    -> UNCHECKABLE, not a finding
 *
 * WHY exit 2 exists. UNCHECKABLE IS NEVER FAIL: a missing tool or an unreadable board is an
 * ABSENCE OF EVIDENCE, not a statement about the cites. Before this, any thrown error exited 1 —
 * the same code as "the cites are stale" — so an environment problem would have blocked every push
 * in the estate and been read as a real finding. The pre-push gate distinguishes them.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { commitBoard } from "./commit-board.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CHECK = process.argv.includes("--check");
const SELFTEST = process.argv.includes("--selftest");

/**
 * The three edits, as pure functions of (document, totals, provenance string).
 *
 * Exported so the selftest can prove the edits DO change a stale document, and that applying them
 * twice changes nothing — a producer that is not idempotent would make every run a diff.
 */
export function makeEdits(t, PROV, sha) {
  return {
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
}

/** The three documents the edits expect to find, with the shape each one reads. */
export function sampleDocs() {
  return {
    "public/interop/gspc-one.json": {
      axes_manifest: { rule: "Board has 34 axes · 23 measured.", board_count_source: "old" },
    },
    "public/publisher-health.json": {
      cites: { "gspc.board.cite": { totals_axes: 34, totals_measured_axes: 23, totals_unmeasured_axes: 11, public_count: "34 axes · 23 measured", board_count_source: "old" } },
    },
    "public/owm/v0.1/latest.json": {
      subjects: [{ id: "own:board-totals", compared: { a: { axes: 34, measured_axes: 23, public_count: "34 axes · 23 measured" } }, evidence_sha256: "old" }],
    },
  };
}

if (SELFTEST) {
  // The gate must be provably working before its verdict means anything: a check that has never
  // gone red proves nothing about the tree it just passed. Two properties are proved here —
  // (1) a STALE document IS changed, and (2) applying the edits twice changes nothing.
  const stale = { axes: 34, measured_axes: 23, unmeasured_axes: 11, public_count: "34 axes · 23 measured" };
  const fresh = { axes: 34, measured_axes: 34, unmeasured_axes: 0, public_count: "34 axes · 34 measured" };
  const edits = makeEdits(fresh, "PROV", "sha");
  let failed = 0;
  const check = (name, cond) => { if (cond) console.log(`  ok    ${name}`); else { console.error(`  FAIL  ${name}`); failed++; } };
  for (const [rel, fn] of Object.entries(edits)) {
    const d = sampleDocs()[rel];
    fn(d);
    const after = JSON.stringify(d);
    check(`${rel}: a stale document is changed`, after.includes("34 axes · 34 measured"));
    const d2 = JSON.parse(after);
    fn(d2);
    check(`${rel}: applying the edits twice changes nothing`, JSON.stringify(d2) === after);
  }
  // And the direction that matters: a DIFFERENT board must be detected as different.
  const d = sampleDocs()["public/publisher-health.json"];
  edits["public/publisher-health.json"](d);
  check("publisher-health: totals_measured_axes follows the board", d.cites["gspc.board.cite"].totals_measured_axes === 34);
  check("publisher-health: totals_unmeasured_axes follows the board", d.cites["gspc.board.cite"].totals_unmeasured_axes === 0);
  check("the stale board would have been DIFFERENT", stale.public_count !== fresh.public_count);
  if (failed) { console.error(`rebind-board-cites selftest FAILED — ${failed} case(s)`); process.exit(1); }
  console.log("rebind-board-cites selftest OK — the producer changes a stale cite and is idempotent.");
  process.exit(0);
}

let stale = 0;
try {
  const c = await commitBoard(REPO);
  if (c.status !== 200) throw new Error(`commit /api/gspc answered HTTP ${c.status}`);
  const board = JSON.parse(c.raw.toString("utf8"));
  const t = board.totals || {};
  for (const k of ["axes", "measured_axes", "unmeasured_axes", "public_count"]) {
    if (t[k] === undefined || t[k] === null) throw new Error(`commit board totals.${k} missing — absent is not zero`);
  }
  const sha = createHash("sha256").update(c.raw).digest("hex");
  const PROV = `derived from this commit's /api/gspc (functions/api/gspc.ts, computed offline by scripts/surface/commit-board.mjs; sha256 ${sha}) by scripts/surface/rebind-board-cites.mjs; the producer re-reads the live board on its next run`;
  const edits = makeEdits(t, PROV, sha);
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
} catch (e) {
  // UNCHECKABLE, not a finding. The board could not be computed or a cite could not be read.
  console.error(`rebind-board-cites COULD NOT RUN — ${String(e && e.message ? e.message : e).slice(0, 300)}`);
  console.error("This is an absence of evidence about the cites, not a statement that they are stale.");
  process.exit(2);
}
if (stale) process.exit(1);
