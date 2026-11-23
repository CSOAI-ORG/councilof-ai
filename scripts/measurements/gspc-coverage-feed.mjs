#!/usr/bin/env node
/**
 * Source-bound, read-only GSPC coverage projection.
 * No admission, signing, grading, model safety verdict or website mutation.
 * The mill fact table covers SOME axes and is not a replacement for the board.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const SCHEMA = "csoai.gspc-evidence-coverage/1";
const HEX = /^[0-9a-f]{64}$/;
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const int = x => Number.isSafeInteger(x) && x >= 0;
const rec = x => x && typeof x === "object" && !Array.isArray(x);
const check = (yes, message) => { if (!yes) throw Error("UNCHECKABLE GSPC coverage: " + message); };

/** Independently derive the manifest's source pin from the *actual* item-cell
 * bytes. Both a missing file and a changed file must block claimed completeness.
 * Only the per-item items-*.jsonl cells are the input universe, not every asset
 * in mill-evidence (e.g. frozen canary banks).
 */
export function readCellSourceDigest(dir) {
  const files=readdirSync(resolve(dir)).filter(n=>n.startsWith("items-") && n.endsWith(".jsonl")).sort();
  check(files.length>0, "no source item cells available for independent source check");
  let physicalRows=0;
  const lines=[];
  for(const name of files) {
    const bytes=readFileSync(join(resolve(dir),name));
    const text=bytes.toString("utf8").split("\n");
    const rows=text.filter(line=>line.trim());
    check(rows.length>0,"empty source cell: "+name);
    // The fact-table parser separately verifies the JSON row schema; here the
    // source byte digest and physical denominator are independently verified.
    physicalRows+=rows.length;
    lines.push(name+" "+sha(bytes));
  }
  return {cell_files:files.length,source_rows:physicalRows,source_digest:sha(lines.join("\n"))};
}

/** Reconstruct each axis/model attribution from the real sharded fact rows.
 * The source digest alone does not bind a manifest's by_axis map: a falsified
 * mapping can preserve all source counts and still misreport coverage.
 * This check also rejects missing, extra, non-object and incomplete rows.
 */
export function readFactShardAttribution(manifest, manifestPath, sourceTableDir = dirname(resolve(manifestPath))) {
  const table=manifest?.tables?.measurements;
  check(table?.layout==="sharded" && Array.isArray(table.parts) && table.parts.length>0,
    "measurement shard layout missing");
  const axes=Object.create(null);
  const models=Object.create(null);
  const seen=new Set();
  let rows=0,bytes=0,ungraded=0,missingModel=0;
  const root=resolve(sourceTableDir);
  for (const part of table.parts) {
    check(typeof part.file==="string" &&
      /^gspc_measurements\/part-[0-9]{3}\.jsonl$/.test(part.file) &&
      !seen.has(part.file), "invalid or duplicate fact shard path");
    seen.add(part.file);
    const blob=readFileSync(join(root,part.file));
    check(blob.length===part.bytes,"fact shard byte length mismatch "+part.file);
    bytes+=blob.length;
    let partRows=0;
    for(const [i,line] of blob.toString("utf8").split("\n").entries()) {
      if(!line.trim())continue;
      let r;
      try{r=JSON.parse(line);}
      catch{throw Error("UNCHECKABLE GSPC coverage: invalid fact JSONL "+part.file+":"+(i+1));}
      check(rec(r) && typeof r.axis==="string" && r.axis.length>0 &&
        typeof r.item_id==="string" && r.item_id.length>0 &&
        (r.model===null || (typeof r.model==="string" && r.model.length>0)) &&
        (r.ok===null || r.ok===true || r.ok===false),
        "missing/invalid axis, model, item or grade in "+part.file+":"+(i+1));
      const model=r.model??"(unattributed)";
      axes[r.axis]=(axes[r.axis]??0)+1;
      models[model]=(models[model]??0)+1;
      if(r.model===null)missingModel++;
      if(r.ok===null)ungraded++;
      rows++;partRows++;
    }
    check(partRows===part.rows,"fact shard row count mismatch "+part.file);
  }
  check(rows===manifest.counts.measurements && bytes===table.bytes,"fact shard totals differ");
  const normalized=v=>JSON.stringify(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)));
  check(normalized(axes)===normalized(manifest.by_axis),"by_axis attribution does not match source fact rows");
  check(normalized(models)===normalized(manifest.by_model),"by_model attribution does not match source fact rows");
  check(ungraded===manifest.counts.rows_not_graded && missingModel===manifest.counts.rows_without_a_model,
    "ungraded/unattributed row totals do not match source fact rows");
  return {axes,models,rows,bytes,ungraded,missingModel};
}

