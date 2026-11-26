// Private local draft only. Port of Experiment Studio v3 handoff for the existing #4826 projection.
// No network, persistence, measurement, signing, publication or execution.
function object(x){return x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype}

function bounded(x,n){return typeof x==="string"&&x.trim().length>0&&x.length<=n&&!/[\u0000-\u001f\u007f<>]/.test(x)}

function iso(x){return typeof x==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(x)&&Number.isFinite(Date.parse(x))}

function requireThat(ok,msg){if(!ok)throw Error(msg)}

export function validateResearchProjection(value,now=Date.now()){
 const d=value,s=d?.source,c=d?.coverage,p=d?.pathways;
 requireThat(object(d)&&d.schema==="csoai.councilos-eat-research-commons/0.1"&&d.state==="FREE_DISCOVERY_ONLY","Research source held or invalid");
 requireThat(object(s)&&s.url==="https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/auto-eat-feed/public/interop/auto-eat/research-commons.json"&&s.branch_isolate==="auto-eat-feed"&&s.freshness==="FRESH"&&s.signature_verification==="NOT_PERFORMED"&&s.independent_source_verification===false&&typeof s.source_sha256==="string"&&/^[a-f0-9]{64}$/.test(s.source_sha256)&&iso(s.observed_at)&&iso(s.read_at)&&Number.isFinite(now)&&Date.parse(s.observed_at)<=Date.parse(s.read_at)&&Date.parse(s.read_at)<=now+300000&&now-Date.parse(s.observed_at)<=172800000,"Source provenance or freshness invalid");
 requireThat(object(p)&&p.independent_human_approval_issued===false&&p.model_or_tool_execution_performed===false&&p.endorsement_or_certification===false&&p.source_evidence_copies_redistributed===false&&p.fee_for_this_read===0,"Unexpected authority or effect");
 requireThat(object(c)&&c.full_global_coverage===false&&Array.isArray(d.repositories)&&d.repositories.length>0&&d.repositories.length<=18&&c.repositories_checked===d.repositories.length,"Invalid coverage");
 const seen=new Set(),out=[];let unknown=0;
 for(const r of d.repositories){
  requireThat(object(r)&&bounded(r.repository,150)&&/^[A-Za-z0-9_-][A-Za-z0-9_.-]*\/[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(r.repository)&&!seen.has(r.repository.toLowerCase())&&bounded(r.project_role,90)&&bounded(r.candidate_experiment,90)&&r.licence_review==="REQUIRED"&&r.human_reviewer_state==="UNASSIGNED"&&r.independent_validation==="NOT_PERFORMED","Invalid source record");
  seen.add(r.repository.toLowerCase());
  if(r.status==="SOURCE_UNCHECKABLE"){requireThat(r.observed_source_revision===null&&r.source_declared_license===null,"Unchecked source has revision");unknown++;continue}
  requireThat(r.status==="SOURCE_METADATA_OBSERVED"&&typeof r.observed_source_revision==="string"&&/^[a-f0-9]{40}$/.test(r.observed_source_revision)&&(r.source_declared_license===null||bounded(r.source_declared_license,100)),"Invalid source revision");
  out.push({repository:r.repository,revision:r.observed_source_revision,declaredLicense:r.source_declared_license,proposal:r.candidate_experiment,role:r.project_role});
 }
 requireThat(c.repositories_observed===out.length&&c.repositories_uncheckable===unknown,"Coverage mismatch");
 return {observedAt:s.observed_at,sourceSha256:s.source_sha256,candidates:out,uncheckable:unknown};
}

export function createResearchDraft(projection,repository,input,now=Date.now()){
 const source=validateResearchProjection(projection,now);
 const item=source.candidates.find(r=>r.repository===repository);requireThat(item,"Select an observed source");
 const fields=["role","question","baseline","candidate","metric","direction","threshold","sampleSize"];
 requireThat(object(input)&&Object.keys(input).length===fields.length&&fields.every(k=>Object.hasOwn(input,k)),"Unexpected draft input");
 requireThat(["public","sme","researcher","regulator","developer","reviewer"].includes(input.role)&&[input.question,input.baseline,input.candidate].every(x=>bounded(x,1000)),"Complete role, hypothesis and comparators");
 requireThat(["accuracy","recall","false_positive_rate","latency_ms","review_time_ms"].includes(input.metric)&&["at_least","at_most"].includes(input.direction)&&typeof input.threshold==="number"&&Number.isFinite(input.threshold)&&input.threshold>=0&&(!["accuracy","recall","false_positive_rate"].includes(input.metric)||input.threshold<=1)&&Number.isSafeInteger(input.sampleSize)&&input.sampleSize>0&&input.sampleSize<=10000,"Invalid metric, threshold or planned sample size");
 return {schema:"csoai.experiment-studio-draft/0.1",classification:"PROPOSED",visibility:"private",role:input.role,question:input.question,baseline:input.baseline,candidate:input.candidate,metric:input.metric,direction:input.direction,threshold:input.threshold,planned_sample_size:input.sampleSize,source:{repository:item.repository,url:"https://github.com/"+item.repository,revision:item.revision,declared_license:item.declaredLicense,rights:"UNREVIEWED",snapshot_sha256:source.sourceSha256,observed_at:source.observedAt,proposal:item.proposal,provenance:"UNSIGNED_SOURCE_METADATA_NOT_INDEPENDENTLY_VERIFIED"},controls:["positive","negative","missing-input","held-out"],gates:["verify-source-bytes","review-code-data-model-rights","freeze-method-and-bank","authenticate-scope","qualify-executor","independent-review"],test_state:"NOT_RUN",method:"NOT_FROZEN",human_review:"UNASSIGNED",execute_authorized:false,publication_authorized:false,gspc_admitted:false,independently_verified:false};
}
