#!/usr/bin/env node
/**
 * GSPC master engine: deterministic, read-only cross-source index.
 * A join over 3 independently versioned research artifacts, not new scoring.
 * It refuses inconsistent SHA pins, denominators, fake model findings,
 * unsupported states and promotion of synthetic controls into board axes.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const sha=b=>createHash("sha256").update(b).digest("hex");
const hex=s=>typeof s==="string"&&/^[a-f0-9]{64}$/.test(s);
const number=n=>Number.isSafeInteger(n)&&n>=0;
const rec=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
const check=(ok,why)=>{if(!ok)throw Error("UNCHECKABLE GSPC engine index: "+why);};
const MUTATION_LEVELS=[1,5,25,150];

export function produceEvidenceEngineIndex(coverage,repeat,mutation,hashes,runIds=null) {
  check(rec(coverage) &&
    coverage.schema==="csoai.gspc-evidence-coverage/1" &&
    coverage.state==="READ_ONLY_SOURCE_COVERAGE_NOT_AN_ADMISSION" &&
    coverage.source_authentication==="DIGESTED_BYTES_NOT_SIGNATURE_VERIFIED",
    "coverage input not an unsigned, read-only source projection");
  check(rec(repeat) &&
    repeat.schema==="csoai.gspc-repeat-integrity/1" &&
    repeat.state==="EXPLORATORY_SOURCE_RECONCILED_NOT_A_MODEL_GRADE" &&
    repeat.source_authentication==="DIGESTED_SOURCE_BYTES_NOT_SIGNED_OR_INDEPENDENTLY_REPRODUCED",
    "repeat audit missing or incorrectly authenticated");
  check(rec(mutation) &&
    mutation.schema==="csoai.synthetic-dataset-mutation-sensitivity/1" &&
    mutation.study_type==="DETERMINISTIC_SYNTHETIC_SOURCE_INTEGRITY" &&
    mutation.source_real===false &&
    mutation.reference_pin_state==="GIT_REVIEWABLE_REFERENCE_NO_EXTERNAL_SIGNATURE",
    "synthetic byte-integrity experiment missing or misrepresented");
  check(rec(hashes) && ["coverage","repeat","mutation"].every(k=>hex(hashes[k])),
    "all report-byte hashes required");

  const c=coverage.counts,r=repeat.rows;
  check(rec(c)&&rec(r)&&rec(coverage.sources)&&rec(repeat.sources)&&Array.isArray(coverage.axes)&&Array.isArray(repeat.by_axis),
    "missing axes, counts or source pins");
  check(hex(coverage.sources.board_sha256) &&
    hex(coverage.sources.fact_manifest_sha256) && hex(coverage.sources.fact_cell_source_digest) &&
    coverage.sources.fact_manifest_sha256===repeat.sources.manifest_sha256 &&
    coverage.sources.fact_cell_source_digest===repeat.sources.raw_cell_digest_sha256,
    "source manifest or original cell digests disagree across independent consumers");
  check(number(c.board_axes)&&c.board_axes===coverage.axes.length &&
    number(c.board_measured_axes)&&number(c.board_model_comparison_axes)&&
    number(c.board_separated_leads)&&number(c.board_ties)&&number(c.board_untested_separations)&&
    c.board_separated_leads+c.board_ties+c.board_untested_separations===c.board_model_comparison_axes,
    "board axes or comparison separation denominator inconsistent");
  check(number(c.fact_rows)&&c.fact_rows===r.rows &&
    number(c.fact_ungraded_rows)&&c.fact_ungraded_rows===r.rows_ungraded &&
    number(c.fact_unattributed_model_rows)&&c.fact_unattributed_model_rows===r.rows_without_model &&
    number(c.fact_cells)&&c.fact_cells===repeat.sources.cell_files &&
    number(c.fact_axes)&&c.fact_axes===repeat.by_axis.length &&
    number(c.fact_model_identifiers)&&c.fact_model_identifiers===repeat.attributed_model_identifiers,
    "qualified source table row/axis/model counts disagree");
  const axisIndex=new Map();
  for(const axis of coverage.axes){
    check(rec(axis)&&typeof axis.axis==="string"&&number(axis.per_item_rows)&&!axisIndex.has(axis.axis),
      "invalid or duplicated GSPC axis in coverage feed");
    axisIndex.set(axis.axis,axis);
  }
  let joined=0;
  for(const row of repeat.by_axis){
    check(rec(row)&&typeof row.axis==="string"&&number(row.rows)&&
      axisIndex.get(row.axis)?.per_item_rows===row.rows,
      "repeat-source axis attribution differs from canonical coverage: "+row?.axis);
    joined+=row.rows;
  }
  check(joined===r.rows,"per-axis repeated-observation denominator incomplete");
  for(const field of ["coarse_identity","pinned_identity"]){
    const g=repeat[field];
    check(rec(g)&&number(g.distinct_keys)&&number(g.repeated_keys)&&number(g.extra_rows_above_one_per_key)&&
      number(g.grade_disagreement_keys),"missing observation grouping "+field);
    const expected=field==="coarse_identity"?r.rows_with_attributed_model:r.rows_with_complete_pinned_identity;
    check(number(expected)&&g.distinct_keys+g.extra_rows_above_one_per_key===expected,
      "non-independent repeat volume or denominator mismatch "+field);
  }
  check(number(r.rows_with_attributed_model)&&r.rows_with_attributed_model+r.rows_without_model===r.rows,
    "unattributed observation rows are unaccounted for");

  check(mutation.document_count===10000&&mutation.record_ids_unique===true&&hex(mutation.baseline_sha256) &&
    Array.isArray(mutation.cases)&&mutation.cases.length===4 &&
    mutation.cases.every((m,i)=>rec(m)&&m.changed_documents===MUTATION_LEVELS[i]&&
      m.exact_changed_documents===MUTATION_LEVELS[i]&&
      m.row_count_only_detection==="MISSED_SAME_COUNT"&&
      m.size_only_detection==="MISSED_SAME_SIZE"&&
      m.versioned_reference_digest_comparison==="DETECTED_CHANGED_SOURCE_BYTES"&&
      m.behavioral_model_inference==="NOT_RUN"&&m.semantic_poison_detection==="NOT_TESTED"),
    "synthetic research control drift; refuse semantic poisoning claims");
  const sourceRuns={};
  if(runIds!==null){
    check(rec(runIds),"run metadata must be a map");
    for(const name of ["coverage","repeat","mutation"]){
      const id=runIds[name];
      check(Number.isSafeInteger(id)&&id>0,"successful GitHub run id absent: "+name);
      sourceRuns[name]="https://github.com/CSOAI-ORG/councilof-ai/actions/runs/"+id;
    }
  }
  return {
    schema:"csoai.gspc-evidence-engine-index/1",
    state:"SOURCE_RECONCILED_RESEARCH_INDEX_NOT_SIGNED_OR_ADMITTED",
    authority:"NONE: does not certify models, grant agent authority or accept human decisions",
    sources:{
      gspc_board_digest:coverage.sources.board_sha256,
      fact_manifest_digest:coverage.sources.fact_manifest_sha256,
      physical_cell_source_digest:coverage.sources.fact_cell_source_digest,
      verified_input_artifact_sha256:{coverage:hashes.coverage,repeat:hashes.repeat,mutation:hashes.mutation},
      github_action_runs:sourceRuns,
    },
    measurements:{
      board_axes:c.board_axes,
      board_measured_axes:c.board_measured_axes,
      model_comparison_axes:c.board_model_comparison_axes,
      separated_leads:c.board_separated_leads,
      ties:c.board_ties,
      untested_separations:c.board_untested_separations,
      fact_axes:c.fact_axes,
      per_item_observation_rows:c.fact_rows,
      source_cells:c.fact_cells,
      distinct_attributed_model_identifiers:c.fact_model_identifiers,
      ungraded_observation_rows:c.fact_ungraded_rows,
      unattributed_model_observation_rows:c.fact_unattributed_model_rows,
      legacy_method_axis_gaps:c.board_legacy_method_gaps,
      distinct_attributed_model_axis_item_keys:repeat.coarse_identity.distinct_keys,
      repeated_model_axis_item_keys:repeat.coarse_identity.repeated_keys,
      additional_repeat_observation_rows:repeat.coarse_identity.extra_rows_above_one_per_key,
      differently_graded_repeat_groups:repeat.coarse_identity.grade_disagreement_keys,
      distinct_fully_declared_lineage_keys:repeat.pinned_identity.distinct_keys,
      differently_graded_declared_lineage_groups:repeat.pinned_identity.grade_disagreement_keys,
    },
    separate_synthetic_research:{
      baseline_documents:mutation.document_count,
      baseline_sha256:mutation.baseline_sha256,
      mutation_counts:mutation.cases.map(x=>x.changed_documents),
      byte_source_revisions_detected:mutation.cases.map(x=>x.exact_changed_documents),
      model_poisoning_effect:"NOT_TESTED",
      reference_authentication:mutation.reference_pin_state,
    },
    next_quality_queues:[
      {id:"legacy-method",open_axis_rows:c.board_legacy_method_gaps,effect:"method reconstruction and independent review required"},
      {id:"statistical-separation",open_axis_rows:c.board_untested_separations,effect:"paired observations and uncertainty tests needed"},
      {id:"ungraded-rows",open_observations:c.fact_ungraded_rows,effect:"recover output/grade provenance; never relabel as safe"},
      {id:"unattributed-model",open_observations:c.fact_unattributed_model_rows,effect:"recover source model identity before qualified comparison"},
      {id:"repeated-grade-differences",open_identity_groups:repeat.pinned_identity.grade_disagreement_keys,effect:"investigate repeated-run conditions without inferring misconduct"},
    ],
    limitations:[
      "This is an unsigned read-model joined from checked CI artifacts, not a root-included GSPC measurement",
      "Measured axis count is not proof of separated leader, reproducibility, methodology quality, or vendor safety",
      "Distinct model-axis-item keys are not statistically independent model evaluations",
      "Synthetic document byte checks do not establish training-data poisoning detection or model behavior changes",
      "No signer, identity, external institutional adoption, real paid buyer or remote consumer acceptance was tested",
    ],
  };
}
/**
 * Master-only current-checkout guard. Historic successful Actions artifacts can
 * be internally consistent but already STALE against today's master branch.
 * Reconcile actual source bytes, not just manifest head-counts, before mirror.
 * This is local checkout identity, NEVER an independent external signature.
 */
