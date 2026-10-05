export const EVIDENCE_FOUNDATIONS_SCHEMA = "csoai.evidence-foundations/0.1" as const;

export type EvidenceFoundationChoice = Readonly<{
  id: string;
  label: string;
  correct: boolean;
  feedback: string;
}>;

export type EvidenceFoundationLesson = Readonly<{
  id: string;
  title: string;
  objective: string;
  teaching: readonly string[];
  scenario: string;
  choices: readonly EvidenceFoundationChoice[];
  transferPrompt: string;
}>;

const lesson = (value: EvidenceFoundationLesson) => Object.freeze({
  ...value,
  teaching: Object.freeze([...value.teaching]),
  choices: Object.freeze(value.choices.map((choice) => Object.freeze({...choice}))),
});

export const EVIDENCE_FOUNDATIONS_LESSONS = Object.freeze([
  lesson({
    id: "source-identity",
    title: "1 · Source identity",
    objective: "Identify exactly which source, revision and scope a decision depends on.",
    teaching: Object.freeze([
      "A useful claim needs an identifiable source, not merely a plausible sentence.",
      "A newer-looking page does not automatically supersede a retained revision.",
      "If identity or revision is unclear, keep the conclusion unresolved.",
    ]),
    scenario: "A report quotes a safety requirement but gives no source revision or retained copy. What is the evidence-safe response?",
    choices: Object.freeze([
      {id:"accept",label:"Accept it because the wording sounds authoritative.",correct:false,feedback:"Plausibility is not source identity. Keep the claim unresolved until the source can be identified."},
      {id:"identify",label:"Request or locate the exact source and revision before relying on it.",correct:true,feedback:"Correct. Source identity is a prerequisite for a maintained evidence chain."},
      {id:"latest",label:"Use whichever search result has the newest date.",correct:false,feedback:"A date alone does not prove that a result is the controlling source or revision."},
    ]),
    transferPrompt: "On a different claim, name the minimum source identity fields you would retain before making a decision.",
  }),
  lesson({
    id: "signature-limits",
    title: "2 · What a signature proves",
    objective: "Separate origin/integrity evidence from correctness or truth.",
    teaching: Object.freeze([
      "A valid signature can show that identified bytes came from the holder of a key.",
      "It does not by itself prove that the underlying assertion is correct.",
      "Verification should report both what was checked and what remains unestablished.",
    ]),
    scenario: "A signed measurement card verifies cryptographically, but its underlying source is unavailable. What can you safely conclude?",
    choices: Object.freeze([
      {id:"true",label:"The measurement is true because the signature verifies.",correct:false,feedback:"A signature proves origin/integrity of the signed bytes, not truth of the underlying claim."},
      {id:"origin",label:"The signed bytes verify, while source truth remains unverified.",correct:true,feedback:"Correct. Keep cryptographic validity and evidentiary validity separate."},
      {id:"invalid",label:"The signature must be invalid because the source is unavailable.",correct:false,feedback:"Source availability and signature validity are different checks."},
    ]),
    transferPrompt: "Explain to a non-technical reviewer one thing a signature proves and one thing it does not prove.",
  }),
  lesson({
    id: "missing-evidence",
    title: "3 · Missing evidence",
    objective: "Use UNCHECKABLE or unresolved states instead of inventing a result.",
    teaching: Object.freeze([
      "Missing evidence is not the same as failure.",
      "A system should preserve the reason a result cannot currently be checked.",
      "The correct action can be abstention or escalation rather than forced classification.",
    ]),
    scenario: "A supplier offers the lowest price, but the supporting evidence endpoint is unavailable. Another supplier has current accessible evidence. What is the evidence-safe action?",
    choices: Object.freeze([
      {id:"cheap",label:"Choose the cheapest supplier and fill the gap later.",correct:false,feedback:"That turns missing evidence into an unsupported assumption."},
      {id:"defer",label:"Defer or use the option whose required evidence is currently checkable, within the exercise rules.",correct:true,feedback:"Correct. Missing evidence should remain visible in the decision."},
      {id:"fail",label:"Mark the unavailable supplier as definitively failed.",correct:false,feedback:"Unavailable evidence is not automatically evidence of failure."},
    ]),
    transferPrompt: "Describe when you would use UNCHECKABLE rather than FAILED on a different task.",
  }),
  lesson({
    id: "material-change",
    title: "4 · Material source change",
    objective: "Recheck only the decisions and learning items actually affected by a source change.",
    teaching: Object.freeze([
      "A changed dependency should invalidate affected conclusions, not erase history.",
      "Unrelated claims should not be retrained or remeasured automatically.",
      "Retain the previous record and create a superseding state when appropriate.",
    ]),
    scenario: "A retained policy source changes one clause used by Claim A, while Claim B depends on a different clause. What should happen?",
    choices: Object.freeze([
      {id:"all",label:"Invalidate every claim and retrain everyone.",correct:false,feedback:"Blanket invalidation creates noise and destroys useful dependency information."},
      {id:"affected",label:"Recheck Claim A and its dependent lesson; preserve Claim B unless its dependency also changed.",correct:true,feedback:"Correct. Dependency-scoped invalidation is the maintained path."},
      {id:"overwrite",label:"Overwrite the previous policy record with the new text.",correct:false,feedback:"Corrections and supersession should preserve historical evidence."},
    ]),
    transferPrompt: "Name one dependency that would trigger a selective refresher and one unrelated dependency that should not.",
  }),
  lesson({
    id: "abstention",
    title: "5 · Escalation and abstention",
    objective: "Recognise when acting would exceed the available evidence or authority.",
    teaching: Object.freeze([
      "A capable system must be able to say that it cannot safely decide.",
      "Execution authority, evidence quality and decision confidence are separate.",
      "Escalation should identify the missing fact or authority needed to continue.",
    ]),
    scenario: "An agent has enough information to draft a remediation but has no authority to apply production changes. What is the correct next step?",
    choices: Object.freeze([
      {id:"apply",label:"Apply the fix because the evidence is strong.",correct:false,feedback:"Evidence does not create execution authority."},
      {id:"escalate",label:"Produce the bounded proposal and request authorised human review before any effect.",correct:true,feedback:"Correct. Proposal and execution remain separate."},
      {id:"sign",label:"Sign the proposal so it becomes authorised.",correct:false,feedback:"A signature does not mint deployment authority."},
    ]),
    transferPrompt: "On a different workflow, name the exact authority boundary that would make you stop and escalate.",
  }),
  lesson({
    id: "correction-maintenance",
    title: "6 · Corrections and maintenance",
    objective: "Preserve correction history and know what must be rechecked after a change.",
    teaching: Object.freeze([
      "Corrections supersede; they do not silently rewrite the past.",
      "A corrected source should trigger the affected recheck path.",
      "A learner refresher, regression test and customer claim can share a dependency without sharing authority.",
    ]),
    scenario: "A published source corrects a factual value that was used in one report and one training exercise. What is the maintained response?",
    choices: Object.freeze([
      {id:"delete",label:"Delete the old report and lesson so only the corrected version remains.",correct:false,feedback:"Deleting history removes the evidence needed to understand what changed."},
      {id:"supersede",label:"Retain the old versions, mark them superseded, recheck the report, and refresh the affected lesson.",correct:true,feedback:"Correct. The correction becomes a visible dependency event."},
      {id:"ignore",label:"Leave both untouched because the original work was valid when created.",correct:false,feedback:"Historical validity does not remove the need to maintain current claims that depend on corrected facts."},
    ]),
    transferPrompt: "Write the minimal correction chain for a different changed fact: old record, new source, affected outputs, recheck.",
  }),
] satisfies readonly EvidenceFoundationLesson[]);

export const EVIDENCE_FOUNDATIONS_BOUNDARY = Object.freeze({
  publicName: "Evidence Foundations",
  product: "Council Learning",
  practiceOnly: true,
  sessionOnly: true,
  createsEvidence: false,
  createsMeasurement: false,
  createsCertificate: false,
  createsComplianceStatus: false,
  modelTraining: false,
  automaticSubmission: false,
  automaticPromotion: false,
} as const);

export function validateEvidenceFoundations(): true {
  if (EVIDENCE_FOUNDATIONS_LESSONS.length !== 6) throw new Error("Expected six Evidence Foundations lessons.");
  const ids = new Set<string>();
  for (const row of EVIDENCE_FOUNDATIONS_LESSONS) {
    if (!/^[a-z][a-z0-9-]{0,79}$/.test(row.id) || ids.has(row.id)) throw new Error("Invalid or duplicate lesson id.");
    ids.add(row.id);
    if (row.choices.length < 2 || row.choices.filter((choice) => choice.correct).length !== 1)
      throw new Error("Each lesson must have exactly one correct bounded choice.");
    if (!row.teaching.length || !row.transferPrompt.trim()) throw new Error("Lesson teaching or transfer prompt missing.");
  }
  return true;
}
