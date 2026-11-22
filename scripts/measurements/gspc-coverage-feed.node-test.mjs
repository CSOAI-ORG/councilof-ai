import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveCoverage, readCellSourceDigest, readCoverage, SCHEMA } from "./gspc-coverage-feed.mjs";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";

const hash=(c)=>c.repeat(64);
function input() {
  const board = {
    schema:"csoai.fixture-board/1",
    totals:{axes:3,measured_axes:3,comparison_axes:2,separated_leads:0,ties:1,untested_separations:1},
    axes:[
      {axis:"safety",family:"gspc",kind:"model-comparison",status:"MEASURED",method_status:"meets-rule",separation:"TIE"},
      {axis:"jail",family:"gspc",kind:"model-comparison",status:"MEASURED",method_status:"legacy: 27 prompts",separation:"UNTESTED"},
      {axis:"fact-only",family:"financial",kind:"deterministic-facts",status:"MEASURED",method_status:"legacy: n 2"},
    ],
  };
  const fact = {
    schema:"csoai.gspc-fact-table/0.1",
    generator_commit:"fixture-commit",
    counts:{measurements:3,items:2,cells:2,axes:1,models:1,rows_without_a_model:1,rows_without_an_axis:0,rows_not_graded:1,rows_dropped_as_malformed:0},
    source:{cell_files:2,source_rows:3,source_digest:hash("a")},
    by_axis:{safety:3},by_model:{"vendor/model":2,"(unattributed)":1},
    tables:{measurements:{layout:"sharded",rows:3,bytes:123,parts:[{file:"gspc_measurements/part-000.jsonl",rows:3,bytes:123}]}},
  };
  return {board,fact,digests:{board_sha256:hash("b"),fact_manifest_sha256:hash("c")}};
}
test("real model-comparison rows are distinct from other MEASURED axis evidence", () => {
  const {board,fact,digests}=input();
  const out=deriveCoverage(board,fact,digests);
  assert.equal(out.schema,SCHEMA);
  assert.equal(out.counts.board_measured_axes,3);
  assert.equal(out.counts.board_axes_with_fact_rows,1);
  assert.equal(out.counts.board_axes_without_fact_rows,2);
  assert.equal(out.axes.find(x=>x.axis==="jail").board_status,"MEASURED");
  assert.equal(out.axes.find(x=>x.axis==="jail").per_item_state,"NOT_REPRESENTED_IN_THIS_FACT_TABLE");
  assert.equal(out.axes.find(x=>x.axis==="fact-only").separation_state,"NOT_APPLICABLE");
  assert.equal(out.source_authentication,"DIGESTED_BYTES_NOT_SIGNATURE_VERIFIED");
  assert.equal(out.counts.board_legacy_method_gaps,2);
});
test("one substituted source byte, even at the same row count, is never NO_CHANGE", () => {
  const {board,fact,digests}=input();
  const before=deriveCoverage(board,fact,digests);
  fact.source.source_digest=hash("d");
  const after=deriveCoverage(board,fact,digests,before);
  assert.equal(after.delta.rows_change,0);
  assert.equal(after.delta.state,"SOURCE_CHANGED_SAME_ROW_COUNT_REEVALUATE");
  assert.equal(after.delta.source_changed,true);
});
test("same source digests and counts replay as unchanged without claiming improvement", () => {
  const {board,fact,digests}=input();
  const before=deriveCoverage(board,fact,digests);
  const after=deriveCoverage(board,fact,digests,before);
  assert.equal(after.delta.state,"NO_SOURCE_BYTES_CHANGED");
  assert.equal(after.delta.rows_change,0);
});
test("changed board bytes are revisions, not a newly admitted score", () => {
  const {board,fact,digests}=input();
  const before=deriveCoverage(board,fact,digests);
  digests.board_sha256=hash("e");
  const after=deriveCoverage(board,fact,digests,before);
  assert.equal(after.delta.state,"BOARD_BYTES_CHANGED_REVIEW");
});
test("duplicating an axis identity is rejected despite preserving row counts", () => {
  const {board,fact,digests}=input();
  board.axes[1].axis="safety";
  assert.throws(()=>deriveCoverage(board,fact,digests),/duplicate board axis/);
});
test("unknown separation values cannot be hidden inside the measured total", () => {
  const {board,fact,digests}=input();
  board.axes[1].separation="CLEAN";
  assert.throws(()=>deriveCoverage(board,fact,digests),/separation states disagree/);
});
test("inconsistent shard totals are rejected, not published as a partial sample", () => {
  const {board,fact,digests}=input();
  fact.tables.measurements.parts[0].rows=2;
  assert.throws(()=>deriveCoverage(board,fact,digests),/shard\/manifest row mismatch/);
});
test("source corruption absent from table cannot silently reduce the denominator", () => {
  const {board,fact,digests}=input();
  fact.source.source_rows=4;
  assert.throws(()=>deriveCoverage(board,fact,digests),/physical source rows unaccounted for/);
});
test("unknown prior source digest cannot manufacture a clean delta", () => {
  const {board,fact,digests}=input();
  const prior=deriveCoverage(board,fact,digests);
  prior.sources.fact_cell_source_digest=null;
  assert.throws(()=>deriveCoverage(board,fact,digests,prior),/previous source pins uncheckable/);
});

