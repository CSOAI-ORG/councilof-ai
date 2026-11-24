// SPDX-License-Identifier: Apache-2.0
// Read-only projection from the Council's EXISTING candidate HITL authority-effect/0.2.
// This is not schema validation, custody verification, current revocation check, human
// identity verification, receiver confirmation, canonical storage or permission to act.
import {isSha,evaluateEpisode} from "./reaction-bridge.mjs";

const HAS_OWN=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
function obj(v){return v!==null&&typeof v==="object"&&!Array.isArray(v);}
function digest(v){return obj(v)&&v.alg==="sha256"&&isSha(v.value)?v.value:null;}
function reported(hex,realm){
  return hex?{state:"REPORTED",receipt_sha256:hex,source_realm:realm}:{state:"UNKNOWN",source_realm:realm};
}
export function projectHitlCandidateV02({
  record,experiment_id,case_id,input_sha256,method_sha256,
  realm,condition,executor_authority_receipt_sha256=null,
  receiver_receipt_sha256=null
}) {
  if(!obj(record)||record.profile!=="csoai.hitl-authority-effect/0.2"||
     !obj(record.request)||!obj(record.authority)||!obj(record.invocation)||
     !obj(record.effect)||!obj(record.verification)||!Array.isArray(record.limits)){
    throw Error("unknown, incomplete or unsupported HITL candidate profile");
  }
  if(!isSha(input_sha256)||!isSha(method_sha256)){
    throw Error("source and method digest pins required; do not infer them");
  }
  if(!["SIMULATED","OBSERVED"].includes(realm)||!["NO_HUMAN","HUMAN_INFORMATION","HUMAN_APPROVAL"].includes(condition)){
    throw Error("realm and information condition must be explicitly supplied");
  }
  if(executor_authority_receipt_sha256!==null&&!isSha(executor_authority_receipt_sha256))throw Error("invalid executor-authority receipt pin");
  if(receiver_receipt_sha256!==null&&!isSha(receiver_receipt_sha256))throw Error("invalid receiving-party receipt pin");
  // A profile's "VERIFIED" label does not identify its verifier as independent of
  // the task, nor establish that the receiver actually witnessed an effect.
  const reportedHumanReview=record.authority.decision==="APPROVE" &&
    record.authority.review_kind==="HUMAN_REVIEW" &&
    digest(record.authority.external_record_digest);
  const reportedInvocation=record.invocation.state==="EXECUTED" &&
    digest(record.invocation.invocation_digest);
  const reportedEffect=record.effect.state==="OBSERVED" &&
    digest(record.effect.effect_digest);
  const reportedReceiver=record.verification.state==="VERIFIED" &&
    reportedEffect && receiver_receipt_sha256;
  const episode={
    schema:"csoai.reaction-experiment/0.1",
    realm,condition,experiment_id,case_id,input_sha256,method_sha256,
    stages:{
      request:reported(digest(record.request.proposal_digest),realm),
      method:reported(method_sha256,realm),
      human_approval:reported(reportedHumanReview,realm),
      executor_authority:reported(executor_authority_receipt_sha256,realm),
      executor_response:reported(reportedInvocation,realm),
      effect:reported(reportedEffect,realm),
      receiver_verification:reported(reportedReceiver,realm)
    }
  };
  // Reuse the ONLY research evaluator; do not return direct source-provided
  // actor refs, private case content, authority decisions or execution rights.
  evaluateEpisode(episode);
  return episode;
}
