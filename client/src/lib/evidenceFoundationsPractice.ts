import { EVIDENCE_FOUNDATIONS_BOUNDARY, EVIDENCE_FOUNDATIONS_LESSONS, EVIDENCE_FOUNDATIONS_SCHEMA } from "../data/evidence-foundations";

export type PracticeAttempt = Readonly<{
  lessonId: string; choiceId: string; correct: boolean; attemptedAt: string;
}>;

export const PRACTICE_EXPORT_SCHEMA = "csoai.learning-practice-export/0.2" as const;
// Source-file identity, not a signature, runtime attestation, or learner identity.
// The focused test recomputes this pin from the unmodified curriculum source.
export const CURRICULUM_SOURCE = Object.freeze({
  path: "client/src/data/evidence-foundations.ts",
  sha256: "cd02b3627e439df14410f2d2b22d6db2fe3b3c5bb8cee5e9654c2249e2e52694",
});

export function lessonProgress(lessonId: string, attempts: readonly PracticeAttempt[]) {
  const matching = attempts.filter((row) => row.lessonId === lessonId);
  const supported = matching.some((row) => row.correct === true);
  const latestCorrect = matching.length ? matching[matching.length - 1].correct : null;
  const label = latestCorrect === null ? "Not tried yet."
    : supported && !latestCorrect ? "Supported answer recorded; latest answer needs another try."
    : supported ? "Supported answer recorded."
    : "Latest answer needs another try.";
  return { supported, latestCorrect, label };
}

export function supportedLessonCount(attempts: readonly PracticeAttempt[]): number {
  return EVIDENCE_FOUNDATIONS_LESSONS.filter((row) => lessonProgress(row.id, attempts).supported).length;
}

// This is the course's own UTC-millisecond profile, not a general date parser.
// A syntactically valid client time is still not a trusted timestamp.
function requirePracticeClock(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value))
    throw new Error("Invalid practice clock.");
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value)
    throw new Error("Invalid practice clock.");
  return value;
}

export function createPracticeNote(attempts: readonly PracticeAttempt[], exportedAt: string) {
  requirePracticeClock(exportedAt);
  if (!Array.isArray(attempts)) throw new Error("Invalid practice history.");
  const checked: PracticeAttempt[] = [];
  for (let index = 0; index < attempts.length; index++) {
    if (!Object.hasOwn(attempts, index)) throw new Error("Missing practice attempt.");
    const attempt = attempts[index];
    if (!attempt || typeof attempt !== "object" || Array.isArray(attempt))
      throw new Error("Invalid practice attempt.");
    const lesson = EVIDENCE_FOUNDATIONS_LESSONS.find((row) => row.id === attempt.lessonId);
    const choice = lesson?.choices.find((row) => row.id === attempt.choiceId);
    if (!choice || typeof attempt.correct !== "boolean" || choice.correct !== attempt.correct)
      throw new Error("Practice answer does not match this curriculum.");
    requirePracticeClock(attempt.attemptedAt);
    checked.push({ lessonId: attempt.lessonId, choiceId: attempt.choiceId, correct: attempt.correct, attemptedAt: attempt.attemptedAt });
  }
  return {
    schema: PRACTICE_EXPORT_SCHEMA,
    course_schema: EVIDENCE_FOUNDATIONS_SCHEMA,
    course: EVIDENCE_FOUNDATIONS_BOUNDARY.publicName,
    product: EVIDENCE_FOUNDATIONS_BOUNDARY.product,
    exported_at: exportedAt,
    clock_basis: "UNVERIFIED_CLIENT_WALL_CLOCK",
    attempt_order: "RECORDED_ARRAY_ORDER_NOT_CLOCK_SORTED",
    session_only_source: true,
    identity_state: "UNAUTHENTICATED_SESSION",
    assessment_state: "PRACTICE_ONLY_NOT_ASSESSED",
    curriculum_source: { ...CURRICULUM_SOURCE },
    // Retain the complete fictional, source-visible lesson text with the note.
    // This is practice material, never a held-out assessment bank.
    curriculum: JSON.parse(JSON.stringify(EVIDENCE_FOUNDATIONS_LESSONS)),
    attempts: checked,
    supported_answer_lesson_count: supportedLessonCount(checked),
    progress_rule: "AT_LEAST_ONE_SUPPORTED_ANSWER_PER_LESSON_THIS_SESSION",
    total_lessons: EVIDENCE_FOUNDATIONS_LESSONS.length,
    evidence_boundary: { ...EVIDENCE_FOUNDATIONS_BOUNDARY },
  };
}

/** Request a download only on explicit action; a request is not a confirmed save. */
export function requestPracticeDownload(text: string, onRelease: () => void = () => {}): () => void {
  let objectUrl: string | null = null;
  let anchor: HTMLAnchorElement | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    // Best effort: one browser cleanup fault must not skip the others or unmount.
    // These are cleanup attempts, not proof that a browser released its resources.
    try { if (timer !== undefined) clearTimeout(timer); } catch { /* continue cleanup */ }
    try { anchor?.remove(); } catch { /* continue cleanup */ }
    try { if (objectUrl !== null) URL.revokeObjectURL(objectUrl); } catch { /* continue cleanup */ }
    try { onRelease(); } catch { /* cleanup cannot destabilize the learner's page */ }
  };
  try {
    anchor = document.createElement("a");
    objectUrl = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    anchor.href = objectUrl;
    anchor.download = "evidence-foundations-practice.json";
    anchor.rel = "noopener";
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Give the browser time to consume the URL; unmount also releases it.
    timer = setTimeout(release, 60_000);
    return release;
  } catch (error) {
    release();
    throw error;
  }
}
