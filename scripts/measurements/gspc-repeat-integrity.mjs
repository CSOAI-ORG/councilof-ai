#!/usr/bin/env node
/**
 * Evidence-diversity audit for the existing mill fact table.
 *
 * Non-goals: no deduplication of canonical evidence, no grading, benchmark
 * promotion, trust signature, model fitness verdict, or independent-run claim.
 * Every repeated observation is retained and counted; uniqueness is scoped.
 *
 * node scripts/measurements/gspc-repeat-integrity.mjs \
 *   --manifest public/interop/gspc-fact-table/MANIFEST.json \
 *   --evidence public/interop/mill-evidence \
 *   --out /tmp/gspc-repeat-integrity.json
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const digest = raw => createHash("sha256").update(raw).digest("hex");
const rec = obj => obj !== null && typeof obj === "object" && !Array.isArray(obj);
const integer = n => Number.isSafeInteger(n) && n >= 0;
const fail = msg => { throw Error("UNCHECKABLE repeat-integrity: "+msg); };
const check = (v,msg) => { if(!v) fail(msg); };
const key = (...parts) => JSON.stringify(parts);
const increment = (obj,k,n=1) => {obj[k]=(obj[k]??0)+n;};
const cellName = f => /^items-[a-z0-9-]+-[a-f0-9]+\.jsonl$/.test(f);

function lines(raw,label) {
  return raw.toString("utf8").split("\n").flatMap((line,i) => {
    if(!line.trim())return [];
    try {
      const r=JSON.parse(line);
      check(rec(r),label+" non-object row at "+(i+1));
      return [r];
    }catch(e){fail(label+" malformed at "+(i+1)+": "+(e.message.startsWith("UNCHECKABLE")?"non-object JSON":"unparseable JSON"));}
  });
}
const group = (m,k,grade) => {
  let g=m.get(k);
  if(!g){g={rows:0,grades:new Set(),missing_grade:false};m.set(k,g);}
  g.rows++;
  if(grade===null)g.missing_grade=true;
  else g.grades.add(grade);
};
const summaries = groups => {
  let repeated_keys=0,extra_rows_above_one_per_key=0,grade_disagreement_keys=0,keys_with_missing_grade=0;
  for (const g of groups.values()) {
    if(g.rows>1) {repeated_keys++;extra_rows_above_one_per_key+=g.rows-1;}
    if(g.grades.size===2)grade_disagreement_keys++;
    if(g.missing_grade)keys_with_missing_grade++;
  }
  return {distinct_keys:groups.size,repeated_keys,extra_rows_above_one_per_key,
    grade_disagreement_keys,keys_with_missing_grade};
};

export function summarizeRepeatRows(rows, cellIndex) {
  check(Array.isArray(rows) && rows.length>0,"no fact rows");
  check(cellIndex instanceof Map && cellIndex.size>0,"cell metadata index absent");
  const coarse=new Map(), pinned=new Map(), axes=new Map(), perCell=new Map(), models=new Set();
  const m={
    rows:0,rows_with_attributed_model:0,rows_without_model:0,
    rows_ungraded:0,rows_missing_observed:0,rows_missing_raw_output_digest:0,
    rows_missing_model_revision:0,rows_missing_bank_digest:0,rows_missing_provider_route:0,
    rows_without_complete_pinned_identity:0,rows_with_complete_pinned_identity:0,
  };
  for (const r of rows) {
    check(rec(r) && typeof r.cell==="string" && cellIndex.has(r.cell),"unknown cell reference");
    check(typeof r.axis==="string" && r.axis.length>0 &&
      typeof r.item_id==="string" && r.item_id.length>0 &&
      (r.model===null || (typeof r.model==="string" && r.model.length>0)) &&
      (r.ok===null || r.ok===true || r.ok===false),"invalid identity or grade");
    const cell=cellIndex.get(r.cell);
    if(typeof cell.axis==="string" && cell.axis && cell.axis!==r.axis &&
       !cell.axis_ambiguous)fail("cell index axis disagrees for "+r.cell);
    m.rows++;
    perCell.set(r.cell,(perCell.get(r.cell)??0)+1);
    let a=axes.get(r.axis);
    if(!a){a={axis:r.axis,rows:0,rows_ungraded:0,rows_without_model:0,
      coarse:new Map(),pinned:new Map(),rows_without_complete_pinned_identity:0};axes.set(r.axis,a);}
    a.rows++;
    if(r.ok===null){m.rows_ungraded++;a.rows_ungraded++;}
    if(r.observed===null || r.observed===undefined)m.rows_missing_observed++;
    if(!r.raw_output_sha256)m.rows_missing_raw_output_digest++;
    if(r.model===null){m.rows_without_model++;a.rows_without_model++;continue;}
    m.rows_with_attributed_model++;
    models.add(r.model);
    const coarseKey=key(r.axis,r.model,r.item_id);
    group(coarse,coarseKey,r.ok);
    group(a.coarse,coarseKey,r.ok);
    const hasRev=typeof cell.model_hf_revision==="string" && /^[0-9a-f]{40}$/.test(cell.model_hf_revision);
    const hasBank=typeof cell.bank_sha256==="string" && /^[0-9a-f]{64}$/.test(cell.bank_sha256);
    const hasRoute=typeof cell.provider_route==="string" && cell.provider_route.trim().length>0;
    if(!hasRev)m.rows_missing_model_revision++;
    if(!hasBank)m.rows_missing_bank_digest++;
    if(!hasRoute)m.rows_missing_provider_route++;
    if(!hasRev||!hasBank||!hasRoute){
      m.rows_without_complete_pinned_identity++;
      a.rows_without_complete_pinned_identity++;
      continue;
    }
    m.rows_with_complete_pinned_identity++;
    const pinnedKey=key(r.axis,r.model,cell.model_hf_revision,cell.bank_sha256,cell.provider_route,r.item_id);
    group(pinned,pinnedKey,r.ok);
    group(a.pinned,pinnedKey,r.ok);
  }
  for (const [cell,n] of perCell) {
    const c=cellIndex.get(cell);
    check(c.n_joined===n,"cell joined-row count disagrees "+cell);
  }
  for(const [cell,c] of cellIndex){
    check(perCell.has(cell),"index cell has no rows "+cell);
    check(integer(c.n_rows) && integer(c.n_joined) && integer(c.n_skipped) &&
      c.n_joined+c.n_skipped===c.n_rows,"cell source-row denominator inconsistent "+cell);
  }
  const byAxis=[...axes.values()].map(a=>({
    axis:a.axis,rows:a.rows,rows_ungraded:a.rows_ungraded,rows_without_model:a.rows_without_model,
    rows_without_complete_pinned_identity:a.rows_without_complete_pinned_identity,
    coarse_identity:summaries(a.coarse),
    pinned_identity:summaries(a.pinned),
  })).sort((a,b)=>a.axis.localeCompare(b.axis));
  return {
    rows:m,
    attributed_model_identifiers:models.size,
    coarse_identity:summaries(coarse),
    pinned_identity:summaries(pinned),
    by_axis:byAxis,
  };
}

export function auditRepeatIntegrity({manifestPath,evidenceDir}) {
  const manifestBytes=readFileSync(resolve(manifestPath));
  const manifest=JSON.parse(manifestBytes);
  check(manifest.schema==="csoai.gspc-fact-table/0.1" &&
    rec(manifest.counts) && rec(manifest.source) &&
    rec(manifest.tables?.measurements) && Array.isArray(manifest.tables.measurements.parts),
    "unsupported or incomplete source manifest");
  const dir=dirname(resolve(manifestPath));
  const files=readdirSync(resolve(evidenceDir)).filter(f=>f.startsWith("items-")&&f.endsWith(".jsonl")).sort();
  check(files.length>0 && files.every(cellName),"missing or invalid source file universe");
  const sourceDigestLines=[];
  let physicalRows=0;
  const sources=new Map();
  for (const file of files){
    const raw=readFileSync(join(resolve(evidenceDir),file));
    const rows=lines(raw,"source "+file);
    check(rows.length>0,"empty source cell "+file);
    physicalRows+=rows.length;
    const hash=digest(raw);
    sources.set(file,{hash,rows:rows.length,first:rows[0]});
    sourceDigestLines.push(file+" "+hash);
  }
  const sourceDigest=digest(sourceDigestLines.join("\n"));
  check(sourceDigest===manifest.source.source_digest &&
    files.length===manifest.source.cell_files &&
    physicalRows===manifest.source.source_rows,
    "raw cell SHA/physical denominators mismatch");

  const indexRows=lines(readFileSync(join(dir,"gspc_cells.jsonl")),"cell index");
  const index=new Map();
  for(const cell of indexRows){
    check(typeof cell.cell==="string" && sources.has(cell.cell) && !index.has(cell.cell),
      "extra, missing or duplicate index cell");
    const raw=sources.get(cell.cell);
    check(cell.cell_sha256===raw.hash && cell.n_rows===raw.rows,"index cell digest/row count mismatch");
    // The indexed lineage is a derived convenience, not a new source of
    // authority: pin every version/bank/route facet to the first RAW row.
    // Otherwise a forged metadata index can manufacture a false pinned key.
    for (const field of ["schema","bank_dataset","bank_sha256","model_hf_revision","provider_route"]) {
      check((cell[field]??null)===(raw.first[field]??null),
        "indexed "+field+" differs from raw source cell "+cell.cell);
    }
    index.set(cell.cell,cell);
  }
  check(index.size===files.length && index.size===manifest.counts.cells,"cell index does not cover source");

  const factRows=[], axisCounts=Object.create(null),modelCounts=Object.create(null);
  let totalBytes=0;
  const parts=manifest.tables.measurements.parts;
  check(parts.length>0,"fact shards absent");
  const seen=new Set();
  for(const part of parts){
    check(typeof part.file==="string" && /^gspc_measurements\/part-[0-9]{3}\.jsonl$/.test(part.file) &&
      !seen.has(part.file),"invalid/duplicate fact shard path");
    seen.add(part.file);
    const bytes=readFileSync(join(dir,part.file));
    check(bytes.length===part.bytes,"fact shard bytes mismatch "+part.file);
    totalBytes+=bytes.length;
    const batch=lines(bytes,"fact shard "+part.file);
    check(batch.length===part.rows,"fact shard row denominator mismatch "+part.file);
    for(const r of batch) {
      check(typeof r.axis==="string" && r.axis.length>0 &&
        (typeof r.model==="string" || r.model===null),"fact axis/model missing");
      increment(axisCounts,r.axis);
      increment(modelCounts,r.model??"(unattributed)");
    }
    factRows.push(...batch);
  }
  check(totalBytes===manifest.tables.measurements.bytes &&
    factRows.length===manifest.counts.measurements,"manifest/real shard totals disagree");
  const normalized=x=>JSON.stringify(Object.entries(x).sort(([a],[b])=>a.localeCompare(b)));
  check(normalized(axisCounts)===normalized(manifest.by_axis),"manifest per-axis attribution differs from fact rows");
  check(normalized(modelCounts)===normalized(manifest.by_model),"manifest per-model attribution differs from fact rows");
  const report=summarizeRepeatRows(factRows,index);
  check(report.rows.rows===manifest.counts.measurements &&
    report.rows.rows_ungraded===manifest.counts.rows_not_graded &&
    report.rows.rows_without_model===manifest.counts.rows_without_a_model,
    "fact grading/lineage counts differ from manifest");
  return {
    schema:"csoai.gspc-repeat-integrity/1",
    state:"EXPLORATORY_SOURCE_RECONCILED_NOT_A_MODEL_GRADE",
    source_authentication:"DIGESTED_SOURCE_BYTES_NOT_SIGNED_OR_INDEPENDENTLY_REPRODUCED",
    sources:{
      manifest_sha256:digest(manifestBytes),
      raw_cell_digest_sha256:sourceDigest,
      cell_files:files.length,
      fact_parts:parts.length,
      physical_source_rows:physicalRows,
    },
    ...report,
    limitations:[
      "Observation rows are not independent test items, unique evaluation runs or unique customers",
      "Repeated model-axis-item keys may reflect valid repeated trials; grade changes do not prove misconduct or poisoning",
      "A complete model/bank/provider key is not proof of independent run, fixed decoding settings or exact model weights",
      "Null grades and missing outputs are UNGRADED/UNCHECKABLE, never scored as false, clean or safe",
      "This artifact does not modify or certify the GSPC 34-axis board or create any new separation verdict",
      "Authenticity against an attacker able to rewrite both evidence and hashes requires independent signed pins",
    ],
  };
}
const self=fileURLToPath(import.meta.url);
if(process.argv[1]&&resolve(process.argv[1])===self){
  const flags=Object.fromEntries(process.argv.slice(2).join(" ").split("--").filter(Boolean)
    .map(chunk=>{const [k,...v]=chunk.trim().split(/\s+/);return [k,v.join(" ")];}));
  try{
    check(flags.manifest&&flags.evidence&&flags.out,"required --manifest, --evidence and --out");
    const report=auditRepeatIntegrity({manifestPath:flags.manifest,evidenceDir:flags.evidence});
    writeFileSync(resolve(flags.out),JSON.stringify(report,null,2)+"\n");
    console.log(JSON.stringify({state:report.state,rows:report.rows.rows,
      coarse:report.coarse_identity,pinned:report.pinned_identity,out:flags.out}));
  }catch(error){console.error(error.message??String(error));process.exitCode=2;}
}
