/**
 * My results — what this browser asked for, kept in this browser only.
 *
 * A convenience list, never shared state and never a record of truth: each entry points at the
 * live source (the commission queue, the signed card, the watch request) and the My results pane
 * re-reads that source every time it opens. Clearing site data clears the list; nothing is lost
 * on the server side because nothing here was ever the server's copy.
 */

export type MyResultKind = "lookup" | "fresh-run" | "watch" | "paid";

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
  /** For a paid result: the door URL that was paid (query included) and the settlement transaction. */
  door?: string;
  tx?: string;
  /**
   * For a paid result: the signed record the door delivered (a card-v0 leaf), as JSON text, so it
   * can be checked and downloaded later. It is the only copy: a paid art50 pack is not stored on the
   * server, so a buyer who clears this browser keeps nothing unless they downloaded it.
   */
  record?: string;
};

/** A signed record must stay small enough for localStorage; larger ones are referenced, not kept. */
export const PAID_RECORD_MAX_CHARS = 32 * 1024;

/** A card-v0 leaf: payload + sha256 + sig_ed25519 (functions/_lib/cardV0Verify.ts isCardV0). */
function isLeaf(v: unknown): v is { sha256: string; sig_ed25519: string | null; payload: Record<string, unknown> } {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const r = v as Record<string, unknown>;
  return !!r.payload && typeof r.payload === "object" && !Array.isArray(r.payload) && typeof r.sha256 === "string" && "sig_ed25519" in r;
}

/**
 * The signed record inside a paid door's 200 body, wherever that door puts it: `card` (art50 pack,
 * request-attestation receipt), `manifest_card` (evidence bundle) or `signature` (fresh capsule).
 * Null when the body carries none, which is stated rather than guessed.
 */
export function signedRecordOf(body: unknown): { sha256: string; sig_ed25519: string | null; payload: Record<string, unknown> } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  for (const k of ["card", "manifest_card", "signature"]) if (isLeaf(b[k])) return b[k] as ReturnType<typeof signedRecordOf>;
  return isLeaf(body) ? (body as ReturnType<typeof signedRecordOf>) : null;
}

/** A short name for a paid door: its path after /api/, plus the named output when there is one. */
export function paidSubject(doorUrl: string): string {
  try {
    const u = new URL(doorUrl);
    const path = u.pathname.replace(/^\/api\//, "");
    const named = u.searchParams.get("url") || u.searchParams.get("subject") || u.searchParams.get("obligation") || u.searchParams.get("asset");
    return named ? `${path} · ${named}` : path;
  } catch {
    return doorUrl;
  }
}

/**
 * The My results row for a paid door that delivered: what the door returned, never more. The state
 * reads DELIVERED (signed) or DELIVERED (unsigned) from the record itself; `ref` is the record id
 * (sha256), which for a request-attestation receipt is also its receipt id in the public queue.
 */
export function paidResult(args: { doorUrl: string; body: unknown; transaction: string | null }): Omit<MyResult, "id" | "at"> {
  const rec = signedRecordOf(args.body);
  const text = rec ? JSON.stringify(rec, null, 2) : null;
  return {
    kind: "paid",
    subject: paidSubject(args.doorUrl),
    door: args.doorUrl,
    state: rec ? (rec.sig_ed25519 ? "DELIVERED · SIGNED" : "DELIVERED · UNSIGNED") : "DELIVERED",
    ...(rec ? { ref: rec.sha256 } : args.transaction ? { ref: args.transaction } : {}),
    ...(args.transaction ? { tx: args.transaction } : {}),
    ...(text && text.length <= PAID_RECORD_MAX_CHARS ? { record: text } : {}),
  };
}

/**
 * Hand a record to the free checker without a URL: it is put in this tab's sessionStorage and
 * /gspc-verify?seed=mine reads it once. Nothing leaves the browser.
 */
export const VERIFY_SEED_KEY = "coai:verify-seed";
export const VERIFY_SEED_HREF = "/gspc-verify?seed=mine";
export function seedChecker(recordText: string): boolean {
  try {
    window.sessionStorage.setItem(VERIFY_SEED_KEY, recordText);
    return true;
  } catch {
    return false;
  }
}
export function takeCheckerSeed(): string | null {
  try {
    const v = window.sessionStorage.getItem(VERIFY_SEED_KEY);
    if (v !== null) window.sessionStorage.removeItem(VERIFY_SEED_KEY);
    return v;
  } catch {
    return null;
  }
}

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

const KINDS: readonly MyResultKind[] = ["lookup", "fresh-run", "watch", "paid"];
const optStr = (v: unknown) => v === undefined || typeof v === "string";

/**
 * A stored row is shown only when every field it carries has the shape the pane relies on. Before
 * 14 Oct 2026 only `subject` and `at` were checked, so a row with no `id` (React key undefined), an
 * unknown `kind`, or a non-string `record` (handed to seedChecker / downloadText) was rendered.
 * A row without an id is given one derived from its contents instead of being dropped.
 */
export function normaliseRow(r: unknown, i: number): MyResult | null {
  if (!r || typeof r !== "object" || Array.isArray(r)) return null;
  const x = r as Record<string, unknown>;
  if (typeof x.subject !== "string" || typeof x.at !== "string" || !KINDS.includes(x.kind as MyResultKind)) return null;
  for (const k of ["state", "ref", "question", "door", "tx", "record"]) if (!optStr(x[k])) return null;
  const id = typeof x.id === "string" && x.id ? x.id : `${x.kind}:${x.subject}:${x.at}:${i}`;
  return { ...(x as MyResult), id };
}

export function readMyResults(): MyResult[] {
  try {
    const raw = window.localStorage.getItem(MY_RESULTS_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(list)) return [];
    const seen = new Set<string>();
    const out: MyResult[] = [];
    list.forEach((r, i) => {
      const row = normaliseRow(r, i);
      if (!row) return;
      // Duplicate ids (two saves in the same millisecond) made duplicate React keys.
      if (seen.has(row.id)) row.id = `${row.id}#${i}`;
      seen.add(row.id);
      out.push(row);
    });
    return out;
  } catch {
    return [];
  }
}

/**
 * Which rows to keep when the list is over MAX. A paid row that holds its signed record is the
 * buyer's only copy, so it outlives other rows; it is dropped only when MAX such rows exist.
 */
export function capRows(rows: MyResult[], max = MAX): MyResult[] {
  if (rows.length <= max) return rows;
  const precious = (r: MyResult) => r.kind === "paid" && typeof r.record === "string";
  const keepPrecious = rows.filter(precious).slice(0, max);
  const room = max - keepPrecious.length;
  const keepOther = new Set(rows.filter((r) => !precious(r)).slice(0, room));
  const keep = new Set(keepPrecious);
  return rows.filter((r) => keep.has(r) || keepOther.has(r));
}

export type SaveOutcome = { rows: MyResult[]; saved: boolean; recordKept: boolean };

/** True when the new row is the same result as an older one and replaces it instead of stacking. */
function sameResult(a: MyResult, b: MyResult): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "lookup") return a.subject === b.subject;
  // A paid or fresh-run result re-saved (reload, retry) carries the same record id / receipt.
  return !!a.ref && a.ref === b.ref && a.subject === b.subject;
}