export function deriveCoverage(board, fact, inputs, previous = null) {
  check(rec(board) && Array.isArray(board.axes) && rec(board.totals), "board axes or totals absent");
  check(rec(fact) && fact.schema === "csoai.gspc-fact-table/0.1", "fact manifest schema absent");
  check(rec(inputs) && HEX.test(inputs.board_sha256) && HEX.test(inputs.fact_manifest_sha256), "input byte digests absent");
  const t = board.totals, c = fact.counts, source = fact.source;
  check(rec(c) && rec(source) && rec(fact.by_axis) && rec(fact.by_model) && rec(fact.tables), "fact source/counts absent");
  if(inputs.independent_table!==undefined) {
    const observed=inputs.independent_table;
    check(rec(observed) && observed.rows===c.measurements && observed.ungraded===c.rows_not_graded &&
      observed.missingModel===c.rows_without_a_model,
      "independent fact shard reconciliation failed");
  }
  if(inputs.independent_source!==undefined) {
    const observed=inputs.independent_source;
    check(rec(observed) &&
      observed.source_digest===source.source_digest &&
      observed.source_rows===source.source_rows &&
      observed.cell_files===source.cell_files,
      "independent raw cell hash/count does not match the published manifest");
  }
  for (const key of ["axes","measured_axes","comparison_axes","separated_leads","ties","untested_separations"])
    check(int(t[key]), "board total " + key + " absent");
  for (const key of ["measurements","items","cells","axes","models","rows_without_a_model","rows_without_an_axis","rows_not_graded","rows_dropped_as_malformed"])
    check(int(c[key]), "fact count " + key + " absent");
  check(int(source.cell_files) && int(source.source_rows) && HEX.test(source.source_digest), "source digest/cell count absent");
  check(t.axes === board.axes.length && t.measured_axes === board.axes.filter(a => a?.status === "MEASURED").length, "board axis count mismatch");
  check(t.comparison_axes === board.axes.filter(a => a?.kind === "model-comparison").length, "model comparison denominator mismatch");
  const ids=board.axes.map(a => a?.axis);
  check(ids.every(id => typeof id === "string" && id.length > 0) && new Set(ids).size === ids.length, "missing/duplicate board axis identities");
  const comparison=board.axes.filter(a => a.kind === "model-comparison");
  const separated=comparison.filter(a => a.separation === "SEPARATED").length;
  const ties=comparison.filter(a => a.separation === "TIE").length;
  const untested=comparison.filter(a => a.separation === "UNTESTED").length;
  check(separated===t.separated_leads && ties===t.ties && untested===t.untested_separations &&
    separated+ties+untested===comparison.length, "board statistical separation states disagree");

  const table=fact.tables.measurements;
  check(rec(table) && table.layout === "sharded" && Array.isArray(table.parts), "measurement shard manifest absent");
  check(table.parts.every(p=>rec(p) && typeof p.file==="string" && int(p.rows) && int(p.bytes)),"invalid shard");
  check(table.parts.reduce((n,p)=>n+p.rows,0)===c.measurements && table.rows===c.measurements, "shard/manifest row mismatch");
  check(table.parts.reduce((n,p)=>n+p.bytes,0)===table.bytes,"shard byte count mismatch");
  check(Object.values(fact.by_axis).every(int) && Object.values(fact.by_axis).reduce((a,b)=>a+b,0)===c.measurements,"by-axis rows mismatch");
  check(Object.values(fact.by_model).every(int) && Object.values(fact.by_model).reduce((a,b)=>a+b,0)===c.measurements,"by-model rows mismatch");
  check(Object.keys(fact.by_axis).length===c.axes && Object.keys(fact.by_model).filter(x=>x!=="(unattributed)").length===c.models,"axis/model distinct-count mismatch");
  check(fact.by_model["(unattributed)"] === c.rows_without_a_model || (!fact.by_model["(unattributed)"] && c.rows_without_a_model===0),"unattributed model count mismatch");
  check(source.cell_files === c.cells,"source cells mismatch");
  check(source.source_rows === c.measurements + c.rows_without_an_axis + c.rows_dropped_as_malformed,
    "physical source rows unaccounted for");
  const axisRecords=board.axes.map(a=>{
    const rows=fact.by_axis[a.axis] ?? 0;
    check(int(rows),"invalid per-axis row count " + a.axis);
    const method=typeof a.method_status==="string" && a.method_status.trim() ? a.method_status : null;
    return {
      axis:a.axis, family:a.family ?? null, kind:a.kind ?? null,
      board_status:a.status ?? "NOT_DECLARED",
      method_status:method,
      method_state:method?.startsWith("legacy:") ? "LEGACY_METHOD_GAP" : method==="meets-rule" ? "RULE_DECLARED_NOT_EXTERNALLY_VERIFIED" : "METHOD_UNCHECKABLE",
      per_item_rows:rows,
      per_item_state:rows ? "ROWS_IN_THIS_FACT_TABLE" : "NOT_REPRESENTED_IN_THIS_FACT_TABLE",
      separation_state:a.kind==="model-comparison" ? a.separation : "NOT_APPLICABLE",
      published_run_attestation:a.run_attestation ?? "NOT_DECLARED",
      observation_time:a.measurement_time ?? null,
      note:rows ? "These are per-item mill rows, not an admission or a unique model count" :
        "No per-item rows here; this does NOT negate other evidence recorded on the board",
    };
  });
  const tableOnly=Object.keys(fact.by_axis).filter(k=>!ids.includes(k));
  const methodGaps=axisRecords.filter(a=>a.method_state==="LEGACY_METHOD_GAP").map(a=>({axis:a.axis,method:a.method_status}));
  const sources={
    board_sha256:inputs.board_sha256,
    fact_manifest_sha256:inputs.fact_manifest_sha256,
    fact_cell_source_digest:source.source_digest,
    fact_manifest_generator_commit:fact.generator_commit ?? null,
  };
  let delta={state:"BASELINE_NO_PREVIOUS_SNAPSHOT",rows_change:null,source_changed:null,
    note:"No independent prior source pin was supplied; first observation is not evidence of a newly measured model"};
  if(previous!==null) {
    check(rec(previous) && previous.schema===SCHEMA && rec(previous.sources) && rec(previous.counts),
      "previous coverage artifact unsupported");
    check(HEX.test(previous.sources.fact_cell_source_digest) &&
      HEX.test(previous.sources.fact_manifest_sha256) &&
      HEX.test(previous.sources.board_sha256) && int(previous.counts.fact_rows),
      "previous source pins uncheckable");
    const factChanged=previous.sources.fact_cell_source_digest !== sources.fact_cell_source_digest;
    const manifestChanged=previous.sources.fact_manifest_sha256 !== sources.fact_manifest_sha256;
    const boardChanged=previous.sources.board_sha256 !== sources.board_sha256;
    const rowDelta=c.measurements-previous.counts.fact_rows;
    delta={
      state:factChanged ?
        (rowDelta===0 ? "SOURCE_CHANGED_SAME_ROW_COUNT_REEVALUATE" : "SOURCE_CHANGED_REEVALUATE") :
        (manifestChanged ? "FACT_PROJECTION_CHANGED_REEVALUATE" :
        (boardChanged ? "BOARD_BYTES_CHANGED_REVIEW" : "NO_SOURCE_BYTES_CHANGED")),
      rows_change:rowDelta, source_changed:factChanged, fact_manifest_changed:manifestChanged, board_bytes_changed:boardChanged,
      note:"Byte change is a revision requiring validation; it does not establish poisoning, improvement, safe behavior or a new admitted score",
    };
  }
  return {
    schema:SCHEMA,
    state:"READ_ONLY_SOURCE_COVERAGE_NOT_AN_ADMISSION",
    source_authentication:"DIGESTED_BYTES_NOT_SIGNATURE_VERIFIED",
    sources,
    counts:{
      board_axes:t.axes,board_measured_axes:t.measured_axes,board_model_comparison_axes:t.comparison_axes,
      board_separated_leads:t.separated_leads,board_ties:t.ties,board_untested_separations:t.untested_separations,
      fact_axes:c.axes,fact_rows:c.measurements,fact_cells:c.cells,fact_items:c.items,
      fact_model_identifiers:c.models,fact_unattributed_model_rows:c.rows_without_a_model,
      fact_ungraded_rows:c.rows_not_graded,
      board_axes_with_fact_rows:axisRecords.filter(a=>a.per_item_rows>0).length,
      board_axes_without_fact_rows:axisRecords.filter(a=>a.per_item_rows===0).length,
      board_legacy_method_gaps:methodGaps.length,
      fact_axis_ids_not_on_board:tableOnly.length,
    },
    legacy_method_gaps:methodGaps,
    fact_axis_ids_not_on_board:tableOnly,
    axes:axisRecords,
    delta,
    consumer_rules:[
      "MEASURED on the board is not equivalent to method-qualified, separately ranked or independently reproduced",
      "No per-item mill rows in THIS table does not mean that an axis has no other evidence",
      "Missing/invalid source records must be UNCHECKABLE, not counted as clean or as verified negative",
      "A changed digest even at the same row count requires source review; a count alone is not an integrity proof",
      "The projection has not verified any Ed25519 signer, Merkle inclusion, third-party model execution, user identity, or regulatory conformity",
    ],
  };
}