export function verifyCurrentCheckoutPins(index,{manifestPath,evidenceDir,referencePath}) {
  check(rec(index?.sources)&&rec(index?.measurements)&&rec(index?.separate_synthetic_research),
    "index source manifest/data absent");
  check(typeof manifestPath==="string"&&typeof evidenceDir==="string"&&typeof referencePath==="string",
    "master checkout paths are required");
  const bytes=readFileSync(resolve(manifestPath));
  check(sha(bytes)===index.sources.fact_manifest_digest,
    "historical Actions fact manifest differs from current checkout");
  const manifest=JSON.parse(bytes);
  check(rec(manifest.source)&&hex(manifest.source.source_digest),
    "current fact manifest source pin absent");
  const files=readdirSync(resolve(evidenceDir))
    .filter(f=>f.startsWith("items-")&&f.endsWith(".jsonl")).sort();
  check(files.length>0&&files.every(f=>/^items-[a-z0-9-]+-[a-f0-9]+\.jsonl$/.test(f)),
    "current source inventory has invalid cell filenames");
  check(files.length===manifest.source.cell_files &&
    files.length===index.measurements.source_cells,
    "current source cells differ from historic qualified evidence");
  let observedRows=0;
  const parts=[];
  for(const file of files){
    const buf=readFileSync(join(resolve(evidenceDir),file));
    const lines=buf.toString("utf8").split("\n").filter(x=>x.trim());
    check(lines.length>0,"current evidence has an empty source cell "+file);
    for(const [i,line] of lines.entries()){
      let record;
      try{record=JSON.parse(line);}
      catch{check(false,"current evidence has invalid source JSON "+file+":"+(i+1));}
      check(rec(record),"current source cell contains a non-object row");
    }
    observedRows+=lines.length;
    parts.push(file+" "+sha(buf));
  }
  const currentDigest=sha(parts.join("\n"));
  check(observedRows===manifest.source.source_rows,
    "current physical row denominator differs from source manifest");
  check(currentDigest===manifest.source.source_digest &&
    currentDigest===index.sources.physical_cell_source_digest,
    "current physical cell digest differs from successful Actions artifact");
  const pinned=readFileSync(resolve(referencePath),"utf8").trim();
  check(hex(pinned) && pinned===index.separate_synthetic_research.baseline_sha256,
    "synthetic control reference changed since successful Actions artifact");
  return {
    state:"SOURCE_BYTES_MATCH_CURRENT_CHECKOUT_UNWITNESSED",
    manifest_sha256:sha(bytes),
    physical_cell_source_digest:currentDigest,
    physical_cell_files:files.length,
    physical_source_rows:observedRows,
    synthetic_reference_digest:pinned,
  };
}