test("a changed manifest projection is not mistaken for NO_SOURCE_BYTES_CHANGED", () => {
  const {board,fact,digests}=input();
  const before=deriveCoverage(board,fact,digests);
  // A corrected generator can change model attribution with identical raw cells.
  fact.by_model["vendor/model"]=1;
  fact.by_model["(unattributed)"]=2;
  fact.counts.rows_without_a_model=2;
  digests.fact_manifest_sha256=hash("e");
  const after=deriveCoverage(board,fact,digests,before);
  assert.equal(after.delta.rows_change,0);
  assert.equal(after.delta.source_changed,false);
  assert.equal(after.delta.fact_manifest_changed,true);
  assert.equal(after.delta.state,"FACT_PROJECTION_CHANGED_REEVALUATE");
});

test("previous manifest hash is required to claim a clean delta", () => {
  const {board,fact,digests}=input();
  const before=deriveCoverage(board,fact,digests);
  delete before.sources.fact_manifest_sha256;
  assert.throws(()=>deriveCoverage(board,fact,digests,before),/previous source pins uncheckable/);
});

test("the consumer independently hashes the source file bytes, and detects substitutions with equal row counts", () => {
  const root=mkdtempSync(join(tmpdir(),"csoai-gspc-cell-source-"));
  const source=join(root,"cells");
  const boardFile=join(root,"board.json");
  const manifestFile=join(root,"manifest.json");
  try {
    mkdirSync(source);
    const file=join(source,"items-safety-abcd1234.jsonl");
    writeFileSync(file,'{"axis":"safety","model":"fixture/model","item_id":"one","ok":true}\n');
    const cells=readCellSourceDigest(source);
    const {board,fact}=input();
    fact.source={...fact.source,...cells,cell_files:cells.cell_files,source_rows:cells.source_rows};
    fact.counts.cells=cells.cell_files;
    fact.counts.measurements=cells.source_rows;
    fact.counts.items=1;
    fact.counts.axes=1;
    fact.counts.models=1;
    fact.counts.rows_without_a_model=0;
    fact.counts.rows_not_graded=0;
    fact.by_axis={safety:1};
    fact.by_model={"fixture/model":1};
    fact.tables.measurements.rows=1;
    fact.tables.measurements.parts[0].rows=1;
    writeFileSync(boardFile,JSON.stringify(board));
    writeFileSync(manifestFile,JSON.stringify(fact));
    const present=readCoverage({board:boardFile,manifest:manifestFile,evidence:source});
    assert.equal(present.sources.fact_cell_source_digest,cells.source_digest);
    // Same number of rows: only bytes changed. A count-only audit misses this.
    writeFileSync(file,'{"axis":"safety","model":"fixture/model","item_id":"one","ok":false}\n');
    assert.throws(()=>readCoverage({board:boardFile,manifest:manifestFile,evidence:source}),/independent raw cell hash\/count/);
  } finally { rmSync(root,{recursive:true,force:true}); }
});

test("the consumer refuses to report a trusted result if raw evidence cannot be accessed", () => {
  const root=mkdtempSync(join(tmpdir(),"csoai-gspc-empty-source-"));
  try {assert.throws(()=>readCellSourceDigest(root),/no source item cells/);}
  finally {rmSync(root,{recursive:true,force:true});}
});
