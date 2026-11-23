import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { auditRepeatIntegrity, summarizeRepeatRows } from "./gspc-repeat-integrity.mjs";

const sha=buffer=>createHash("sha256").update(buffer).digest("hex");

function fixture() {
  const root=mkdtempSync(join(tmpdir(),"csoai-repeat-integrity-test-"));
  const source=join(root,"source"), table=join(root,"table");
  mkdirSync(source);mkdirSync(table);mkdirSync(join(table,"gspc_measurements"));
  const first={axis:"safety",model:"fixture/A",item_id:"one",schema:"csoai.mill-item-evidence/0.3",
    bank_dataset:"csoai/fixture",bank_sha256:"b".repeat(64),model_hf_revision:"a".repeat(40),
    provider_route:"local:fixture",expected:"SAFE",observed:"SAFE",ok:true};
  const raw=JSON.stringify(first)+"\n";
  const name="items-safety-"+sha(raw).slice(0,12)+".jsonl";
  writeFileSync(join(source,name),raw);
  const meta={cell:name,cell_sha256:sha(raw),axis:"safety",axis_ambiguous:false,model:"fixture/A",
    model_ambiguous:false,schema:first.schema,bank_dataset:first.bank_dataset,
    bank_sha256:first.bank_sha256,model_hf_revision:first.model_hf_revision,
    provider_route:first.provider_route,n_rows:1,n_joined:1,n_skipped:0,n_ungraded:0,n_graded:1,n_ok:1,accuracy:1};
  const row={cell:name,axis:"safety",model:"fixture/A",item_id:"one",expected:"SAFE",
    observed:"SAFE",ok:true,raw_output_sha256:"c".repeat(64)};
  const part=JSON.stringify(row)+"\n";
  writeFileSync(join(table,"gspc_measurements/part-000.jsonl"),part);
  writeFileSync(join(table,"gspc_cells.jsonl"),JSON.stringify(meta)+"\n");
  const manifest={
    schema:"csoai.gspc-fact-table/0.1",
    source:{cell_files:1,source_rows:1,source_digest:sha(name+" "+sha(raw))},
    counts:{measurements:1,cells:1,rows_not_graded:0,rows_without_a_model:0},
    by_axis:{safety:1},by_model:{"fixture/A":1},
    tables:{measurements:{layout:"sharded",parts:[{file:"gspc_measurements/part-000.jsonl",rows:1,bytes:Buffer.byteLength(part)}],
      bytes:Buffer.byteLength(part),rows:1}},
  };
  const manifestPath=join(table,"MANIFEST.json");
  writeFileSync(manifestPath,JSON.stringify(manifest));
  return {root,source,table,manifest,manifestPath,name,first,meta,row};
}
function withinFixture(run){
  const f=fixture();
  try{return run(f);}
  finally{rmSync(f.root,{recursive:true,force:true});}
}

test("source boolean contract normalizes only exact raw grades, with fallback",async()=>{
  const {sourceFactGrade}=await import("./gspc-fact-row-contract.mjs");
  for(const [raw,grade] of [
    [{ok:true},true],[{ok:false},false],[{ok:"true"},true],[{ok:"false"},false],
    [{grade:true},true],[{grade:"false"},false],[{ok:null,grade:true},null],
    [{ok:1},null],[{ok:"TRUE"},null],[{ok:undefined,grade:false},false],
  ]) assert.equal(sourceFactGrade(raw),grade);
});

