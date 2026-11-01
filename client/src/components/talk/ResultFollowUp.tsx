import { useEffect, useId, useRef, useState } from "react";
import type { TalkRun } from "../../lib/aguiTalk";
import { requireCommittedCompanyCase, type CommittedCompanyCase } from "./companyCaseModel";

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
          lines.push(`  Returned Council reference: ${url}`);
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


/** Build a manual brief from the existing verified presentation contract, never a TalkRun. */
export function companyMeokBrief(input: unknown, expectedOwnerSubject: string): string {
  const value = requireCommittedCompanyCase(input, { ownerSubject: expectedOwnerSubject });
  const sources = value.result.sources.map((source) => {
    const lines = ["- Source: " + source.title, "  Reference: " + source.reference];
    if (source.fetchedAt !== undefined) lines.push("  Fetched: " + source.fetchedAt);
    else lines.push("  Recorded: " + source.recordedAt);
    if (source.sha256 !== undefined) lines.push("  Source SHA-256: " + source.sha256);
    return lines.join("\n");
  });
  return [
    "MEOK delivered-job enquiry — draft for review of a saved Company case",
    "",
    "Original Company request:",
    value.request,
    "",
    "Verified merged Company case references (references only; no access grant):",
    "Case: " + value.caseId,
    "Request reference: " + value.requestId,
    "Native result record: " + value.result.id,
    "Original saved result JSON SHA-256: " + value.result.sha256,
    "Result source fetch time: " + value.result.fetchedAt,
    "Native receipt record: " + value.receipt.id,
    "Original saved receipt JSON SHA-256: " + value.receipt.sha256,
    "Receipt case binding: " + value.receipt.caseId,
    "Receipt result binding: " + value.receipt.resultId,
    "Receipt bound result JSON SHA-256: " + value.receipt.resultSha256,
    "Receipt created: " + value.receipt.createdAt,
    "Native case readback commit: " + value.persistence.nativeCommitId,
    "",
    "Sources recorded with this case:",
    sources.join("\n"),
    "",
    "Unsigned integrity receipt. The existing adapter verified saved JSON digests, their binding and a merged native readback.",
    "This does not establish a signer, independent measurement, commissioning, payment, MEOK access or customer acceptance.",
    "A source fetch time alone is not proof of a fresh measurement.",
    "Result display text and original raw bodies are omitted. Digests identify the saved JSON bytes, not this editable brief.",
    "Nothing has been sent. Review and remove private details before sharing.",
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

type ResultFollowUpProps =
  | { source?: "public"; run: TalkRun; onEdit: (question: string) => void }
  | { source: "company"; value: CommittedCompanyCase; expectedOwnerSubject: string };

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2";
const BUTTON = `min-h-11 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted ${FOCUS}`;

/** Local review of one public run or saved Company case; the MEOK enquiry remains a human handoff. */
export default function ResultFollowUp(props: ResultFollowUpProps) {
  const [useful, setUseful] = useState(false);
  const [brief, setBrief] = useState<string | null>(null);
  const [copyNote, setCopyNote] = useState("");
  const revision = useRef(0);
  useEffect(() => () => { revision.current++; }, []);
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
    <section className="rounded-xl border border-border p-3" aria-label={props.source === "company" ? "Review this company case" : "Review this result"} data-testid="result-follow-up">
      <p className="text-sm font-semibold">{props.source === "company" ? "What next for this saved company case?" : "What next for this result?"}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" aria-pressed={useful} onClick={() => setUseful((v) => !v)} className={BUTTON}>
          {useful ? "Marked useful" : "Useful for this task"}
        </button>
        {props.source !== "company" ? <button type="button" onClick={() => props.onEdit(props.run.question)} className={BUTTON}>Edit question</button> : null}
        <button type="button" onClick={() => {
          revision.current++;
          setBrief(props.source === "company" ? companyMeokBrief(props.value, props.expectedOwnerSubject) : meokBrief(props.run));
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
