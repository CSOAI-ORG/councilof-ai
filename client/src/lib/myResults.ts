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
  /** A receipt sha, transaction hash or watch request id, when the source gave one. */
  ref?: string;
};

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
