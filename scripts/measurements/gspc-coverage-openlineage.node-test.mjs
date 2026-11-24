import { test } from "node:test";
import assert from "node:assert/strict";
import { coverageJobEvent } from "./gspc-coverage-openlineage.mjs";

const rev="a".repeat(40);
const source="b".repeat(64);
const base=()=>({
  schema:"csoai.gspc-evidence-coverage/1",
  state:"READ_ONLY_SOURCE_COVERAGE_NOT_AN_ADMISSION",
  source_authentication:"DIGESTED_BYTES_NOT_SIGNATURE_VERIFIED",
  sources:{board_sha256:source,fact_manifest_sha256:source,fact_cell_source_digest:source},
  axes:[{axis:"safety"}],
  counts:{board_axes:1,fact_rows:3,board_legacy_method_gaps:0,board_untested_separations:1},
  delta:{state:"BASELINE_NO_PREVIOUS_SNAPSHOT"},
});
test("emits OpenLineage JobEvent without asserting a run, publication or real safety result",()=>{
  const e=coverageJobEvent(base(),rev,"2026-11-22T00:00:00Z");
  assert.equal(e.schemaURL,"https://openlineage.io/spec/2-0-2/OpenLineage.json#/$defs/JobEvent");
  assert.equal(e.eventTime,"2026-11-22T00:00:00Z");
  assert.equal(e.producer.includes("/blob/"+rev+"/"),true);
  assert.equal("run" in e,false);
  assert.equal("eventType" in e,false);
  assert.deepEqual(e.inputs.map(x=>x.name),["source-board.json","source-fact-manifest.json"]);
  assert.deepEqual(e.outputs.map(x=>x.name),["coverage.json"]);
  const f=e.job.facets.csoai_coverage;
  assert.equal(f._schemaURL.includes("/"+rev+"/schemas/"),true);
  assert.equal(f.source_digests.fact_manifest_sha256,source);
  assert.equal(f.limits.signature_verified,false);
  assert.equal(f.limits.data_transmission,"NO_EVENT_SENT");
});
test("rejects a branch name as producer or a malformed UTC eventTime",()=>{
  assert.throws(()=>coverageJobEvent(base(),"master"),/immutable source commit/);
  assert.throws(()=>coverageJobEvent(base(),rev,"yesterday"),/UTC eventTime/);
});
test("rejects unsupported admission, fake authentication and missing source digests",()=>{
  for(const mutate of [
    x=>{x.state="SIGNED"},
    x=>{x.source_authentication="ED25519_VERIFIED"},
    x=>{delete x.sources.fact_manifest_sha256},
    x=>{delete x.delta.state},
  ]){
    const x=base();mutate(x);
    assert.throws(()=>coverageJobEvent(x,rev),/UNCHECKABLE/);
  }
});
test("refuses a mismatched per-axis count, never inventing a zero-row result",()=>{
  const x=base();x.counts.board_axes=0;
  assert.throws(()=>coverageJobEvent(x,rev),/qualifiers/);
});
test("custom facet distinguishes the qualified input digest from a signature",()=>{
  const x=base();x.sources.fact_cell_source_digest="c".repeat(64);
  const e=coverageJobEvent(x,rev,"2026-11-22T00:00:00Z");
  assert.equal(e.job.facets.csoai_coverage.source_digests.fact_cell_source_digest,"c".repeat(64));
  assert.equal(e.job.facets.csoai_coverage.source_authentication,"DIGESTED_BYTES_NOT_SIGNATURE_VERIFIED");
});
