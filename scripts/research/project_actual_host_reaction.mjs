// SPDX-License-Identifier: Apache-2.0
// Real GitHub host-effect readback -> existing Council research reaction engine.
// Does NOT turn a provider ACK into human approval, MEOK permission, or buyer consent.
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {evaluateEpisode} from "../../measurement/experiments/reaction-bridge/reaction-bridge.mjs";
import {summarizeReactionCases} from "../../measurement/experiments/reaction-bridge/operating-view.mjs";
const digest=(b)=>createHash("sha256").update(b).digest("hex");
const EXPECTED="8064c4586f15d94994701910d81f7564c7a47cba33add3919adbae540bd8597f";
const METHOD="e8c365f826183fc0847696bf0995cf7192438865a05e9bfdf17da8bc25276352";
const COMMIT="41aa01f1e649eb265125bdc95bcb804d39ed46e7";
export function projectHostEffect(record,raw,actualFile,methodBytes) {
 if(record.schema!=="csoai.actual-external-host-effect-readback/0.1"||
    record.realm!=="OBSERVED"||
    record.git_commit!==COMMIT||
    record.actual_public_http_status!==200||
    record.actual_content_sha256!==EXPECTED||
    record.actual_bytes!==actualFile.byteLength||
    digest(actualFile)!==EXPECTED||
    record.expected_content_sha256!==EXPECTED||
    record.exact_match!==true||
    record.negative_wrong_path_get_status!==404||
    record.rejected_write_marker_found!==false||
    record.actual_external_storage_effect_observed!==true||
    record.live_meok_executor_used!==false||
    record.authenticated_human_approval_established!==false||
    record.independent_human_receiver_accepted!==false||
    record.customer_acceptance_established!==false||
    record.gspc_measurement_admitted!==false||
    record.method_source_sha256!==METHOD||
    digest(methodBytes)!==METHOD)
     throw Error("host effect source, exact bytes, method or qualification claim differs");
 const reported=(sha)=>({state:"REPORTED",receipt_sha256:sha,source_realm:"OBSERVED"});
 const unknown={state:"UNKNOWN",source_realm:"OBSERVED"};
 const ep={
    schema:"csoai.reaction-experiment/0.1",realm:"OBSERVED",
    condition:"HUMAN_INFORMATION",
    experiment_id:"real-github-host-20261124",case_id:"branch-write-readback",
    input_sha256:EXPECTED,method_sha256:METHOD,
    stages:{
      request:reported(EXPECTED),method:reported(METHOD),
      human_approval:unknown,executor_authority:unknown,
      executor_response:reported(digest(raw)),
      effect:reported(EXPECTED),
      receiver_verification:unknown,
      retrieval:reported(EXPECTED),
      payment:unknown,repeat_use:unknown
    }
 };
 const review=evaluateEpisode(ep);
 if(review.status!=="ACCEPTANCE_INCOMPLETE"||
    !review.missing_stages.includes("human_approval")||
    !review.missing_stages.includes("executor_authority")||
    !review.missing_stages.includes("receiver_verification")||
    review.missing_stages.includes("effect")||
    review.effect_independently_accepted!==false||
    review.execute_authorized!==false)throw Error("real host effect was incorrectly treated as authorized or independently accepted");
 return {
   schema:"csoai.actual-host-effect-reaction/0.1",
   observation_sha256:digest(raw),
   external_effect_bytes_sha256:EXPECTED,
   method_sha256:METHOD,
   episode:ep,review,
   operating_view:summarizeReactionCases([ep]),
   real_github_provider_storage_effect:true,
   true_meok_effect_prevention_established:false,
   verified_human_authority_established:false,
   receiving_party_human_acceptance_established:false
 };
}
if(process.argv[1]?.endsWith("project_actual_host_reaction.mjs")){
 try {
   const dataRoot=new URL("../../docs/research/turkish-guard-observed-20261124/",import.meta.url);
   const raw=readFileSync(new URL("actual-github-host-observation.json",dataRoot));
   const record=JSON.parse(raw.toString("utf8"));
   const actualFile=readFileSync(new URL("actual-github-effect.txt",dataRoot));
   const methodBytes=readFileSync(new URL("./verify_actual_github_effect.py",import.meta.url));
   process.stdout.write(JSON.stringify(projectHostEffect(record,raw,actualFile,methodBytes),null,2)+"\n");
 }catch(e){process.stderr.write("UNQUALIFIED HOST EFFECT: "+e.message+"\n");process.exitCode=2;}
}
