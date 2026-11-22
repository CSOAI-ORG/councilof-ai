import { test } from "node:test";
import assert from "node:assert/strict";
import { produceEvidenceEngineIndex } from "./gspc-evidence-engine-index.mjs";

const H=s=>s.repeat(64);
function sources(){
  const coverage={
    schema:"csoai.gspc-evidence-coverage/1",
    state:"READ_ONLY_SOURCE_COVERAGE_NOT_AN_ADMISSION",
    source_authentication:"DIGESTED_BYTES_NOT_SIGNATURE_VERIFIED",
    sources:{board_sha256:H("a"),fact_manifest_sha256:H("b"),fact_cell_source_digest:H("c")},
    counts:{board_axes:2,board_measured_axes:2,board_model_comparison_axes:1,
      board_separated_leads:0,board_ties:0,board_untested_separations:1,
      fact_axes:1,fact_rows:3,fact_cells:2,fact_model_identifiers:1,
      fact_ungraded_rows:1,fact_unattributed_model_rows:1,board_legacy_method_gaps:1},
    axes:[{axis:"safety",per_item_rows:3},{axis:"effect-binding",per_item_rows:0}],
  };
  const repeat={
    schema:"csoai.gspc-repeat-integrity/1",
    state:"EXPLORATORY_SOURCE_RECONCILED_NOT_A_MODEL_GRADE",
    source_authentication:"DIGESTED_SOURCE_BYTES_NOT_SIGNED_OR_INDEPENDENTLY_REPRODUCED",
    sources:{manifest_sha256:H("b"),raw_cell_digest_sha256:H("c"),cell_files:2},
    rows:{rows:3,rows_ungraded:1,rows_without_model:1,rows_with_attributed_model:2,
      rows_with_complete_pinned_identity:2},
    attributed_model_identifiers:1,
    by_axis:[{axis:"safety",rows:3}],
    coarse_identity:{distinct_keys:1,repeated_keys:1,extra_rows_above_one_per_key:1,grade_disagreement_keys:1},
    pinned_identity:{distinct_keys:1,repeated_keys:1,extra_rows_above_one_per_key:1,grade_disagreement_keys:1},
  };
  const mutation={
    schema:"csoai.synthetic-dataset-mutation-sensitivity/1",
    study_type:"DETERMINISTIC_SYNTHETIC_SOURCE_INTEGRITY",
    source_real:false,reference_pin_state:"GIT_REVIEWABLE_REFERENCE_NO_EXTERNAL_SIGNATURE",
    document_count:10000,record_ids_unique:true,baseline_sha256:H("d"),
    cases:[1,5,25,150].map(k=>({
      changed_documents:k,exact_changed_documents:k,row_count_only_detection:"MISSED_SAME_COUNT",
      size_only_detection:"MISSED_SAME_SIZE",
      versioned_reference_digest_comparison:"DETECTED_CHANGED_SOURCE_BYTES",
      behavioral_model_inference:"NOT_RUN",semantic_poison_detection:"NOT_TESTED",
    })),
  };
  return {coverage,repeat,mutation,hashes:{coverage:H("e"),repeat:H("f"),mutation:H("a")}};
}
test("three research feeds join only when their source pins and denominators agree",()=>{
  const i=sources();
  const out=produceEvidenceEngineIndex(i.coverage,i.repeat,i.mutation,i.hashes,{coverage:11,repeat:12,mutation:13});
  assert.equal(out.schema,"csoai.gspc-evidence-engine-index/1");
  assert.equal(out.measurements.per_item_observation_rows,3);
  assert.equal(out.measurements.distinct_attributed_model_axis_item_keys,1);
  assert.equal(out.measurements.ungraded_observation_rows,1);
  assert.equal(out.measurements.untested_separations,1);
  assert.equal(out.separate_synthetic_research.model_poisoning_effect,"NOT_TESTED");
  assert.equal(out.sources.github_action_runs.coverage,"https://github.com/CSOAI-ORG/councilof-ai/actions/runs/11");
  assert.equal(out.authority.startsWith("NONE:"),true);
});
test("unmatched manifest SHA refuses a plausible-looking combined report",()=>{
  const x=sources();
  x.repeat.sources.manifest_sha256=H("e");
  assert.throws(()=>produceEvidenceEngineIndex(x.coverage,x.repeat,x.mutation,x.hashes),/source manifest.*digests disagree/);
});
test("equal overall row totals cannot conceal by-axis reattribution",()=>{
  const x=sources();
  x.repeat.by_axis=[{axis:"effect-binding",rows:3}];
  assert.throws(()=>produceEvidenceEngineIndex(x.coverage,x.repeat,x.mutation,x.hashes),/axis attribution differs/);
});
test("one missing ungraded observation fails reconciliation instead of becoming a negative",()=>{
  const x=sources();
  x.repeat.rows.rows_ungraded=0;
  assert.throws(()=>produceEvidenceEngineIndex(x.coverage,x.repeat,x.mutation,x.hashes),/row\/axis\/model counts disagree/);
});
test("repeated trials are not free independent key counts",()=>{
  const x=sources();
  x.repeat.coarse_identity.distinct_keys=2;
  assert.throws(()=>produceEvidenceEngineIndex(x.coverage,x.repeat,x.mutation,x.hashes),/repeat volume or denominator mismatch/);
});
test("cannot promote synthetic mutation study into evidence of real model poisoning",()=>{
  for(const mut of [
    x=>{x.mutation.source_real=true},
    x=>{x.mutation.cases[0].semantic_poison_detection="DETECTED"},
    x=>{x.mutation.cases[0].behavioral_model_inference="COMPLETED"},
    x=>{x.mutation.reference_pin_state="INDEPENDENTLY_SIGNED"},
  ]){
    const x=sources();mut(x);
    assert.throws(()=>produceEvidenceEngineIndex(x.coverage,x.repeat,x.mutation,x.hashes),/UNCHECKABLE/);
  }
});
test("unverifiable artifact hashes and fake signed coverage are not accepted",()=>{
  for(const mut of [
    x=>{x.hashes.coverage="unverified"},
    x=>{x.coverage.source_authentication="ED25519_VERIFIED"},
    x=>{x.coverage.counts.board_untested_separations=0},
  ]){
    const x=sources();mut(x);
    assert.throws(()=>produceEvidenceEngineIndex(x.coverage,x.repeat,x.mutation,x.hashes),/UNCHECKABLE/);
  }
});
test("run metadata requires real positive GitHub run IDs, never an arbitrary web URL",()=>{
  const x=sources();
  assert.throws(()=>produceEvidenceEngineIndex(x.coverage,x.repeat,x.mutation,x.hashes,{coverage:12,repeat:13,mutation:0}),/successful GitHub run id absent/);
});