export function readCoverage(args) {
  const boardBytes=readFileSync(resolve(args.board));
  const manifestBytes=readFileSync(resolve(args.manifest));
  const prev=args.previous ? JSON.parse(readFileSync(resolve(args.previous),"utf8")) : null;
  const tableDir=resolve(args.table ?? dirname(resolve(args.manifest)));
  if (args.table) {
    const canonical=readFileSync(join(tableDir,"MANIFEST.json"));
    check(sha(canonical)===sha(manifestBytes),
      "staged manifest bytes differ from source table-root manifest");
  }
  check(args.evidence, "independent --evidence directory is required; manifest digest alone is not proof");
  return deriveCoverage(JSON.parse(boardBytes),JSON.parse(manifestBytes),
    {board_sha256:sha(boardBytes),fact_manifest_sha256:sha(manifestBytes),
      independent_source:readCellSourceDigest(args.evidence),
      independent_table:readFactShardAttribution(JSON.parse(manifestBytes),args.manifest,tableDir)},prev);
}

const SELF=fileURLToPath(import.meta.url);
if(process.argv[1] && resolve(process.argv[1])===SELF){
  const flags=Object.fromEntries(process.argv.slice(2).join(" ").split("--").filter(Boolean).map(v=>{
    const [k,...rest]=v.trim().split(/\s+/);return [k,rest.join(" ")];
  }));
  try {
    check(flags.board && flags.manifest && flags.evidence && flags.out, "required --board --manifest --evidence --out");
    const output=readCoverage(flags);
    writeFileSync(resolve(flags.out),JSON.stringify(output,null,2)+"\n");
    console.log(JSON.stringify({state:output.state,counts:output.counts,delta:output.delta,out:flags.out}));
  } catch(error){
    console.error(error instanceof Error?error.message:String(error));
    process.exitCode=2;
  }
}