test("repeated grades are observations, not additional unique items",()=>{
  const cell={
    axis:"safety",axis_ambiguous:false,model_hf_revision:"a".repeat(40),bank_sha256:"b".repeat(64),
    provider_route:"fixture",n_rows:3,n_joined:3,n_skipped:0,
  };
  const idx=new Map([["cell-a",{...cell}],["cell-b",{...cell,n_rows:1,n_joined:1}]]);
  const rows=[
    {cell:"cell-a",axis:"safety",model:"vendor/A",item_id:"one",ok:true,observed:"SAFE",raw_output_sha256:"a"},
    {cell:"cell-a",axis:"safety",model:"vendor/A",item_id:"two",ok:null,observed:null,raw_output_sha256:null},
    {cell:"cell-a",axis:"safety",model:null,item_id:"three",ok:null,observed:null,raw_output_sha256:null},
    {cell:"cell-b",axis:"safety",model:"vendor/A",item_id:"one",ok:false,observed:"UNSAFE",raw_output_sha256:"b"},
  ];
  for (const row of rows) row._lineage={
    model_hf_revision:cell.model_hf_revision,bank_sha256:cell.bank_sha256,
    provider_route:cell.provider_route,
  };
  const a=summarizeRepeatRows(rows,idx);
  assert.equal(a.rows.rows,4);
  assert.equal(a.rows.rows_with_attributed_model,3);
  assert.equal(a.rows.rows_without_model,1);
  assert.equal(a.rows.rows_ungraded,2);
  assert.equal(a.coarse_identity.distinct_keys,2);
  assert.equal(a.coarse_identity.repeated_keys,1);
  assert.equal(a.coarse_identity.extra_rows_above_one_per_key,1);
  assert.equal(a.coarse_identity.grade_disagreement_keys,1);
  assert.equal(a.pinned_identity.distinct_keys,2);
  assert.equal(a.pinned_identity.grade_disagreement_keys,1);
  assert.equal(a.attributed_model_identifiers,1);
});

test("missing revision excludes only that row from pinned identity, not from source volume",()=>{
  const idx=new Map([["cell",{axis:"safety",axis_ambiguous:false,model_hf_revision:null,
    bank_sha256:"b",provider_route:"route",n_rows:1,n_joined:1,n_skipped:0}]]);
  const a=summarizeRepeatRows([{cell:"cell",axis:"safety",model:"vendor/A",item_id:"one",ok:null,
    observed:null,raw_output_sha256:null,_lineage:{model_hf_revision:null,
      bank_sha256:"b",provider_route:"route"}}],idx);
  assert.equal(a.rows.rows_without_complete_pinned_identity,1);
  assert.equal(a.coarse_identity.distinct_keys,1);
  assert.equal(a.pinned_identity.distinct_keys,0);
  assert.equal(a.rows.rows_ungraded,1);
});

test("per-observation lineage is mandatory: the cell header cannot silently substitute",()=>{
  const cell={axis:"safety",axis_ambiguous:false,model_hf_revision:"a".repeat(40),
    bank_sha256:"b".repeat(64),provider_route:"first-provider",n_rows:1,n_joined:1,n_skipped:0};
  assert.throws(()=>summarizeRepeatRows([{
    cell:"source",axis:"safety",model:"test/A",item_id:"one",ok:true
  }],new Map([["source",cell]])),/per-observation source lineage missing/);
});

