#!/usr/bin/env node
/**
 * Fail-closed GitHub Actions run origin contract for the GSPC evidence index.
 * A branch named "master" is not proof of a trusted main-repository run.
 * This validates GitHub's full run metadata AND an authenticated compare
 * response linking the exact source commit to current protected master.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rec=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
const sha=v=>typeof v==="string"&&/^[0-9a-f]{40}$/.test(v);
const allowed=new Set(["push","schedule","workflow_dispatch"]);
const check=(ok,reason)=>{
  if(!ok)throw Error("UNTRUSTED_GSPC_SOURCE_RUN: "+reason);
};
export function validateTrustedMasterRun(run,comparison,{
  repo="CSOAI-ORG/councilof-ai",workflowName,runId
}={}) {
  check(rec(run)&&rec(comparison),"run/ancestry metadata missing");
  check(typeof repo==="string"&&repo==="CSOAI-ORG/councilof-ai",
    "expected repository is not the canonical owner");
  check(typeof workflowName==="string"&&workflowName.startsWith("GSPC "),
    "expected workflow identity absent");
  check(Number.isSafeInteger(runId)&&runId>0&&run.id===runId,
    "selected Action ID does not bind the inspected run");
  check(run.name===workflowName,"workflow identity does not match source contract");
  check(run.repository?.full_name===repo &&
    run.head_repository?.full_name===repo,
    "head and executing repository must both be the canonical owner");
  check(allowed.has(run.event),"untrusted event; pull_request/fork events forbidden");
  check(run.head_branch==="master","upstream run is not on the protected master ref");
  check(run.status==="completed" && run.conclusion==="success",
    "latest trusted upstream run is missing, pending or failed");
  check(sha(run.head_sha),"trusted upstream Git commit SHA malformed");
  check(comparison.base_commit?.sha===run.head_sha &&
    comparison.merge_base_commit?.sha===run.head_sha,
    "upstream commit not the exact compare ancestor");
  check((comparison.status==="ahead"||comparison.status==="identical") &&
    comparison.behind_by===0 && Number.isSafeInteger(comparison.ahead_by) &&
    comparison.ahead_by>=0,
    "source commit not ancestor of current master (diverged or stale invalid history)");
  return {
    status:"TRUSTED_MASTER_ACTION_RUN_SOURCE_ONLY_NOT_AN_EXTERNAL_SIGNATURE",
    run_id:run.id,event:run.event,head_sha:run.head_sha,
    source_repo:repo,workflow:workflowName,ancestry:comparison.status,
  };
}
const self=fileURLToPath(import.meta.url);
if(process.argv[1]&&resolve(process.argv[1])===self) {
  const flags=Object.fromEntries(process.argv.slice(2).join(" ").split("--").filter(Boolean)
    .map(x=>{const [k,...v]=x.trim().split(/\s+/);return [k,v.join(" ")];}));
  try{
    check(flags.run&&flags.compare&&flags["workflow-name"]&&flags.id,
      "requires --run --compare --workflow-name --id");
    const run=JSON.parse(readFileSync(resolve(flags.run),"utf8"));
    const compare=JSON.parse(readFileSync(resolve(flags.compare),"utf8"));
    const receipt=validateTrustedMasterRun(run,compare,{
      runId:Number(flags.id),workflowName:flags["workflow-name"],
    });
    console.log(JSON.stringify(receipt));
  }catch(error){console.error(error.message??String(error));process.exitCode=2;}
}
