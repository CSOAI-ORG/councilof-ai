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
export function paidResult(args: { doorUrl: string; body: unknown; transaction: string | null }): Omit<MyResult, "id" | "at"> & { recordNotKept?: true } {
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
    // A signed record too large to keep here: the save outcome must say it was not kept.
    ...(text && text.length > PAID_RECORD_MAX_CHARS ? { recordNotKept: true as const } : {}),
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
    return parseRows(window.localStorage.getItem(MY_RESULTS_KEY)) ?? [];
  } catch {
    return [];
  }
}

/** The rows in one stored snapshot, or null when the snapshot is not a readable list. */
function parseRows(raw: string | null): MyResult[] | null {
  try {
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(list)) return null;
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
    return null;
  }
}

/** A paid row that holds its signed record: the buyer's only copy, never dropped automatically. */
const precious = (r: MyResult) => r.kind === "paid" && typeof r.record === "string";

/**
 * Which rows to keep when the list is over MAX. Before 14 Oct 2026 this dropped the newest row
 * when MAX paid copies filled the list (and saveMyResult still said saved), and a 51st paid copy
 * evicted an older one. Now every paid row that holds its record is kept, even past MAX; only
 * other rows (oldest first) give way to them, and a non-paid row that finds no room is dropped
 * here and reported by saveMyResult as not saved.
 */
export function capRows(rows: MyResult[], max = MAX): MyResult[] {
  if (rows.length <= max) return rows;
  const room = Math.max(0, max - rows.filter(precious).length);
  const keepOther = new Set(rows.filter((r) => !precious(r)).slice(0, room));
  return rows.filter((r) => precious(r) || keepOther.has(r));
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

/**
 * Save one row, and say truthfully what happened (14 Oct 2026). Every paid record already stored
 * is kept byte-for-byte: the cap never drops one, and a full browser store is never "fixed" by
 * shedding stored record bodies (the old fallback stripped older, then all, purchased records).
 * If the new row cannot be stored without that, the old store is left exactly as it was and the
 * outcome says saved: false, so the paying page keeps the delivered bytes on screen to download.
 * `saved` is read back from storage (the new row is there), and `recordKept` means the exact
 * record text intended for the row is there too.
 */
export function saveMyResult(entry: Omit<MyResult, "id" | "at"> & { at?: string; recordNotKept?: true }): SaveOutcome {
  // recordNotKept: the caller had a record it could not hand over (too large), so "kept" is never claimed.
  const { recordNotKept, ...fields } = entry;
  entry = fields;
  const at = entry.at ?? new Date().toISOString();
  // A counter keeps ids unique when two rows are saved in the same millisecond (or with one `at`).
  let row: MyResult = { ...entry, at, id: `${entry.kind}:${entry.subject}:${at}:${(seq = (seq + 1) % 1e6)}` };
  const failed = (): SaveOutcome => ({ rows: readMyResults(), saved: false, recordKept: false });
  let before: string | null;
  try {
    before = window.localStorage.getItem(MY_RESULTS_KEY);
  } catch {
    return failed(); // storage disabled: nothing was written, nothing is claimed
  }
  // The one snapshot everything below works from (no second read that could fail into "empty").
  // A stored value that cannot be read as a list is not an empty list: overwriting it would destroy
  // whatever it holds (paid records included). Fail honestly and leave it as it is.
  const all = parseRows(before);
  if (!all) return failed();
  // A repeat save of a paid result that arrives without its record keeps the stored record.
  const older = all.find((r) => sameResult(r, row));
  if (older && precious(older) && row.record === undefined) row = { ...row, record: older.record };
  // An older paid copy is replaced only by the exact same bytes; different bytes for the same
  // ref never overwrite it (both rows are kept).
  const replaced = older && precious(older) && row.record === older.record ? older : undefined;
  const prev = all.filter((r) => !(sameResult(r, row) && (!precious(r) || r === replaced)));
  const kept = new Map(all.filter(precious).map((r) => [r.id, r.record as string]));
  const write = (rows: MyResult[]) => window.localStorage.setItem(MY_RESULTS_KEY, JSON.stringify(rows));
  const restore = () => {
    try {
      if (before === null) window.localStorage.removeItem(MY_RESULTS_KEY);
      else window.localStorage.setItem(MY_RESULTS_KEY, before);
    } catch {
      /* the failed write did not land; the old value is still there */
    }
  };
  /** Write `cand`, then read back: the new row present and every paid record that stays, intact. */
  const attempt = (cand: MyResult): SaveOutcome | null => {
    const next = capRows([cand, ...prev]);
    if (!next.includes(cand)) return null; // no room without dropping a paid copy
    try {
      write(next);
    } catch {
      restore();
      return null;
    }
    const back = readMyResults();
    const mine = back.find((r) => r.id === cand.id);
    const intact = prev.every((p) => !kept.has(p.id) || back.some((r) => r.id === p.id && r.record === kept.get(p.id)));
    if (!mine || !intact) {
      restore();
      return null;
    }
    window.dispatchEvent(new Event(MY_RESULTS_EVENT));
    return { rows: back, saved: true, recordKept: !recordNotKept && (row.record === undefined || mine.record === row.record) };
  };
  // Store the row whole; if that does not fit, store it without its record (recordKept: false, so
  // the page says "download it"); otherwise store nothing and leave the old list untouched.
  // The record-less fallback is refused when the row replaces a stored paid copy: it would delete it.
  return attempt(row) ?? (row.record !== undefined && !replaced ? attempt({ ...row, record: undefined }) : null) ?? failed();
}

/** Kept for existing callers: returns the rows actually stored (not an unsaved list). */
export function addMyResult(entry: Omit<MyResult, "id" | "at"> & { at?: string; recordNotKept?: true }): MyResult[] {
  return saveMyResult(entry).rows;
}

/** What to tell a buyer about the save, from the outcome itself (never a guessed "saved"). */
export function saveNote(o: SaveOutcome | null | undefined): string | null {
  if (!o) return null;
  if (o.saved && o.recordKept) return "It is saved to My results in this browser only, so download it to keep it.";
  if (o.saved) return "It is listed in My results, but this browser had no room for the record itself: download it now to keep it.";
  return "It could NOT be saved to My results in this browser (storage full or switched off). Your earlier results are untouched. Download it now: this page is your only copy.";
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
