/** Contextual guidance over the existing Academy exercise inventory, not a new credential. */
export const ACADEMY_SOURCE = {
  url: 'https://councilof.ai/academy/exercises/exercises.json',
  commit: '06a2aa9ceb95beab8e3562bd39c149602892e44d',
  sha256: '90a77b413f73c227c1985efbc929a6d8427039c39260276700a71f10fa6fa2de',
  published: '2026-09-28',
  selectedAt: '2026-11-04',
  license: 'CC0-1.0',
};
export const LESSONS = [
  { id: 'board-totals', title: 'Count the rows, not the claims',
    context: 'Useful when a leaderboard or a progress dashboard shows a total.',
    guidance: 'Read the rows of the published board and count MEASURED separately from all declared axes. Missing data is not zero. A model benchmark is not an approval to act.',
    question: 'A board declares 34 axes but only 23 have a measurement. What should the panel show?',
    options: ['34 measured; declared axes count as passed.', '23 measured and 11 unmeasured, with the source and time.', 'An overall safety score of 68%.'],
    answer: 1, explanation: 'Preserve the distinction and the evidence date. No overall safety percentage follows from these counts.' },
  { id: 'verify-card', title: 'A valid signature is not permission',
    context: 'Useful before relying on a signed result or accepting a proposed action.',
    guidance: 'Pin the key, verify the exact signed content, and distinguish VALID, INVALID and UNCHECKABLE. A signature can establish a scoped integrity claim; it does not grant tool permission or prove the answer is correct.',
    question: 'The evidence signature verifies. May an agent deploy a change without the required human decision?',
    options: ['Yes, because the evidence is signed.', 'Only if the model says its confidence is high.', 'No. Exact current authority and the execution gate are separate.'],
    answer: 2, explanation: 'Measurement, signature and task permission are separate. The execution gate must check the actual authorized action.' },
  { id: 'charter-hash', title: 'Notice a changed source before relying on it',
    context: 'Useful when a charter, framework mapping or learning source changes.',
    guidance: 'A digest binds exact source bytes, not legal validity. Preserve the source revision and date; changed bytes should trigger review of affected lessons and mappings, not silently rewrite historical evidence.',
    question: 'A source digest no longer matches the version behind your training record. What comes next?',
    options: ['Mark it review due and inspect the changed source before relying on the lesson.', 'Automatically mark every system compliant with the new text.', 'Replace the historical digest so the previous result still looks current.'],
    answer: 0, explanation: 'Keep the previous record. Review the change and its applicability; new content does not create automatic authority or certification.' },
] as const;
export type SourceState = 'NOT_CHECKED' | 'CURRENT_BYTES' | 'REVIEW_DUE' | 'UNAVAILABLE';
export function sourceState(actual: string | null): SourceState {
  if (actual === null) return 'UNAVAILABLE';
  if (!/^[a-f0-9]{64}$/.test(actual)) return 'UNAVAILABLE';
  return actual === ACADEMY_SOURCE.sha256 ? 'CURRENT_BYTES' : 'REVIEW_DUE';
}
export function answerLesson(id: string, selection: number, state: SourceState) {
  const lesson = LESSONS.find(l => l.id === id);
  if (!lesson || !Number.isInteger(selection) || selection < 0 || selection >= lesson.options.length) throw new Error('Choose one listed practice option.');
  if (state === 'REVIEW_DUE' || state === 'UNAVAILABLE') return { correct: false, practiceRecorded: false, explanation: 'Source review is required. No current practice completion is recorded.', grantsAuthority: false, certification: false };
  return { correct: selection === lesson.answer, practiceRecorded: selection === lesson.answer, explanation: lesson.explanation,
    grantsAuthority: false, certification: false };
}
export function learningRecord(completed: Iterable<string>, state: SourceState) {
  const ids = [...new Set(completed)].filter(id => LESSONS.some(l => l.id === id));
  return { schema: 'csoai.panel-practice/1', at: new Date().toISOString(), source: ACADEMY_SOURCE,
    sourceState: state, locallyPractised: ids, practiceCount: ids.length,
    formalExercisesReproduced: 0, humanCompetenceAssessed: false, certificateIssued: false, grantsAuthority: false,
    scope: 'Session-local practice only. Existing Academy exercise completion still requires reproduction and a discriminating negative control. No XP, external identity or entitlement is issued.' };
}
export function findingDraft(issue: string, status: string, tools: { name: string; status: string; label?: string }[]) {
  const categories = ['Missing evidence', 'Unexpected action', 'Changed source', 'Observation interrupted'];
  if (!categories.includes(issue)) throw new Error('Choose a review category.');
  return { schema: 'csoai.panel-review-draft/1', state: 'UNSENT_DRAFT', preparedAt: new Date().toISOString(), category: issue,
    observation: { status: String(status).slice(0,80), tools: tools.slice(0,50).map(t=>({name:String(t.name).slice(0,120),status:String(t.status).slice(0,80),label:String(t.label??'UNMEASURED').slice(0,120)})) },
    includeAfterReview: ['Expected versus observed behavior','Exact public evidence and source revision','Permission and privacy/disclosure review','Reproduction steps and negative control','Impact and scope limits','Independent reviewer and proposed recipient'],
    recipients: 'Not selected. Council, the affected vendor and WG-SAFE have separate disclosure/submission processes.',
    notice: 'No conversation text, keys, customer data or imported benchmark file is attached. A human must review content and choose a permitted recipient before sending.',
    sent: false, externalRepairAuthorized: false, endorsedByAlliance: false };
}

/** Suggest existing learning; no unseen host context is consumed. */
export function suggestedLesson(tools: {name:string}[], status: string): string | null {
  if(status==='interrupted'||status==='error') return 'verify-card';
  if(tools.some(t=>t.name==='verify_card'||t.name==='verify_capsule'))return 'verify-card';
  if(tools.some(t=>t.name==='board_totals'||t.name==='get_axis'))return 'board-totals';
  return null;
}