test("same-cell mixed inference providers are distinct pinned identities, not one trial",()=>withinFixture(f=>{
  const from=[{...f.first,i:0,provider_route:"provider/A",raw_output_sha256:"d".repeat(64)},
    {...f.first,i:1,provider_route:"provider/B",ok:false,raw_output_sha256:"e".repeat(64)}];
  const raw=from.map(r=>JSON.stringify(r)).join("\n")+"\n";
  const name="items-safety-"+sha(raw).slice(0,12)+".jsonl";
  unlinkSync(join(f.source,f.name));
  writeFileSync(join(f.source,name),raw);
  const partRows=[{...f.row,i:0,cell:name,raw_output_sha256:"d".repeat(64)},
    {...f.row,i:1,cell:name,ok:false,raw_output_sha256:"e".repeat(64)}];
  const part=partRows.map(r=>JSON.stringify(r)).join("\n")+"\n";
  writeFileSync(join(f.table,"gspc_measurements/part-000.jsonl"),part);
  const meta={...f.meta,cell:name,cell_sha256:sha(raw),provider_route:"provider/A",
    n_rows:2,n_joined:2,n_graded:2,n_ok:1,accuracy:0.5};
  writeFileSync(join(f.table,"gspc_cells.jsonl"),JSON.stringify(meta)+"\n");
  const manifest={
    ...f.manifest,source:{cell_files:1,source_rows:2,source_digest:sha(name+" "+sha(raw))},
    counts:{...f.manifest.counts,measurements:2},by_axis:{safety:2},by_model:{"fixture/A":2},
    tables:{measurements:{...f.manifest.tables.measurements,rows:2,bytes:Buffer.byteLength(part),
      parts:[{file:"gspc_measurements/part-000.jsonl",rows:2,bytes:Buffer.byteLength(part)}]}},
  };
  writeFileSync(f.manifestPath,JSON.stringify(manifest));
  const x=auditRepeatIntegrity({manifestPath:f.manifestPath,evidenceDir:f.source});
  assert.equal(x.rows.rows,2);
  assert.equal(x.coarse_identity.distinct_keys,1);
  assert.equal(x.coarse_identity.grade_disagreement_keys,1);
  assert.equal(x.pinned_identity.distinct_keys,2);
  assert.equal(x.pinned_identity.grade_disagreement_keys,0);
  assert.equal(x.source_route_audit.cells_with_multiple_provider_routes,1);
  assert.equal(x.source_route_audit.source_observations_on_nonfirst_provider_route,1);
  assert.equal(x.source_route_audit.join_state,"ALL_RAW_OBSERVATIONS_LINKED_BIJECTIVELY");
  // The attacker can swap a true/false between observations without changing
  // bytes, counts, source digest, route identities or source output hashes.
  // This was a real reviewer repro; do not release forged contradiction counts.
  const swapped=partRows.map((row,i)=>JSON.stringify({...row,ok:i===0?false:true})).join("\n")+"\n";
  assert.equal(Buffer.byteLength(swapped),Buffer.byteLength(part));
  writeFileSync(join(f.table,"gspc_measurements/part-000.jsonl"),swapped);
  assert.throws(()=>auditRepeatIntegrity({manifestPath:f.manifestPath,evidenceDir:f.source}),
    /fact normalized grade differs from source fact-row contract/);
}));

test("same-length fact item-id spoof cannot invent a new item when raw source lacks explicit id",()=>withinFixture(f=>{
  const raw={...f.first,prompt_sha256:"a".repeat(64)};
  delete raw.item_id;
  const rawText=JSON.stringify(raw)+"\n";
  const newName="items-safety-"+sha(rawText).slice(0,12)+".jsonl";
  unlinkSync(join(f.source,f.name));
  writeFileSync(join(f.source,newName),rawText);
  const row={...f.row,cell:newName,i:0,item_id:raw.prompt_sha256,
    prompt_sha256:raw.prompt_sha256};
  const partFile=join(f.table,"gspc_measurements/part-000.jsonl");
  const good=JSON.stringify(row)+"\n";
  writeFileSync(partFile,good);
  writeFileSync(join(f.table,"gspc_cells.jsonl"),JSON.stringify({...f.meta,
    cell:newName,cell_sha256:sha(rawText)})+"\n");
  const manifest={...f.manifest,source:{...f.manifest.source,
    source_digest:sha(newName+" "+sha(rawText))},
    tables:{measurements:{...f.manifest.tables.measurements,
      bytes:Buffer.byteLength(good),
      parts:[{file:"gspc_measurements/part-000.jsonl",rows:1,bytes:Buffer.byteLength(good)}]}}};
  writeFileSync(f.manifestPath,JSON.stringify(manifest));
  assert.equal(auditRepeatIntegrity({manifestPath:f.manifestPath,evidenceDir:f.source})
    .coarse_identity.distinct_keys,1);
  const forged=JSON.stringify({...row,item_id:"b".repeat(64)})+"\n";
  assert.equal(Buffer.byteLength(forged),Buffer.byteLength(good));
  writeFileSync(partFile,forged);
  assert.throws(()=>auditRepeatIntegrity({manifestPath:f.manifestPath,evidenceDir:f.source}),
    /fact derived item_id differs from raw prompt SHA/);
}));

test("reader reproduces a complete source-bound positive fixture",()=>withinFixture(f=>{
  const a=auditRepeatIntegrity({manifestPath:f.manifestPath,evidenceDir:f.source});
  assert.equal(a.rows.rows,1);
  assert.equal(a.coarse_identity.distinct_keys,1);
  assert.equal(a.pinned_identity.distinct_keys,1);
  assert.equal(a.source_authentication,"DIGESTED_SOURCE_BYTES_NOT_SIGNED_OR_INDEPENDENTLY_REPRODUCED");
  assert.ok(!JSON.stringify(a).includes("fixture/A"),"aggregate report must not leak model-level rows");
}));

