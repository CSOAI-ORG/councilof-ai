export const EVIDENCE_FOUNDATIONS_SCHEMA = "csoai.s06-evidence-foundations/0.1" as const;

export type EvidenceFoundationsLessonId =
  | "source-identity"
  | "signature-limits"
  | "missing-evidence"
  | "material-change"
  | "escalation-abstention"
  | "corrections-maintenance";

export type EvidenceChoice = { id:string; label:string; explanation:string; correct:boolean };
export type EvidenceExercise = {
  id:string; prompt:string; choices:readonly EvidenceChoice[];
  sourceNote:string; kind:"TEACHING"|"ASSESSMENT";
};
export type EvidenceFoundationsLesson = {
  id:EvidenceFoundationsLessonId; title:string; objective:string; sourceBoundary:string;
  teaching:EvidenceExercise; assessment:EvidenceExercise;
};

const freezeExercise=(x:EvidenceExercise):EvidenceExercise=>Object.freeze({
  ...x, choices:Object.freeze(x.choices.map((c)=>Object.freeze({...c}))),
});
const lesson=(id:EvidenceFoundationsLessonId,title:string,objective:string,sourceBoundary:string,
  teaching:EvidenceExercise,assessment:EvidenceExercise):EvidenceFoundationsLesson=>Object.freeze({
    id,title,objective,sourceBoundary,teaching:freezeExercise(teaching),assessment:freezeExercise(assessment),
  });

