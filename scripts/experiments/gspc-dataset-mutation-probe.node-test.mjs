import { test } from "node:test";
import assert from "node:assert/strict";
import { syntheticDocuments, mutateDocuments, compareSnapshots, runSyntheticMutationStudy, BASELINE_RECORDS, CHANGE_COUNTS } from "./gspc-dataset-mutation-probe.mjs";

test("real 10,000-document synthetic run detects every exact edit with identical row/byte counts",()=>{
  const r=runSyntheticMutationStudy();
  assert.equal(r.document_count,BASELINE_RECORDS);
  assert.deepEqual(r.cases.map(x=>x.changed_documents),CHANGE_COUNTS);
  assert.equal(r.record_ids_unique,true);
  for(const c of r.cases){
    assert.equal(c.exact_changed_documents,c.changed_documents);
    assert.equal(c.row_count_only_detection,"MISSED_SAME_COUNT");
    assert.equal(c.size_only_detection,"MISSED_SAME_SIZE");
    assert.equal(c.external_baseline_digest_comparison,"DETECTED_CHANGED_SOURCE_BYTES");
    assert.equal(c.item_hash_reconciliation,"DETECTED_ALL_CHANGED_DOCUMENTS");
    assert.equal(c.semantic_poison_detection,"NOT_TESTED");
    assert.equal(c.behavioral_model_inference,"NOT_RUN");
  }
});
test("recomputing a self-consistent untrusted manifest does not establish source authenticity",()=>{
  const b=syntheticDocuments(150);
  const m=mutateDocuments(b,[9]);
  const withoutPin=compareSnapshots(b,m);
  assert.equal(withoutPin.trusted_baseline_pin_matches,"UNCHECKABLE_NO_EXTERNAL_PIN");
  assert.equal(withoutPin.untrusted_rehashed_manifest_self_consistent,true);
  const baseline=compareSnapshots(b,b);
  const withPin=compareSnapshots(b,m,{baselinePin:baseline.source_sha256_before});
  assert.equal(withPin.trusted_baseline_pin_matches,false);
});
test("benign byte changes are detected as revisions, never auto-diagnosed as poison",()=>{
  const b=syntheticDocuments(150);
  const m=b.map((r,i)=>i===0?{...r,body:r.body.replace("Governance","governance")}:r);
  const diff=compareSnapshots(b,m,{baselinePin:compareSnapshots(b,b).source_sha256_before});
  assert.equal(diff.change_count,1);
  assert.equal(diff.trusted_baseline_pin_matches,false);
  assert.equal(diff.row_count_only_detected,false);
  assert.equal(diff.file_size_only_detected,false);
});
test("mutation controls reject duplicate, out-of-range and incomplete target sets",()=>{
  const b=syntheticDocuments(150);
  assert.throws(()=>mutateDocuments(b,[3,3]),/duplicate mutation ids/);
  assert.throws(()=>mutateDocuments(b,[151]),/out-of-range mutation id/);
  assert.throws(()=>runSyntheticMutationStudy({n:149}),/at least 150/);
  assert.throws(()=>runSyntheticMutationStudy({n:150,counts:[1,151]}),/invalid controlled change counts/);
});
test("every corpus record has stable immutable identity, with a same-size policy edit",()=>{
  const b=syntheticDocuments(150);
  const v=mutateDocuments(b,[0,149]);
  assert.equal(b[0].doc_id,v[0].doc_id);
  assert.equal(Buffer.byteLength(JSON.stringify(b[0])),Buffer.byteLength(JSON.stringify(v[0])));
  assert.equal(JSON.stringify(b[1]),JSON.stringify(v[1]));
  assert.match(v[149].body,/HITL=DISABLED/);
  assert.match(b[149].body,/HITL=REQUIRED/);
});
test("study results are deterministic across repeated executions",()=>{
  const first=runSyntheticMutationStudy({n:300,counts:[1,5,25,150]});
  const second=runSyntheticMutationStudy({n:300,counts:[1,5,25,150]});
  assert.deepEqual(first,second);
});
