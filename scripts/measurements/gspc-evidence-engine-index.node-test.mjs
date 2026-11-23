import { test } from "node:test";
import assert from "node:assert/strict";
import { produceEvidenceEngineIndex, verifyCurrentCheckoutPins } from "./gspc-evidence-engine-index.mjs";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";

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
    schema:"csoai.gspc-repeat-integrity/2",
    state:"EXPLORATORY_SOURCE_RECONCILED_NOT_A_MODEL_GRADE",
    source_authentication:"DIGESTED_SOURCE_BYTES_NOT_SIGNED_OR_INDEPENDENTLY_REPRODUCED",
    sources:{manifest_sha256:H("b"),raw_cell_digest_sha256:H("c"),cell_files:2},
    rows:{rows:3,rows_ungraded:1,rows_without_model:1,rows_with_attributed_model:2,
      rows_with_complete_pinned_identity:2},
    attributed_model_identifiers:1,
    source_route_audit:{
      cells_with_multiple_provider_routes:1,
      source_observations_on_nonfirst_provider_route:1,
      join_state:"ALL_RAW_OBSERVATIONS_LINKED_BIJECTIVELY",
      attribution_method:"PER_OBSERVATION_RAW_SOURCE_LINEAGE_NOT_FIRST_CELL_METADATA",
    },
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
  assert.equal(out.measurements.source_cells_with_multiple_provider_routes,1);
  assert.equal(out.measurements.source_observations_on_nonfirst_provider_route,1);
  assert.equal(out.separate_synthetic_research.model_poisoning_effect,"NOT_TESTED");
  assert.equal(out.sources.github_action_runs.coverage,"https://github.com/CSOAI-ORG/councilof-ai/actions/runs/11");
  assert.equal(out.authority.startsWith("NONE:"),true);
});
test("a pre-fix cell-level route audit must not be accepted as qualified input",()=>{
  const x=sources();
  delete x.repeat.source_route_audit;
  assert.throws(()=>produceEvidenceEngineIndex(x.coverage,x.repeat,x.mutation,x.hashes),
    /source-observation provider-route provenance/);
  const old=sources();
  old.repeat.schema="csoai.gspc-repeat-integrity/1";
  assert.throws(()=>produceEvidenceEngineIndex(old.coverage,old.repeat,old.mutation,old.hashes),
    /repeat audit missing or incorrectly authenticated/);
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


test("current-master checkout pin guard detects same-count, same-size source substitution",()=>{
  const root=mkdtempSync(join(tmpdir(),"csoai-index-current-master-"));
  try {
    const source=join(root,"cells");
    mkdirSync(source);
    const file="items-safety-aabbccdd0011.jsonl";
    const original='{"axis":"safety","item_id":"one","ok":true}\n';
    const altered='{"axis":"safety","item_id":"one","ok":null}\n';
    const hash=x=>createHash("sha256").update(x).digest("hex");
    const sourcePath=join(source,file);
    const manifestPath=join(root,"MANIFEST.json");
    const referencePath=join(root,"baseline.sha256");
    writeFileSync(sourcePath,original);
    const sourceDigest=hash(file+" "+hash(original));
    const manifest={source:{source_digest:sourceDigest,cell_files:1,source_rows:1}};
    const manifestRaw=JSON.stringify(manifest);
    writeFileSync(manifestPath,manifestRaw);
    const baseline="a".repeat(64);
    writeFileSync(referencePath,baseline+"\n");
    const report={
      sources:{fact_manifest_digest:hash(manifestRaw),physical_cell_source_digest:sourceDigest},
      measurements:{source_cells:1},
      separate_synthetic_research:{baseline_sha256:baseline},
    };
    const opts={manifestPath,evidenceDir:source,referencePath};
    assert.equal(verifyCurrentCheckoutPins(report,opts).state,
      "SOURCE_BYTES_MATCH_CURRENT_CHECKOUT_UNWITNESSED");
    writeFileSync(sourcePath,altered);
    assert.throws(()=>verifyCurrentCheckoutPins(report,opts),/physical cell digest differs/);
    writeFileSync(sourcePath,original);
    writeFileSync(referencePath,"b".repeat(64)+"\n");
    assert.throws(()=>verifyCurrentCheckoutPins(report,opts),/synthetic control reference changed/);
    writeFileSync(referencePath,baseline+"\n");
    writeFileSync(manifestPath,JSON.stringify({...manifest,source:{...manifest.source,source_digest:"0".repeat(64)}}));
    assert.throws(()=>verifyCurrentCheckoutPins(report,opts),/historical Actions fact manifest differs/);
  } finally {rmSync(root,{recursive:true,force:true});}
});

test("missing current source index and malformed raw item can never pass the master freshness gate",()=>{
  const root=mkdtempSync(join(tmpdir(),"csoai-index-missing-cell-"));
  try {
    const src=join(root,"cells");mkdirSync(src);
    const name="items-safety-aabbccdd0011.jsonl";
    const raw='{"axis":"safety","item_id":"one","ok":true}\n';
    const hash=x=>createHash("sha256").update(x).digest("hex");
    const digest=hash(name+" "+hash(raw));
    const manifest={source:{source_digest:digest,cell_files:1,source_rows:1}};
    const manifestRaw=JSON.stringify(manifest);
    const manifestPath=join(root,"MANIFEST.json");
    const referencePath=join(root,"baseline.sha256");
    writeFileSync(manifestPath,manifestRaw);
    writeFileSync(referencePath,"a".repeat(64)+"\n");
    const report={
      sources:{fact_manifest_digest:hash(manifestRaw),physical_cell_source_digest:digest},
      measurements:{source_cells:1},
      separate_synthetic_research:{baseline_sha256:"a".repeat(64)},
    };
    const options={manifestPath,evidenceDir:src,referencePath};
    assert.throws(()=>verifyCurrentCheckoutPins(report,options),/current source cells differ|current source inventory/);
    writeFileSync(join(src,name),'{');
    assert.throws(()=>verifyCurrentCheckoutPins(report,options),/invalid source JSON/);
  }finally{rmSync(root,{recursive:true,force:true});}
});
