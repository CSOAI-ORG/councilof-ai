#!/usr/bin/env node
/**
 * Portable OpenLineage JobEvent adapter for one READ-ONLY GSPC coverage artifact.
 *
 * This is STATIC LINEAGE METADATA — there is no RunEvent with an invented START
 * or COMPLETE execution, no outgoing HTTP request and no third-party acceptance.
 * Consumers can inspect source and qualification facets without promoting a
 * measured axis into a certified or independently verified model claim.
 *
 * node scripts/measurements/gspc-coverage-openlineage.mjs
 *   --coverage coverage.json --commit <40-hex-commit> --out openlineage.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA="https://openlineage.io/spec/2-0-2/OpenLineage.json#/$defs/JobEvent";
const COMMIT=/^[0-9a-f]{40}$/;
const HEX=/^[0-9a-f]{64}$/;
const ok=(cond,msg)=>{if(!cond)throw Error("UNCHECKABLE OpenLineage export: "+msg);};
const object=v=>v!==null && typeof v==="object" && !Array.isArray(v);
const repo="https://github.com/CSOAI-ORG/councilof-ai";
const raw="https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai";

export function coverageJobEvent(coverage, revision, eventTime = new Date().toISOString()) {
  ok(COMMIT.test(revision),"immutable source commit SHA required");
  ok(!Number.isNaN(Date.parse(eventTime)) && /Z$/.test(eventTime),"UTC eventTime required");
  ok(object(coverage) && coverage.schema==="csoai.gspc-evidence-coverage/1" &&
     coverage.state==="READ_ONLY_SOURCE_COVERAGE_NOT_AN_ADMISSION" &&
     coverage.source_authentication==="DIGESTED_BYTES_NOT_SIGNATURE_VERIFIED",
     "signed, graded, unsupported or missing coverage state");
  const s=coverage.sources,c=coverage.counts;
  ok(object(s) && HEX.test(s.board_sha256) && HEX.test(s.fact_manifest_sha256) && HEX.test(s.fact_cell_source_digest),
    "all three input source pins required");
  ok(object(c) && Number.isSafeInteger(c.board_axes) && c.board_axes===coverage.axes?.length &&
     Number.isSafeInteger(c.fact_rows) && c.fact_rows>=0 &&
     Number.isSafeInteger(c.board_legacy_method_gaps) && c.board_legacy_method_gaps>=0 &&
     Number.isSafeInteger(c.board_untested_separations) && c.board_untested_separations>=0,
     "axis/row source qualifiers not present");
  ok(object(coverage.delta) && typeof coverage.delta.state==="string" && coverage.delta.state.length>0,
     "source delta absent");
  const producer=`${repo}/blob/${revision}/scripts/measurements/gspc-coverage-openlineage.mjs`;
  const customSchema=`${raw}/${revision}/schemas/gspc-coverage-openlineage-job-facet.schema.json`;
  return {
    schemaURL:SCHEMA,
    eventTime,
    // JobEvent records static lineage. It does not assert a run occurred, was
    // signed, was delivered remotely, or passed independent verification.
    producer,
    job:{
      namespace:repo,
      name:"scripts/measurements/gspc-coverage-feed.mjs",
      facets:{
        csoai_coverage:{
          _producer:producer,
          _schemaURL:customSchema,
          coverage_schema:coverage.schema,
          coverage_state:coverage.state,
          source_authentication:coverage.source_authentication,
          source_digests:{
            board_sha256:s.board_sha256,
            fact_manifest_sha256:s.fact_manifest_sha256,
            fact_cell_source_digest:s.fact_cell_source_digest,
          },
          source_delta:coverage.delta.state,
          counts:{
            board_axes:c.board_axes,
            fact_rows:c.fact_rows,
            legacy_method_gaps:c.board_legacy_method_gaps,
            untested_separations:c.board_untested_separations,
          },
          limits:{
            grade:"NOT_ASSERTED",
            signature_verified:false,
            actual_human_approval:"NOT_TESTED",
            data_transmission:"NO_EVENT_SENT",
          },
        },
      },
    },
    inputs:[
      {namespace:"csoai.pipeline-source",name:"source-board.json"},
      {namespace:"csoai.pipeline-source",name:"source-fact-manifest.json"},
    ],
    outputs:[{namespace:"csoai.pipeline-derived",name:"coverage.json"}],
  };
}
const SELF=fileURLToPath(import.meta.url);
if(process.argv[1] && resolve(process.argv[1])===SELF){
  const flags=Object.fromEntries(process.argv.slice(2).join(" ").split("--").filter(Boolean).map(v=>{
    const [k,...rest]=v.trim().split(/\s+/);return [k,rest.join(" ")];
  }));
  try{
    ok(flags.coverage && flags.commit && flags.out,"required --coverage --commit --out");
    const coverage=JSON.parse(readFileSync(resolve(flags.coverage),"utf8"));
    const event=coverageJobEvent(coverage,flags.commit);
    writeFileSync(resolve(flags.out),JSON.stringify(event,null,2)+"\n");
    console.log(JSON.stringify({kind:"JobEvent",not_sent:true,job:event.job.name,out:flags.out}));
  }catch(error){
    console.error(error instanceof Error?error.message:String(error));
    process.exitCode=2;
  }
}