export const EVIDENCE_FOUNDATIONS_LESSONS:readonly EvidenceFoundationsLesson[]=Object.freeze([
lesson("source-identity","Know what the source actually is",
"Distinguish a source identity from claims made about that source.",
"A URL, issuer name, signature or file hash identifies an object; it does not establish that every statement inside it is correct.",
{id:"source-identity-teaching",kind:"TEACHING",prompt:"A vendor page and a retained digest refer to the same document. What has been established?",sourceNote:"Synthetic teaching example.",choices:[
{id:"a",label:"The document identity can be checked against the retained digest.",correct:true,explanation:"Correct. Identity/integrity can be checked without assuming the claims are true."},
{id:"b",label:"Every claim in the document is now independently verified.",correct:false,explanation:"No. Document identity and claim verification are separate."},
{id:"c",label:"The vendor is automatically compliant.",correct:false,explanation:"No compliance conclusion follows from document identity."}]},
{id:"source-identity-assessment",kind:"ASSESSMENT",prompt:"A policy PDF is replaced but keeps the same filename. What should the workflow do first?",sourceNote:"Synthetic assessment case; different from the teaching example.",choices:[
{id:"a",label:"Treat it as unchanged because the path is unchanged.",correct:false,explanation:"The path alone is insufficient."},
{id:"b",label:"Compare the actual content identity and preserve the previous version.",correct:true,explanation:"Correct. Content identity and history should be checked before downstream conclusions are reused."},
{id:"c",label:"Delete the old copy and continue.",correct:false,explanation:"Deleting history breaks correction and maintenance evidence."}]}),

lesson("signature-limits","Understand what a signature proves",
"Separate origin/integrity evidence from truth, quality and compliance.",
"A valid signature can establish who signed specific bytes and that those bytes were not altered after signing. It does not by itself prove the underlying claims are true.",
{id:"signature-limits-teaching",kind:"TEACHING",prompt:"A signed measurement card verifies against the issuer's public key. Which conclusion is justified?",sourceNote:"Synthetic teaching example.",choices:[
{id:"a",label:"These exact bytes were signed by the referenced key.",correct:true,explanation:"Correct. That is the narrow cryptographic conclusion."},
{id:"b",label:"The measured system is safe.",correct:false,explanation:"Signature validity is not a safety finding."},
{id:"c",label:"The card is legally certified.",correct:false,explanation:"A signature does not create accreditation or certification."}]},
{id:"signature-limits-assessment",kind:"ASSESSMENT",prompt:"A correctly signed supplier attestation conflicts with a newer independent observation. What should happen?",sourceNote:"Synthetic assessment case.",choices:[
{id:"a",label:"Prefer the signed statement automatically.",correct:false,explanation:"Signature validity does not outrank contrary evidence automatically."},
{id:"b",label:"Retain both, mark the conflict, and re-evaluate the affected claim.",correct:true,explanation:"Correct. Preserve provenance and resolve the substantive conflict separately."},
{id:"c",label:"Discard the independent observation.",correct:false,explanation:"That would hide relevant evidence."}]}),

lesson("missing-evidence","Treat missing evidence as unknown",
"Use UNCHECKABLE/UNMEASURED states instead of inventing a pass or fail.",
"Absence of required evidence is not evidence that the underlying property passed or failed.",
{id:"missing-evidence-teaching",kind:"TEACHING",prompt:"A supplier claim requires a test report, but the report cannot be retrieved. What is the defensible state?",sourceNote:"Synthetic teaching example.",choices:[
{id:"a",label:"PASS because there is no negative result.",correct:false,explanation:"Missing evidence cannot be converted into a pass."},
{id:"b",label:"FAIL because the file is unavailable.",correct:false,explanation:"Unavailability does not establish substantive failure."},
{id:"c",label:"UNCHECKABLE until the required evidence is available.",correct:true,explanation:"Correct. Keep the uncertainty explicit."}]},
{id:"missing-evidence-assessment",kind:"ASSESSMENT",prompt:"A previously accessible evidence endpoint begins returning 503 during a recheck. What should Claim Maintenance do?",sourceNote:"Synthetic assessment case.",choices:[
{id:"a",label:"Reuse the previous result as current without qualification.",correct:false,explanation:"That silently converts stale evidence into a current result."},
{id:"b",label:"Mark the recheck unresolved, retain the previous evidence as historical, and retry later.",correct:true,explanation:"Correct. Historical evidence remains history; current status stays unresolved."},
{id:"c",label:"Delete the previous evidence because the source is down.",correct:false,explanation:"Historical evidence should be preserved."}]}),

lesson("material-change","Recheck only what a material change can affect",
"Use dependency-aware invalidation instead of blanket refreshes.",
"A source change should trigger the claims, tests and lessons that actually depend on the changed material.",
{id:"material-change-teaching",kind:"TEACHING",prompt:"A supplier changes the evidence revision for a security control. Which work should be revisited?",sourceNote:"Synthetic teaching example.",choices:[
{id:"a",label:"Every unrelated lesson and measurement in the estate.",correct:false,explanation:"Blanket refreshes create noise and cost without evidence benefit."},
{id:"b",label:"The claims and exercises whose dependency graph includes that source/control.",correct:true,explanation:"Correct. Recheck affected dependents."},
{id:"c",label:"Nothing until a regulator asks.",correct:false,explanation:"Claim Maintenance exists to detect material dependency change before that point."}]},
{id:"material-change-assessment",kind:"ASSESSMENT",prompt:"A pricing document changes, but the safety evidence and its digest are unchanged. What is the narrowest correct action?",sourceNote:"Synthetic assessment case.",choices:[
{id:"a",label:"Rerun all safety measurements.",correct:false,explanation:"No safety dependency was shown to change."},
{id:"b",label:"Re-evaluate only workflows that depend on the pricing document.",correct:true,explanation:"Correct. Invalidation follows dependency, not mere recency."},
{id:"c",label:"Ignore the change because it is not safety-related.",correct:false,explanation:"Pricing-dependent commercial workflows may still be affected."}]}),

lesson("escalation-abstention","Know when not to act",
"Distinguish a bounded recommendation from authority to execute.",
"A system may have enough information to describe options while still lacking authority or evidence to perform an external effect.",
{id:"escalation-teaching",kind:"TEACHING",prompt:"An agent sees two supplier options, but the cheaper supplier's evidence is unavailable and the task forbids purchases. What is acceptable?",sourceNote:"Synthetic teaching example.",choices:[
{id:"a",label:"Purchase the cheaper option to test it.",correct:false,explanation:"The task has no purchase authority."},
{id:"b",label:"Describe the evidence gap and abstain/escalate within the declared scope.",correct:true,explanation:"Correct. Scope and uncertainty both matter."},
{id:"c",label:"Invent a confidence score and proceed.",correct:false,explanation:"A fabricated score does not create authority."}]},
{id:"escalation-assessment",kind:"ASSESSMENT",prompt:"A model proposes a remediation that would modify production, but the exercise grants read/simulate/measure only. What should the operator do?",sourceNote:"Synthetic assessment case.",choices:[
{id:"a",label:"Apply it because the proposal looks reversible.",correct:false,explanation:"Reversibility does not create execution authority."},
{id:"b",label:"Keep it as a proposal and request the separately authorised change workflow.",correct:true,explanation:"Correct. Proposal and execution are different authorities."},
{id:"c",label:"Treat model confidence as approval.",correct:false,explanation:"Model confidence is not approval."}]}),

lesson("corrections-maintenance","Correct visibly and maintain over time",
"Preserve superseded evidence and trigger selective rechecks when dependencies change.",
"Corrections should supersede prior conclusions without rewriting history, and maintenance should retain the reason a recheck was triggered.",
{id:"corrections-teaching",kind:"TEACHING",prompt:"A published research result contains an error discovered by its author. What is the strongest correction practice?",sourceNote:"Synthetic teaching example.",choices:[
{id:"a",label:"Replace the old result silently.",correct:false,explanation:"Silent replacement destroys correction history."},
{id:"b",label:"Publish a correction linked to the superseded result and preserve both.",correct:true,explanation:"Correct. Readers can see what changed and why."},
{id:"c",label:"Leave the error because changing it looks bad.",correct:false,explanation:"Visible correction strengthens the evidence process."}]},
{id:"corrections-assessment",kind:"ASSESSMENT",prompt:"A corrected source changes one conclusion but leaves three unrelated conclusions untouched. What should maintenance record?",sourceNote:"Synthetic assessment case.",choices:[
{id:"a",label:"The changed conclusion and its affected dependents are superseded/rechecked; unrelated conclusions retain their histories.",correct:true,explanation:"Correct. Preserve history and scope the recheck."},
{id:"b",label:"All prior conclusions are deleted.",correct:false,explanation:"That loses auditability and overstates the correction's scope."},
{id:"c",label:"Nothing, because the correction is already public.",correct:false,explanation:"Downstream dependencies still need maintenance."}]}),
]);

