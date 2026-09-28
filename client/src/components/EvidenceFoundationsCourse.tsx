import {useMemo,useState} from "react";
import {
  EVIDENCE_FOUNDATIONS_BOUNDARY,
  EVIDENCE_FOUNDATIONS_LESSONS,
  deriveEvidenceFoundationsProgress,
  evaluateEvidenceChoice,
} from "../data/evidence-foundations";

type Attempt = {
  lessonId:string;
  teachingChoiceId?:string;
  assessmentChoiceId?:string;
};

export function buildEvidenceFoundationsExport(
  completedLessonIds:readonly string[],
  attempts:Readonly<Record<string,Attempt>>,
){
  const progress=deriveEvidenceFoundationsProgress(completedLessonIds);
  return {
    schema:"csoai.s06-evidence-foundations-session-export/0.1",
    exported_at:new Date().toISOString(),
    public_product:"SovSpace Learning",
    practice_only:true,
    measurement_state:"UNMEASURED",
    certificate_created:false,
    compliance_determination:false,
    model_training_authorized:false,
    completed_lesson_ids:[...progress.completedLessonIds],
    attempts:Object.values(attempts).map((row)=>({...row})),
    note:"Local learner export only. It is not a signed learning record or GSPC evidence.",
  };
}

export default function EvidenceFoundationsCourse(){
  const [completed,setCompleted]=useState<string[]>([]);
  const [attempts,setAttempts]=useState<Record<string,Attempt>>({});
  const [mode,setMode]=useState<"TEACHING"|"ASSESSMENT">("TEACHING");
  const progress=deriveEvidenceFoundationsProgress(completed);
  const lesson=EVIDENCE_FOUNDATIONS_LESSONS.find((row)=>row.id===progress.activeLessonId)
    ?? EVIDENCE_FOUNDATIONS_LESSONS.at(-1)!;
  const done=progress.activeLessonId===null;
  const exercise=mode==="TEACHING"?lesson.teaching:lesson.assessment;
  const attempt=attempts[lesson.id]??{lessonId:lesson.id};
  const selected=mode==="TEACHING"?attempt.teachingChoiceId:attempt.assessmentChoiceId;
  const evaluation=selected?evaluateEvidenceChoice(lesson.id,mode,selected):null;

  const completedCount=progress.completedLessonIds.length;
  const percent=Math.round(progress.completionRatio*100);
  const canAdvance=mode==="ASSESSMENT"&&evaluation?.correct===true&&!done;

  const lessonIndex=useMemo(
    ()=>Math.max(0,EVIDENCE_FOUNDATIONS_LESSONS.findIndex((row)=>row.id===lesson.id)),
    [lesson.id],
  );

  function choose(id:string){
    setAttempts((current)=>{
      const row=current[lesson.id]??{lessonId:lesson.id};
      return {
        ...current,
        [lesson.id]:mode==="TEACHING"
          ? {...row,teachingChoiceId:id}
          : {...row,assessmentChoiceId:id},
      };
    });
  }

  function next(){
    if(mode==="TEACHING"&&evaluation?.correct){
      setMode("ASSESSMENT");
      return;
    }
    if(!canAdvance)return;
    setCompleted((current)=>[...current,lesson.id]);
    setMode("TEACHING");
  }

  function reset(){
    setCompleted([]);
    setAttempts({});
    setMode("TEACHING");
  }

  function exportLocal(){
    if(typeof window==="undefined")return;
    const payload=JSON.stringify(buildEvidenceFoundationsExport(completed,attempts),null,2);
    const blob=new Blob([payload],{type:"application/json"});
    const href=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=href;
    link.download="sovspace-evidence-foundations-practice.json";
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <section
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
      aria-labelledby="evidence-foundations-title"
      data-testid="evidence-foundations-course"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800">
            SovSpace Learning · Evidence Foundations
          </p>
          <h2 id="evidence-foundations-title" className="mt-2 text-2xl font-semibold tracking-tight">
            Learn how to use evidence without turning uncertainty into certainty.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Six short lessons covering source identity, signature limits, missing evidence,
            material change, abstention and visible corrections. Teaching examples and
            assessment cases are deliberately different.
          </p>
        </div>
        <span className="rounded-full border border-amber-700/25 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-950">
          PRACTICE_ONLY · UNMEASURED
        </span>
      </div>

      <div className="mt-5" aria-label="Course progress">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{completedCount} / {EVIDENCE_FOUNDATIONS_LESSONS.length} lessons completed this session</span>
          <span>{percent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-800 transition-[width]"
            style={{width:`${percent}%`}}
            aria-hidden="true"
          />
        </div>
      </div>

      {done ? (
        <div className="mt-6 rounded-xl border border-emerald-700/20 bg-emerald-50 p-5">
          <h3 className="font-semibold text-emerald-950">Practice course complete for this session</h3>
          <p className="mt-2 text-sm leading-relaxed text-emerald-950/80">
            Completion creates no certificate, compliance determination, GSPC measurement,
            evidence admission or model-training permission. You may export a local practice
            note or reset and rehearse again.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={exportLocal}
              className="min-h-11 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white">
              Export local practice note
            </button>
            <button type="button" onClick={reset}
              className="min-h-11 rounded-lg border border-border px-4 py-2 text-xs font-semibold">
              Reset course
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Lesson {lessonIndex+1} of {EVIDENCE_FOUNDATIONS_LESSONS.length}
              </p>
              <h3 className="mt-1 text-xl font-semibold">{lesson.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{lesson.objective}</p>
            </div>
            <div className="flex rounded-lg border border-border bg-muted/40 p-1" aria-label="Exercise type">
              <span className={`rounded-md px-3 py-1.5 text-xs font-semibold ${mode==="TEACHING"?"bg-card shadow-sm":"text-muted-foreground"}`}>
                Learn & practice
              </span>
              <span className={`rounded-md px-3 py-1.5 text-xs font-semibold ${mode==="ASSESSMENT"?"bg-card shadow-sm":"text-muted-foreground"}`}>
                Assessment
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold text-foreground">Evidence boundary</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{lesson.sourceBoundary}</p>
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold leading-relaxed">{exercise.prompt}</legend>
            <p className="mt-1 text-xs text-muted-foreground">{exercise.sourceNote}</p>
            <div className="mt-3 space-y-2">
              {exercise.choices.map((choice)=>(
                <label key={choice.id}
                  className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border p-3 hover:bg-muted/40">
                  <input
                    type="radio"
                    name={`${lesson.id}-${mode}`}
                    value={choice.id}
                    checked={selected===choice.id}
                    onChange={()=>choose(choice.id)}
                    className="mt-1"
                  />
                  <span className="text-sm leading-relaxed">{choice.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {evaluation ? (
            <div
              role="status"
              className={`mt-4 rounded-xl border p-4 text-sm leading-relaxed ${
                evaluation.correct
                  ?"border-emerald-700/20 bg-emerald-50 text-emerald-950"
                  :"border-amber-700/25 bg-amber-50 text-amber-950"
              }`}
            >
              {evaluation.explanation}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={next}
              disabled={!evaluation?.correct}
              className="min-h-11 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {mode==="TEACHING"?"Continue to assessment":"Complete lesson"}
            </button>
            <button type="button" onClick={reset}
              className="min-h-11 rounded-lg border border-border px-4 py-2 text-xs font-semibold">
              Reset course
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
        <strong>Boundary:</strong> {EVIDENCE_FOUNDATIONS_BOUNDARY.publicName} keeps this
        course session-only. It does not persist progress server-side, train a model, sign a
        record, create a certificate, determine compliance or admit GSPC evidence.
      </div>
    </section>
  );
}