let seq = 0;

export function saveMyResult(entry: Omit<MyResult, "id" | "at"> & { at?: string }): SaveOutcome {
  const at = entry.at ?? new Date().toISOString();
  // A counter keeps ids unique when two rows are saved in the same millisecond (or with one `at`).
  const row: MyResult = { ...entry, at, id: `${entry.kind}:${entry.subject}:${at}:${(seq = (seq + 1) % 1e6)}` };
  const prev = readMyResults().filter((r) => !sameResult(r, row));
  const next = capRows([row, ...prev]);
  const write = (rows: MyResult[]) => {
    window.localStorage.setItem(MY_RESULTS_KEY, JSON.stringify(rows));
  };
  try {
    write(next);
    window.dispatchEvent(new Event(MY_RESULTS_EVENT));
    return { rows: next, saved: true, recordKept: true };
  } catch {
    // Storage full: before 14 Oct 2026 the failure was swallowed and the unsaved list returned as
    // if saved, so a paid record vanished on reload with no word. Keep the new row, shed the
    // stored record bodies of OLDER rows (each still has its ref/tx), and say what happened.
    try {
      const slim = next.map((r, i) => (i === 0 ? r : { ...r, record: undefined }));
      write(slim);
      window.dispatchEvent(new Event(MY_RESULTS_EVENT));
      return { rows: readMyResults(), saved: true, recordKept: true };
    } catch {
      try {
        const bare = [{ ...row, record: undefined }, ...prev.map((r) => ({ ...r, record: undefined }))];
        write(capRows(bare));
        window.dispatchEvent(new Event(MY_RESULTS_EVENT));
        return { rows: readMyResults(), saved: true, recordKept: !row.record };
      } catch {
        return { rows: readMyResults(), saved: false, recordKept: false };
      }
    }
  }
}

/** Kept for existing callers: returns the rows actually stored (not an unsaved list). */
export function addMyResult(entry: Omit<MyResult, "id" | "at"> & { at?: string }): MyResult[] {
  return saveMyResult(entry).rows;
}

export function clearMyResults(): void {
  try {
    window.localStorage.removeItem(MY_RESULTS_KEY);
    window.dispatchEvent(new Event(MY_RESULTS_EVENT));
  } catch {
    /* nothing to clear */
  }
}

/** Save text as a file in the reader's own browser (a delivered record they must keep). */
export function downloadText(text: string, filename: string): void {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch {
    /* no Blob/URL support: the record is still shown on the page to copy */
  }
}