export const EVIDENCE_FOUNDATIONS_BOUNDARY=Object.freeze({
  publicName:"SovSpace Learning", backendCodenamePublic:false, practiceOnly:true,
  createsGspcMeasurement:false, createsCertificate:false, establishesCompliance:false,
  trainsModels:false, persistsServerSide:false, automaticPromotion:false,
} as const);

export function getEvidenceFoundationsLesson(id:string):EvidenceFoundationsLesson|null {
  return EVIDENCE_FOUNDATIONS_LESSONS.find((row)=>row.id===id)??null;
}

export function evaluateEvidenceChoice(lessonId:string,exerciseKind:"TEACHING"|"ASSESSMENT",choiceId:string) {
  const row=getEvidenceFoundationsLesson(lessonId);
  if(!row) return {valid:false,correct:false,explanation:"Unknown lesson."};
  const exercise=exerciseKind==="TEACHING"?row.teaching:row.assessment;
  const choice=exercise.choices.find((item)=>item.id===choiceId);
  if(!choice) return {valid:false,correct:false,explanation:"Unknown choice."};
  return {valid:true,correct:choice.correct,explanation:choice.explanation};
}

export function deriveEvidenceFoundationsProgress(completedLessonIds:readonly string[]) {
  const expected=EVIDENCE_FOUNDATIONS_LESSONS.map((row)=>row.id);
  const unique=[...new Set(completedLessonIds)];
  const validPrefix:string[]=[];
  for(const id of expected){ if(!unique.includes(id)) break; validPrefix.push(id); }
  const rejected=unique.filter((id)=>!validPrefix.includes(id));
  const duplicates=completedLessonIds.filter((id,index)=>completedLessonIds.indexOf(id)!==index);
  return Object.freeze({
    schema:"csoai.s06-evidence-foundations-progress/0.1",
    valid:rejected.length===0&&duplicates.length===0,
    completedLessonIds:Object.freeze(validPrefix),
    rejectedLessonIds:Object.freeze([...new Set([...rejected,...duplicates])]),
    activeLessonId:expected[validPrefix.length]??null,
    completionRatio:validPrefix.length/expected.length,
    evidenceState:"PRACTICE_ONLY", measurementState:"UNMEASURED",
  } as const);
}
