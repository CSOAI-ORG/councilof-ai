import {describe,expect,it} from "vitest";
import {
  EVIDENCE_FOUNDATIONS_BOUNDARY,
  EVIDENCE_FOUNDATIONS_LESSONS,
  deriveEvidenceFoundationsProgress,
  evaluateEvidenceChoice,
} from "./evidence-foundations";

describe("SovSpace Evidence Foundations",()=>{
  it("contains six ordered lessons with separate teaching and assessment cases",()=>{
    expect(EVIDENCE_FOUNDATIONS_LESSONS).toHaveLength(6);
    const ids=new Set<string>();
    for(const lesson of EVIDENCE_FOUNDATIONS_LESSONS){
      expect(ids.has(lesson.id)).toBe(false); ids.add(lesson.id);
      expect(lesson.teaching.kind).toBe("TEACHING");
      expect(lesson.assessment.kind).toBe("ASSESSMENT");
      expect(lesson.teaching.id).not.toBe(lesson.assessment.id);
      expect(lesson.teaching.prompt).not.toBe(lesson.assessment.prompt);
      expect(lesson.teaching.choices.filter(x=>x.correct)).toHaveLength(1);
      expect(lesson.assessment.choices.filter(x=>x.correct)).toHaveLength(1);
    }
  });

  it("keeps public learning identity and authority boundaries explicit",()=>{
    expect(EVIDENCE_FOUNDATIONS_BOUNDARY).toMatchObject({
      publicName:"SovSpace Learning",
      backendCodenamePublic:false,
      practiceOnly:true,
      createsGspcMeasurement:false,
      createsCertificate:false,
      establishesCompliance:false,
      trainsModels:false,
      persistsServerSide:false,
      automaticPromotion:false,
    });
    expect(JSON.stringify(EVIDENCE_FOUNDATIONS_LESSONS).toLowerCase()).not.toContain("laputa");
  });

  it("never teaches that a signature proves truth or certification",()=>{
    const text=JSON.stringify(EVIDENCE_FOUNDATIONS_LESSONS);
    expect(text).toContain("signature");
    expect(text).toContain("does not create accreditation or certification");
    expect(text).toContain("Signature validity is not a safety finding");
  });

  it("keeps missing evidence explicitly unresolved",()=>{
    const row=EVIDENCE_FOUNDATIONS_LESSONS.find(x=>x.id==="missing-evidence")!;
    expect(row.teaching.choices.find(x=>x.correct)?.label).toContain("UNCHECKABLE");
  });

  it("evaluates only declared choices",()=>{
    expect(evaluateEvidenceChoice("source-identity","TEACHING","a")).toMatchObject({valid:true,correct:true});
    expect(evaluateEvidenceChoice("source-identity","TEACHING","missing")).toEqual({
      valid:false,correct:false,explanation:"Unknown choice.",
    });
    expect(evaluateEvidenceChoice("missing","TEACHING","a")).toEqual({
      valid:false,correct:false,explanation:"Unknown lesson.",
    });
  });

  it("accepts only an ordered prefix as completed progress",()=>{
    const ids=EVIDENCE_FOUNDATIONS_LESSONS.map(x=>x.id);
    for(let n=0;n<=ids.length;n++){
      const p=deriveEvidenceFoundationsProgress(ids.slice(0,n));
      expect(p.valid).toBe(true);
      expect(p.completedLessonIds).toEqual(ids.slice(0,n));
      expect(p.activeLessonId).toBe(ids[n]??null);
      expect(p.completionRatio).toBe(n/ids.length);
      expect(p.evidenceState).toBe("PRACTICE_ONLY");
      expect(p.measurementState).toBe("UNMEASURED");
    }
  });

  it("rejects skipped, unknown and duplicated lesson completion claims",()=>{
    const ids=EVIDENCE_FOUNDATIONS_LESSONS.map(x=>x.id);
    expect(deriveEvidenceFoundationsProgress([ids[1]]).valid).toBe(false);
    expect(deriveEvidenceFoundationsProgress([ids[0],"invented"]).valid).toBe(false);
    expect(deriveEvidenceFoundationsProgress([ids[0],ids[0]]).valid).toBe(false);
  });

  it("freezes the curriculum graph",()=>{
    expect(Object.isFrozen(EVIDENCE_FOUNDATIONS_LESSONS)).toBe(true);
    for(const lesson of EVIDENCE_FOUNDATIONS_LESSONS){
      expect(Object.isFrozen(lesson)).toBe(true);
      expect(Object.isFrozen(lesson.teaching)).toBe(true);
      expect(Object.isFrozen(lesson.assessment)).toBe(true);
      expect(Object.isFrozen(lesson.teaching.choices)).toBe(true);
      expect(Object.isFrozen(lesson.assessment.choices)).toBe(true);
    }
  });
});
