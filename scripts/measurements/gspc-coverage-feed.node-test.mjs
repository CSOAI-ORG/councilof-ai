import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveCoverage, SCHEMA } from "./gspc-coverage-feed.mjs";

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
