/**
 * My results — what this browser asked for, kept in this browser only.
 *
 * A convenience list, never shared state and never a record of truth: each entry points at the
 * live source (the commission queue, the signed card, the watch request) and the My results pane
 * re-reads that source every time it opens. Clearing site data clears the list; nothing is lost
 * on the server side because nothing here was ever the server's copy.
 */

export type MyResultKind = "lookup" | "fresh-run" | "watch";

export type MyResult = {
  id: string;
  kind: MyResultKind;
  subject: string;
  at: string;
  /** The state the source returned when this entry was saved (re-read live in the pane). */
  state?: string;
  /** A receipt sha, transaction hash or watch request id, when the source gave one. For a lookup,
   *  the record id the answering tool cited. */
  ref?: string;
  /** For a lookup: the exact question the free tools were asked, so "Look up again" re-asks it. */
  question?: string;
};

/** The minimum of a finished AG-UI run (lib/aguiTalk TalkRun) that a lookup row needs. */
export type FinishedLookupRun = {
  question: string;
  status?: string;
  tools: { label?: string | null; citation?: { record_id?: string | null } | null }[];
};

/**
 * Save a Get results lookup once its run has finished, with what the run actually returned: the
 * first tool's own state word and the record id it cited. A run that returned no tool (an error,
 * a cancelled stream) is still listed, with no state, rather than with a guessed one.
 */
export function lookupFromRun(subject: string, run: FinishedLookupRun): Omit<MyResult, "id" | "at"> {
  const first = run.tools[0];
  const state = typeof first?.label === "string" && first.label.trim() ? first.label.trim() : undefined;
  const ref = typeof first?.citation?.record_id === "string" && first.citation.record_id ? first.citation.record_id : undefined;
  return { kind: "lookup", subject, question: run.question, ...(state ? { state } : {}), ...(ref ? { ref } : {}) };
}

/** Where "Look up again" goes: the original question re-asked on the dashboard (the box is filled,
 *  nothing is sent until the reader presses Ask), or, for a model lookup, Get results refilled. */
export function lookupAgainHref(r: Pick<MyResult, "subject" | "question">): string {
  return r.question
    ? `/dashboard?ask=${encodeURIComponent(r.question)}`
    : `/dashboard?lookup=${encodeURIComponent(r.subject)}`;
}

export const MY_RESULTS_KEY = "coai:my-results";
export const MY_RESULTS_EVENT = "coai:my-results";
const MAX = 50;

export function readMyResults(): MyResult[] {
  try {
    const raw = window.localStorage.getItem(MY_RESULTS_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(list)) return [];
    return list.filter(
      (r): r is MyResult =>
        !!r && typeof r === "object" && typeof (r as MyResult).subject === "string" && typeof (r as MyResult).at === "string",
    );
  } catch {
    return [];
  }
}

export function addMyResult(entry: Omit<MyResult, "id" | "at"> & { at?: string }): MyResult[] {
  const at = entry.at ?? new Date().toISOString();
  const row: MyResult = { ...entry, at, id: `${entry.kind}:${entry.subject}:${at}` };
  // One lookup row per subject: a repeated lookup refreshes it instead of stacking duplicates.
  const prev = readMyResults().filter((r) => !(r.kind === "lookup" && row.kind === "lookup" && r.subject === row.subject));
  const next = [row, ...prev].slice(0, MAX);
  try {
    window.localStorage.setItem(MY_RESULTS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(MY_RESULTS_EVENT));
  } catch {
    /* storage blocked: the list stays empty; every result is still reachable live */
  }
  return next;
}

export function clearMyResults(): void {
  try {
    window.localStorage.removeItem(MY_RESULTS_KEY);
    window.dispatchEvent(new Event(MY_RESULTS_EVENT));
  } catch {
    /* nothing to clear */
  }
}
