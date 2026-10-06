import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  EVIDENCE_FOUNDATIONS_LESSONS,
} from "../data/evidence-foundations";

import { createPracticeNote, lessonProgress, requestPracticeDownload, supportedLessonCount, type PracticeAttempt } from "../lib/evidenceFoundationsPractice";

export default function EvidenceFoundationsCourse() {
  const instanceId = useId();
  const lessonHeading = useRef<HTMLHeadingElement>(null);
  const focusRequested = useRef(false);
  const downloads = useRef(new Set<() => void>());
  const [copyNote, setCopyNote] = useState<{text: string; attemptCount: number} | null>(null);
  const [exportStatus, setExportStatus] = useState("");
  useEffect(() => {
    const pending = downloads.current;
    return () => {
      const releases = [...pending];
      pending.clear();
      for (const release of releases) {
        try { release(); } catch { /* attempt cleanup of every pending URL */ }
      }
    };
  }, []);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [selectedByLesson, setSelectedByLesson] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const lesson = EVIDENCE_FOUNDATIONS_LESSONS[lessonIndex];

  const currentChoice = useMemo(
    () => lesson.choices.find((choice) => choice.id === selectedByLesson[lesson.id]) ?? null,
    [lesson, selectedByLesson],
  );
  const completed = supportedLessonCount(attempts);
  const noteNeedsRefresh = copyNote !== null && copyNote.attemptCount !== attempts.length;

  useEffect(() => {
    // Orient only after an explicit lesson change, never on mount or an answer.
    if (!focusRequested.current) return;
    focusRequested.current = false;
    lessonHeading.current?.focus();
  }, [lessonIndex]);

  function changeLesson(nextIndex: number) {
    const next = Math.max(0, Math.min(EVIDENCE_FOUNDATIONS_LESSONS.length - 1, nextIndex));
    if (next === lessonIndex) return;
    focusRequested.current = true;
    setLessonIndex(next);
  }

  function choose(choiceId: string) {
    const choice = lesson.choices.find((row) => row.id === choiceId);
    if (!choice) return;
    // Capture event time once; React may replay the pure state updater.
    const attemptedAt = new Date().toISOString();
    setSelectedByLesson((current) => ({...current, [lesson.id]: choiceId}));
    setAttempts((current) => [
      ...current,
      {
        lessonId: lesson.id,
        choiceId,
        correct: choice.correct,
        attemptedAt,
      },
    ]);
  }

  function exportPracticeNote(download: boolean) {
    let text: string;
    try {
      text = JSON.stringify(createPracticeNote(attempts, new Date().toISOString()), null, 2) + "\n";
    } catch {
      setExportStatus("The note could not be prepared. Your attempts remain in this session; do not refresh or leave.");
      return;
    }
    setCopyNote({text, attemptCount: attempts.length});
    if (!download) {
      setExportStatus("Copyable note prepared. Nothing has been sent or saved by this module.");
      return;
    }
    if (downloads.current.size >= 3) {
      setExportStatus("Three download requests are still pending temporary-link cleanup. Saving is not confirmed. Use the copyable note, or wait up to one minute before requesting another download.");
      return;
    }
    try {
      let release: () => void = () => {};
      release = requestPracticeDownload(text, () => downloads.current.delete(release));
      downloads.current.add(release);
      setExportStatus("Download requested. Saving is not confirmed. Use the copyable note below if no file appears.");
    } catch {
      setExportStatus("The download could not be started. Your attempts are intact. Use the copyable note below.");
    }
  }

  return (
    <section
      className="mb-8 rounded-3xl border border-emerald-900/15 bg-emerald-950 text-emerald-50 shadow-sm"
      aria-labelledby={`${instanceId}-heading`}
      data-testid="evidence-foundations-course"
    >
      <div className="border-b border-white/10 p-5 sm:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">
          Council Learning · six fictional practice lessons
        </p>
        <h2
          id={`${instanceId}-heading`}
          className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Evidence Foundations
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-emerald-50/75">
          Six short lessons on source identity, signature limits, missing evidence,
          material change, abstention, and correction maintenance. All cases are
          fictional practice. Nothing here creates a GSPC measurement, compliance
          status, certificate, deployment authority, or model-training permission.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide">
          <span className="rounded-full border border-white/15 px-2.5 py-1">
            {completed} of {EVIDENCE_FOUNDATIONS_LESSONS.length} lessons have a supported answer in this session
          </span>
          <span className="rounded-full border border-white/15 px-2.5 py-1">
            practice only
          </span>
          <span className="rounded-full border border-white/15 px-2.5 py-1">
            session-only progress
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-emerald-50/85">
          Earlier attempts remain in your note, including answers that needed another try.
          This is practice progress, not a mastery assessment.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-50/85">
          Practice progress is not saved for a later visit. Download or copy your note before refreshing or leaving.
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav
          className="border-b border-white/10 p-3 lg:border-b-0 lg:border-r"
          aria-label="Evidence Foundations lessons"
        >
          {EVIDENCE_FOUNDATIONS_LESSONS.map((row, index) => {
            const isActive = index === lessonIndex;
            const progress = lessonProgress(row.id, attempts);
            const done = progress.supported;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => changeLesson(index)}
                aria-controls={`${instanceId}-lesson`}
                aria-current={isActive ? "step" : undefined}
                aria-describedby={`${instanceId}-${row.id}-status`}
                className={`mb-1 flex min-h-11 w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                  isActive ? "bg-white text-emerald-950" : "text-emerald-50 hover:bg-white/10"
                }`}
              >
                <span aria-hidden="true">{done ? "✓" : String(index + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block">{row.title.replace(/^\d+ · /, "")}</span>
                  <span id={`${instanceId}-${row.id}-status`} className="mt-1 block text-xs font-normal">
                    {progress.label}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div id={`${instanceId}-lesson`} role="region" aria-labelledby={`${instanceId}-lesson-heading`} className="p-5 sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-200">
            Lesson {lessonIndex + 1} of {EVIDENCE_FOUNDATIONS_LESSONS.length}
          </p>
          <h3 ref={lessonHeading} id={`${instanceId}-lesson-heading`} tabIndex={-1}
            className="mt-1 text-xl font-semibold focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-emerald-200">{lesson.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-emerald-50/80">{lesson.objective}</p>

          <div className="mt-5 rounded-2xl bg-white/8 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
              Learn
            </h4>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-emerald-50/85">
              {lesson.teaching.map((line) => <li key={line}>• {line}</li>)}
            </ul>
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold leading-relaxed">
              {lesson.scenario}
            </legend>
            <div className="mt-3 space-y-2">
              {lesson.choices.map((choice) => {
                const selected = selectedByLesson[lesson.id] === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => choose(choice.id)}
                    aria-pressed={selected}
                    className={`min-h-11 w-full rounded-xl border px-4 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                      selected
                        ? "border-emerald-200 bg-emerald-100 text-emerald-950"
                        : "border-white/15 bg-white/5 text-emerald-50 hover:bg-white/10"
                    }`}
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div
            className="mt-4 min-h-20 rounded-xl border border-white/10 bg-black/10 p-4 text-sm leading-relaxed"
            role="status"
            aria-live="polite"
            data-testid="evidence-foundations-feedback"
          >
            {currentChoice ? (
              <>
                <p className="font-semibold">
                  {currentChoice.correct ? "Practice decision supported." : "Try again."}
                </p>
                <p className="mt-1 text-emerald-50/80">{currentChoice.feedback}</p>
              </>
            ) : (
              <p className="text-emerald-50/65">Choose an answer to receive scoped feedback.</p>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-200">
              Transfer prompt
            </p>
            <p className="mt-1 text-sm leading-relaxed text-emerald-50/80">
              {lesson.transferPrompt}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-emerald-50/80">
              Apply the idea to another example. Your response is not collected or assessed here.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => changeLesson(lessonIndex - 1)}
              aria-controls={`${instanceId}-lesson`}
              disabled={lessonIndex === 0}
              className="min-h-11 rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => changeLesson(lessonIndex + 1)}
              aria-controls={`${instanceId}-lesson`}
              disabled={lessonIndex === EVIDENCE_FOUNDATIONS_LESSONS.length - 1}
              className="min-h-11 rounded-xl bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-950 disabled:opacity-40"
            >
              Next lesson
            </button>
            <button
              type="button"
              onClick={() => exportPracticeNote(true)}
              className="min-h-11 rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold"
            >
              Export practice note
            </button>
            <button type="button" onClick={() => exportPracticeNote(false)}
              className="min-h-11 rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2">
              Show copyable note
            </button>
          </div>
          <p role="status" aria-live="polite" aria-atomic="true" data-testid="practice-export-status"
            className="mt-3 text-sm leading-relaxed">
            {exportStatus}
            {noteNeedsRefresh && " This prepared note does not include your latest answers. Prepare a new note to include them."}
          </p>
          {copyNote && (
            <div className="mt-4 min-w-0 rounded-xl border border-white/20 p-4">
              <label htmlFor={`${instanceId}-practice-copy`} className="block text-sm font-semibold">
                Copyable practice note
              </label>
              <p id={`${instanceId}-copy-help`} className="mt-2 text-xs leading-relaxed">
                This note contains {copyNote.attemptCount} attempts from when it was prepared.
                Later answers are not included. Prepare a new note to include them.
                Select the text below and copy it using your device controls.
              </p>
              <textarea id={`${instanceId}-practice-copy`} aria-describedby={`${instanceId}-copy-help`}
                data-testid="practice-note-copy" readOnly value={copyNote.text} rows={8}
                onFocus={(event) => event.currentTarget.select()}
                className="mt-3 block w-full min-w-0 rounded-lg bg-white p-3 font-mono text-xs text-slate-950 focus-visible:outline focus-visible:outline-2" />
            </div>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-emerald-50/60">
            Export is explicit and local to your browser download. This module does not
            automatically send answers, create signed evidence, train a model, or award a certificate.
          </p>
        </div>
      </div>
    </section>
  );
}
