import { useId, useRef, useState } from "react";
import type { TalkRun } from "../../lib/aguiTalk";

export const MEOK_ENQUIRY_URL = "https://meok.ai/request-job";

/** Only references returned by this run; no inferred measurement or verification. */
export function meokBrief(run: Pick<TalkRun, "question" | "tools">): string {
  const records = run.tools.map((tool) => {
    const lines = [`- Tool: ${tool.name}; state: ${tool.label || "not supplied"}`];
    if (tool.citation?.record_id) lines.push(`  Record: ${tool.citation.record_id}`);
    const url = tool.citation?.url;
    if (url) {
      try {
        const parsed = new URL(url);
        if (parsed.origin === "https://councilof.ai" && !parsed.username && !parsed.password) {
          lines.push(`  Published reference: ${url}`);
        }
      } catch { /* Missing or unqualified URLs remain absent. */ }
    }
    return lines.join("\n");
  });
  return [
    "MEOK delivered-job enquiry — draft for review",
    "",
    "Task I asked Council:",
    run.question,
    "",
    "Council result references (states copied, not independently verified here):",
    records.length ? records.join("\n") : "No result references were returned.",
    "",
    "Artifact I want delivered:",
    "[Describe one artifact and where it will be used.]",
    "",
    "Acceptance test:",
    "[Describe what I will inspect before accepting the delivered artifact.]",
    "",
    "Inputs, rights, privacy/access constraints, timing and budget:",
    "[Complete before sending. Remove private details you do not want to share.]",
    "",
    "Please agree written scope, quote, delivery and acceptance terms before work starts.",
  ].join("\n");
}

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2";
const BUTTON = `min-h-11 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted ${FOCUS}`;

/** Local review of one completed run; the existing MEOK enquiry remains a human handoff. */
export default function ResultFollowUp({ run, onEdit }: { run: TalkRun; onEdit: (question: string) => void }) {
  const [useful, setUseful] = useState(false);
  const [brief, setBrief] = useState<string | null>(null);
  const [copyNote, setCopyNote] = useState("");
  const revision = useRef(0);
  const briefId = useId();
  const helpId = useId();

  const copyBrief = async () => {
    if (brief === null) return;
    const text = brief;
    const at = ++revision.current;
    setCopyNote("");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      if (at === revision.current) setCopyNote("Brief copied. Nothing has been sent.");
    } catch {
      if (at === revision.current) setCopyNote("Copy is unavailable. Select the brief below and copy it manually. Nothing has been sent.");
    }
  };

  return (
    <section className="rounded-xl border border-border p-3" aria-label="Review this result" data-testid="result-follow-up">
      <p className="text-sm font-semibold">What next for this result?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" aria-pressed={useful} onClick={() => setUseful((v) => !v)} className={BUTTON}>
          {useful ? "Marked useful" : "Useful for this task"}
        </button>
        <button type="button" onClick={() => onEdit(run.question)} className={BUTTON}>Edit question</button>
        <button type="button" onClick={() => {
          revision.current++;
          setBrief(meokBrief(run));
          setCopyNote("");
        }} className={BUTTON}>Prepare a MEOK enquiry</button>
      </div>
      {useful ? <p className="mt-2 text-xs text-muted-foreground" role="status">Marked useful in this tab. This does not accept commissioned work.</p> : null}
      {brief !== null ? (
        <div className="mt-3 space-y-2">
          <label htmlFor={briefId} className="block text-sm font-semibold">Review and complete your brief</label>
          <p id={helpId} className="text-xs text-muted-foreground">
            MEOK can discuss a delivered job through its existing enquiry page. Agree scope, a written quote and acceptance terms first.
            This does not execute or book the task. Opening MEOK sends none of this brief; copy it yourself and review before sending.
          </p>
          <textarea id={briefId} aria-describedby={helpId} rows={12} value={brief} onChange={(e) => {
            revision.current++;
            setBrief(e.target.value);
            setCopyNote("");
          }} className={`w-full min-w-0 rounded-lg border border-border bg-background p-3 text-sm text-foreground ${FOCUS}`} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void copyBrief()} className={BUTTON}>Copy brief</button>
            <a href={MEOK_ENQUIRY_URL} target="_blank" rel="noopener noreferrer" className={BUTTON}>Open MEOK enquiry (new tab)</a>
          </div>
          <p className="text-xs text-muted-foreground" role="status" aria-live="polite">{copyNote}</p>
        </div>
      ) : null}
    </section>
  );
}
