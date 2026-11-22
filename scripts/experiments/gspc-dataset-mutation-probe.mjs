#!/usr/bin/env node
/**
 * Synthetic byte-level dataset mutation sensitivity, NOT semantic poison detection.
 * 10,000 deterministic synthetic documents. Change exactly 1,5,25,150 distinct
 * records without changing their ID, the record count, or the total byte size.
 * Recomputing an untrusted manifest is deliberately not a trust witness.
 * No model training, inference, external dataset, actual human or remote call.
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sha = value => createHash("sha256").update(value).digest("hex");
const check=(x,msg)=>{if(!x)throw Error("UNCHECKABLE synthetic dataset mutation: "+msg);};
const POLICY_FROM="HITL=REQUIRED";
const POLICY_TO="HITL=DISABLED";
check(POLICY_FROM.length===POLICY_TO.length,"same-byte-length invariant");
export const BASELINE_RECORDS=10_000;
export const CHANGE_COUNTS=[1,5,25,150];

export function syntheticDocuments(n=BASELINE_RECORDS) {
  check(Number.isSafeInteger(n)&&n>=150,"synthetic corpus needs at least 150 records");
  return Array.from({length:n},(_,i)=>({
    doc_id:"SYNTH-"+String(i).padStart(6,"0"),
    source_kind:"SYNTHETIC_NO_REAL_USER_DATA",
    body:"Governance experiment row "+String(i).padStart(6,"0")+"; "+POLICY_FROM+
      "; privileged tool requests need an authenticated human decision.",
  }));
}
const serialized = documents => documents.map(d=>JSON.stringify(d)).join("\n")+"\n";
const selectMutationIds = (n,counts=CHANGE_COUNTS) => {
  check(Array.isArray(counts)&&counts.length>0&&counts.every(x=>Number.isSafeInteger(x)&&x>0&&x<=n),
    "invalid controlled change counts");
  const max=Math.max(...counts);
  return Array.from({length:n},(_,i)=>({i,rank:sha("csoai-dataset-mutation/1:"+i)}))
    .sort((a,b)=>a.rank.localeCompare(b.rank)||a.i-b.i)
    .slice(0,max)
    .map(e=>e.i);
};
export function mutateDocuments(baseline,selectedIds) {
  const idx=new Set(selectedIds);
  check(idx.size===selectedIds.length,"duplicate mutation ids");
  check(selectedIds.every(i=>Number.isSafeInteger(i)&&i>=0&&i<baseline.length),"out-of-range mutation id");
  return baseline.map((d,i)=>{
    if(!idx.has(i))return d;
    check(d.body.includes(POLICY_FROM),"baseline signature absent");
    return {...d,body:d.body.replace(POLICY_FROM,POLICY_TO)};
  });
}
export function compareSnapshots(baseline,variant,{baselinePin=null}={}) {
  check(Array.isArray(baseline)&&Array.isArray(variant)&&baseline.length>0,"corpus unavailable");
  const original=serialized(baseline),candidate=serialized(variant);
  const oldDigest=sha(original),newDigest=sha(candidate);
  const changes=[];
  for(let i=0;i<Math.max(baseline.length,variant.length);i++){
    const a=baseline[i],b=variant[i];
    if(!a||!b||a.doc_id!==b.doc_id||sha(JSON.stringify(a))!==sha(JSON.stringify(b)))changes.push(i);
  }
  return {
    records_before:baseline.length,
    records_after:variant.length,
    bytes_before:Buffer.byteLength(original),
    bytes_after:Buffer.byteLength(candidate),
    source_sha256_before:oldDigest,source_sha256_after:newDigest,
    changed_document_indices:changes,
    change_count:changes.length,
    row_count_only_detected:baseline.length!==variant.length,
    file_size_only_detected:Buffer.byteLength(original)!==Buffer.byteLength(candidate),
    trusted_baseline_pin_matches:baselinePin===null ? "UNCHECKABLE_NO_EXTERNAL_PIN" : baselinePin===newDigest,
    // This intentionally demonstrates why a manifest recomputed by whoever
    // modified the source is insufficient. It verifies itself.
    untrusted_rehashed_manifest_self_consistent:sha(candidate)===newDigest,
  };
}
export function runSyntheticMutationStudy({n=BASELINE_RECORDS,counts=CHANGE_COUNTS,sample_stride=100}={}) {
  check(Number.isSafeInteger(sample_stride)&&sample_stride>0&&sample_stride<=n,"invalid sampling stride");
  const baseline=syntheticDocuments(n);
  const baselineBytes=serialized(baseline);
  const pin=sha(baselineBytes);
  const selected=selectMutationIds(n,counts);
  const cases=counts.map(k=>{
    const variant=mutateDocuments(baseline,selected.slice(0,k));
    const m=compareSnapshots(baseline,variant,{baselinePin:pin});
    check(m.change_count===k && !m.row_count_only_detected && !m.file_size_only_detected &&
      m.trusted_baseline_pin_matches===false,"mutation control failed");
    const sampled=m.changed_document_indices.filter(id=>id%sample_stride===0).length;
    return {
      changed_documents:k,
      prevalence_fraction:k/n,
      exact_changed_documents:m.change_count,
      corrupted_or_absent_source_records:0,
      baseline_sha256:pin,
      mutated_sha256:m.source_sha256_after,
      row_count_only_detection:"MISSED_SAME_COUNT",
      size_only_detection:"MISSED_SAME_SIZE",
      external_baseline_digest_comparison:"DETECTED_CHANGED_SOURCE_BYTES",
      item_hash_reconciliation:"DETECTED_ALL_CHANGED_DOCUMENTS",
      untrusted_rehashed_manifest_state:"SELF_CONSISTENT_BUT_NOT_AUTHENTICATED",
      deterministic_sample_stride:sample_stride,
      sampled_documents:Math.ceil(n/sample_stride),
      altered_documents_within_sample:sampled,
      sampled_check_state:sampled>0?"DETECTED_IN_THIS_FIXED_SAMPLE":"MISSED_IN_THIS_FIXED_SAMPLE",
      behavioral_model_inference:"NOT_RUN",
      semantic_poison_detection:"NOT_TESTED",
    };
  });
  return {
    schema:"csoai.synthetic-dataset-mutation-sensitivity/1",
    study_type:"DETERMINISTIC_SYNTHETIC_SOURCE_INTEGRITY",
    source_real:false,
    document_count:n,
    record_ids_unique:new Set(baseline.map(x=>x.doc_id)).size===n,
    baseline_sha256:pin,
    mutation_policy:{from:POLICY_FROM,to:POLICY_TO,byte_length_preserved:true,
      selection:"SHA-256 deterministic pseudorandom ordering; nested change sets"},
    cases,
    conclusions:[
      "An independently retained baseline digest detects even one changed byte; a recomputed untrusted hash alone does not authenticate a dataset",
      "Row count and file size checks miss all these same-length, same-record-count modifications",
      "The sample check is one deterministic illustration, not a statistical sensitivity estimate",
      "No AI model was trained or queried, so this does not measure the effect of 1/5/25/150 poisoned documents on model behavior",
      "No raw private dataset or proprietary model was used and no public GSPC axis was changed",
    ],
  };
}
const SELF=fileURLToPath(import.meta.url);
if(process.argv[1]&&resolve(process.argv[1])===SELF){
  const flags=Object.fromEntries(process.argv.slice(2).join(" ").split("--").filter(Boolean)
    .map(x=>{const [k,...v]=x.trim().split(/\s+/);return [k,v.join(" ")];}));
  try{
    check(flags.out,"required --out");
    const report=runSyntheticMutationStudy();
    writeFileSync(resolve(flags.out),JSON.stringify(report,null,2)+"\n");
    console.log(JSON.stringify({schema:report.schema,document_count:report.document_count,
      outcomes:report.cases.map(x=>({n:x.changed_documents,digest:x.external_baseline_digest_comparison,
        sampled:x.altered_documents_within_sample})),out:flags.out}));
  }catch(e){console.error(e.message??String(e));process.exitCode=2;}
}
