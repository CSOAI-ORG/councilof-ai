#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Compose an actual observed model-output report into the existing READ-ONLY
// reaction bridge. No model/tool/host action, signer, receipt issuer, payment or API.
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {evaluateEpisode} from "../../measurement/experiments/reaction-bridge/reaction-bridge.mjs";
import {summarizeReactionCases} from "../../measurement/experiments/reaction-bridge/operating-view.mjs";

const isHex=(s)=>typeof s==="string"&&/^[a-f0-9]{64}$/.test(s);
const pin=(s)=>{if(!isHex(s))throw Error("missing exact 64-character source digest");return s;};
export function projectObservedModelRun(record, bytes) {
  if(!record||typeof record!=="object"||Array.isArray(record)||
    record.schema!=="csoai.multilingual-guard-observation/0.1"||
    record.realm!=="OBSERVED_MODEL_OUTPUTS_ONLY"||
    record.rows!==3372||record.positive_labelled!==317||record.benign_labelled!==3055||
    record.threshold!==0.5||record.gspc_measurement_admitted!==false||
    record.external_receiving_party_acceptance!==false||
    record.real_tool_execution_tested!==false||
    record.model_production_prevention_proven!==false||
    record.raw_prompts_redistributed!==false||
    record.output_status!=="UNSIGNED_SELF_RUN_RESEARCH_NOT_GSPC_QUALIFIED")
    throw Error("not a qualified pinned model-output observation");
  const c=record.confusion;
  if(!c||[c.tp,c.tn,c.fp,c.fn].some(n=>!Number.isSafeInteger(n)||n<0)||
     c.tp+c.fn!==317||c.fp+c.tn!==3055||
     !Array.isArray(record.missed_indices)||record.missed_indices.length!==c.fn||
     !Array.isArray(record.false_alarm_indices)||record.false_alarm_indices.length!==c.fp)
    throw Error("row population arithmetic mismatch");
  const source=pin(record.dataset_parquet_sha256);
  const method=pin(record.method_sha256);
  const actualMethod=createHash("sha256").update(readFileSync(new URL("./turkish_guard_observed.py",import.meta.url))).digest("hex");
  if(source!=="1f00c9a3639ec307538e45dcbd4a7397a908fea125c682156bfc3331b5fda5b5" ||
     method!==actualMethod ||
     record.dataset_revision!=="bf31d065f96a82a8d615863b8ae8da532651f7f2" ||
     record.model_revision!=="2efc2ed5abecd21eb45c2506d231a65d6e392b85" ||
     record.weights_sha256!=="61cd0741cdbfcc229e32e1de1392f352736d87d1e8b3c2b67ad9836bb7910d5d")
    throw Error("model/source/method changed; refuse provenance promotion");
  const output=pin(createHash("sha256").update(bytes).digest("hex"));
  const reported=(receipt_sha256)=>({state:"REPORTED",receipt_sha256,source_realm:"OBSERVED"});
  const unknown=()=>({state:"UNKNOWN",source_realm:"OBSERVED"});
  const episode={
    schema:"csoai.reaction-experiment/0.1",
    realm:"OBSERVED",condition:"NO_HUMAN",
    experiment_id:"turkish-guard-20261124",case_id:"published-3372",
    input_sha256:source,method_sha256:method,
    stages:{
      request:reported(source),
      method:reported(method),
      human_approval:unknown(),
      executor_authority:unknown(),
      executor_response:unknown(),
      effect:unknown(),
      receiver_verification:unknown(),
      retrieval:reported(source),
      payment:unknown(),
      repeat_use:unknown()
    }
  };
  const review=evaluateEpisode(episode);
  if(review.status!=="ACCEPTANCE_INCOMPLETE"||review.execute_authorized||
     review.effect_independently_accepted||review.fresh_gspc_measurement)
    throw Error("actual model output was incorrectly promoted to a qualified effect");
  return {
    schema:"csoai.observed-model-reaction-projection/0.1",
    observed_model_output_sha256:output,
    source_dataset_sha256:source,
    model_weights_sha256:pin(record.weights_sha256),
    sample_population:record.rows,
    confusion:c,method_sha256:method,
    episode,review,
    operating_view:summarizeReactionCases([episode]),
    role:"READ_ONLY_OPERATOR_RESEARCH",
    qualified_model_security_prevention:false,
    buyer_receipt:false
  };
}

if(process.argv[1]?.endsWith("project_turkish_reaction.mjs")){
  try{
    if(process.argv.length!==3)throw Error("usage: node project_turkish_reaction.mjs public-record.json");
    const bytes=readFileSync(process.argv[2]);
    if(bytes.byteLength>256*1024)throw Error("bounded public record exceeds 256 KiB");
    const record=JSON.parse(bytes.toString("utf8"));
    process.stdout.write(JSON.stringify(projectObservedModelRun(record,bytes),null,2)+"\n");
  }catch(e){
    process.stderr.write("REVIEW REFUSED: "+e.message+"\n");
    process.exitCode=2;
  }
}