test("one source byte changed with the same row count invalidates the report",()=>withinFixture(f=>{
  const file=join(f.source,f.name);
  writeFileSync(file,JSON.stringify({...f.first,ok:false})+"\n");
  assert.throws(()=>auditRepeatIntegrity({manifestPath:f.manifestPath,evidenceDir:f.source}),/raw cell SHA\/physical denominators mismatch/);
}));

test("malformed source row fails closed instead of being dropped from denominator",()=>withinFixture(f=>{
  const file=join(f.source,f.name);
  writeFileSync(file,JSON.stringify(f.first)+"\n"+'{"axis":'+"\n");
  assert.throws(()=>auditRepeatIntegrity({manifestPath:f.manifestPath,evidenceDir:f.source}),/UNCHECKABLE.*malformed/);
}));

test("a forged per-axis map cannot turn safety coverage into jail coverage",()=>withinFixture(f=>{
  f.manifest.by_axis={jail:1};
  writeFileSync(f.manifestPath,JSON.stringify(f.manifest));
  assert.throws(()=>auditRepeatIntegrity({manifestPath:f.manifestPath,evidenceDir:f.source}),/manifest per-axis attribution differs/);
}));

test("a fabricated model revision in the cell index cannot create pinned lineage",()=>withinFixture(f=>{
  f.meta.model_hf_revision="d".repeat(40);
  writeFileSync(join(f.table,"gspc_cells.jsonl"),JSON.stringify(f.meta)+"\n");
  assert.throws(()=>auditRepeatIntegrity({manifestPath:f.manifestPath,evidenceDir:f.source}),/indexed model_hf_revision differs from raw source/);
}));

test("missing file or malformed fact row cannot produce a normal-looking summary",()=>withinFixture(f=>{
  const part=join(f.table,"gspc_measurements/part-000.jsonl");
  writeFileSync(part,'{"cell":\n');
  assert.throws(()=>auditRepeatIntegrity({manifestPath:f.manifestPath,evidenceDir:f.source}),/fact shard bytes mismatch|malformed/);
}));

test("current 53k-row corpus reconciles with attributed and pinned denominators",()=>{
  const root=resolve(new URL("../../",import.meta.url).pathname);
  const manifestPath=join(root,"public/interop/gspc-fact-table/MANIFEST.json");
  const evidenceDir=join(root,"public/interop/mill-evidence");
  if(!existsSync(manifestPath)||!existsSync(evidenceDir))return;
  const manifest=JSON.parse(readFileSync(manifestPath,"utf8"));
  const a=auditRepeatIntegrity({manifestPath,evidenceDir});
  assert.equal(a.rows.rows,manifest.counts.measurements);
  assert.equal(a.rows.rows_ungraded,manifest.counts.rows_not_graded);
  assert.equal(a.rows.rows_without_model,manifest.counts.rows_without_a_model);
  assert.equal(a.rows.rows_with_attributed_model+a.rows.rows_without_model,a.rows.rows);
  assert.equal(a.coarse_identity.distinct_keys+a.coarse_identity.extra_rows_above_one_per_key,
    a.rows.rows_with_attributed_model);
  assert.equal(a.pinned_identity.distinct_keys+a.pinned_identity.extra_rows_above_one_per_key,
    a.rows.rows_with_complete_pinned_identity);
  assert.equal(a.by_axis.reduce((n,row)=>n+row.rows,0),a.rows.rows);
  assert.equal(a.source_route_audit.join_state,"ALL_RAW_OBSERVATIONS_LINKED_BIJECTIVELY");
  assert.equal(a.source_route_audit.cells_with_multiple_provider_routes,208);
  assert.equal(a.source_route_audit.source_observations_on_nonfirst_provider_route,1289);
  assert.equal(a.pinned_identity.distinct_keys,11800);
  assert.equal(a.pinned_identity.grade_disagreement_keys,105);
});