export function readEvidenceIndex({coverage,repeat,mutation,runIds=null}){
  const files={coverage,repeat,mutation};
  const body={},hashes={};
  for (const [key,filename] of Object.entries(files)) {
    check(typeof filename==="string"&&filename.length>0,"source file missing "+key);
    const raw=readFileSync(resolve(filename));
    hashes[key]=sha(raw);
    body[key]=JSON.parse(raw);
  }
  return produceEvidenceEngineIndex(body.coverage,body.repeat,body.mutation,hashes,runIds);
}
const self=fileURLToPath(import.meta.url);
if(process.argv[1]&&resolve(process.argv[1])===self){
  const flags=Object.fromEntries(process.argv.slice(2).join(" ").split("--").filter(Boolean)
    .map(x=>{const [k,...v]=x.trim().split(/\s+/);return [k,v.join(" ")];}));
  try{
    check(flags.coverage&&flags.repeat&&flags.mutation&&flags.out,"required --coverage --repeat --mutation --out");
    const runIds=flags["run-metadata"]?JSON.parse(readFileSync(resolve(flags["run-metadata"]),"utf8")):null;
    const index=readEvidenceIndex({...flags,runIds});
    const freshnessFlags=["current-manifest","current-evidence","synthetic-reference"];
    const present=freshnessFlags.filter(k=>Boolean(flags[k]));
    check(present.length===0 || present.length===freshnessFlags.length,
      "checkout verification requires --current-manifest --current-evidence --synthetic-reference together");
    if(present.length===freshnessFlags.length) {
      index.checkout_validation=verifyCurrentCheckoutPins(index,{
        manifestPath:flags["current-manifest"],evidenceDir:flags["current-evidence"],
        referencePath:flags["synthetic-reference"],
      });
    }
    writeFileSync(resolve(flags.out),JSON.stringify(index,null,2)+"\n");
    console.log(JSON.stringify({state:index.state,
      board_axes:index.measurements.board_axes,
      source_rows:index.measurements.per_item_observation_rows,
      distinct_keys:index.measurements.distinct_attributed_model_axis_item_keys,out:flags.out}));
  }catch(error){console.error(error.message??String(error));process.exitCode=2;}
}
