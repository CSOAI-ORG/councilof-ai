import { describe, expect, it } from "vitest";
import { createResearchDraft, validateResearchProjection } from "./research-experiment-draft.mjs";

const clock = Date.parse("2026-11-25T02:30:00Z");
function fixture() {
  return {
    schema: "csoai.councilos-eat-research-commons/0.1", state: "FREE_DISCOVERY_ONLY",
    source: { url: "https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/auto-eat-feed/public/interop/auto-eat/research-commons.json",
      branch_isolate: "auto-eat-feed", observed_at: "2026-11-25T02:28:03Z", read_at: "2026-11-25T02:29:00Z",
      freshness: "FRESH", signature_verification: "NOT_PERFORMED", independent_source_verification: false, source_sha256: "a".repeat(64) },
    coverage: { full_global_coverage: false, repositories_checked: 2, repositories_observed: 1, repositories_uncheckable: 1 },
    pathways: { independent_human_approval_issued: false, model_or_tool_execution_performed: false, endorsement_or_certification: false, source_evidence_copies_redistributed: false, fee_for_this_read: 0 },
    repositories: [
      { repository: "open-policy-agent/opa", observed_source_revision: "b".repeat(40), source_declared_license: "Apache-2.0", status: "SOURCE_METADATA_OBSERVED", project_role: "policy_engine", candidate_experiment: "DENY_EXPIRY", licence_review: "REQUIRED", human_reviewer_state: "UNASSIGNED", independent_validation: "NOT_PERFORMED" },
      { repository: "example/unknown", observed_source_revision: null, source_declared_license: null, status: "SOURCE_UNCHECKABLE", project_role: "evaluation", candidate_experiment: "REPLAY", licence_review: "REQUIRED", human_reviewer_state: "UNASSIGNED", independent_validation: "NOT_PERFORMED" }
    ]
  };
}
const input = { role:"researcher", question:"Does revocation fail closed?", baseline:"Existing policy", candidate:"Pinned candidate policy", metric:"recall", direction:"at_least", threshold:0.95, sampleSize:30 };
describe("private experiment draft from research commons", () => {
  it("retains observed candidates and unknown denominator", () => {
    const result=validateResearchProjection(fixture(),clock);
    expect(result.candidates).toHaveLength(1); expect(result.uncheckable).toBe(1);
  });
  it("binds the draft to source bytes, revision and explicit non-authority", () => {
    const draft=createResearchDraft(fixture(),"open-policy-agent/opa",input,clock);
    expect(draft.source.revision).toBe("b".repeat(40)); expect(draft.source.snapshot_sha256).toBe("a".repeat(64));
    expect(draft).toMatchObject({visibility:"private",classification:"PROPOSED",test_state:"NOT_RUN",method:"NOT_FROZEN",human_review:"UNASSIGNED",execute_authorized:false,publication_authorized:false,gspc_admitted:false,independently_verified:false,planned_sample_size:30});
  });
  it("refuses drafting from unknown or unlisted source", () => {
    for (const name of ["example/unknown","unlisted/repo"]) expect(()=>createResearchDraft(fixture(),name,input,clock)).toThrow();
  });
  const invalids: [string,(p:ReturnType<typeof fixture>)=>void][] = [
    ["held",p=>p.state="UNCHECKABLE"],["signature",p=>p.source.signature_verification="VALID"],
    ["stale",p=>p.source.observed_at="2020-01-01T00:00:00Z"],["future",p=>p.source.read_at="2099-01-01T00:00:00Z"],
    ["digest",p=>p.source.source_sha256="fake"],["origin",p=>p.source.url="https://example.com"],
    ["coverage",p=>p.coverage.repositories_observed++],["human",p=>p.pathways.independent_human_approval_issued=true],
    ["execution",p=>p.pathways.model_or_tool_execution_performed=true],["fee",p=>p.pathways.fee_for_this_read=1],
    ["duplicate",p=>p.repositories[1]=p.repositories[0]],["revision",p=>p.repositories[0].observed_source_revision="fake"],
    ["path",p=>p.repositories[0].repository="evil/../test"],["review",p=>p.repositories[0].human_reviewer_state="APPROVED"],
    ["unknown claims revision",p=>p.repositories[0].status="SOURCE_UNCHECKABLE"]
  ];
  for(const [name,mutate] of invalids) it("rejects "+name,()=>{const p=fixture();mutate(p);expect(()=>validateResearchProjection(p,clock)).toThrow()});
  for(const [name,patch] of Object.entries({authority:{execute_authorized:true},threshold:{threshold:1.1},sample:{sampleSize:0},empty:{question:""},role:{role:"owner"},direction:{direction:"unknown"}}))
    it("rejects draft "+name,()=>expect(()=>createResearchDraft(fixture(),"open-policy-agent/opa",{...input,...patch},clock)).toThrow());
  it("rechecks freshness at export time",()=>expect(()=>createResearchDraft(fixture(),"open-policy-agent/opa",input,clock+3*86400000)).toThrow());
});

// Constructed boundary controls only, never empirical observations.
it("accepts the 25-source projection and holds a 26th source",()=>{
  const p=fixture();
  p.repositories=Array.from({length:25},(_,i)=>({...p.repositories[0],repository:"example/repo"+i}));
  p.coverage.repositories_checked=25;p.coverage.repositories_observed=25;p.coverage.repositories_uncheckable=0;
  expect(validateResearchProjection(p,clock).candidates).toHaveLength(25);
  p.repositories.push({...p.repositories[0],repository:"example/repo25"});
  p.coverage.repositories_checked=26;p.coverage.repositories_observed=26;
  expect(()=>validateResearchProjection(p,clock)).toThrow();
});
