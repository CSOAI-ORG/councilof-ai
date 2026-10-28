/**
 * cardStatus — the PUBLICATION STATUS of a card id, read from the two withdrawal ledgers.
 *
 * WHY THIS EXISTS. On 7 Oct 2026 outside tools ran our records through our own verifier and found
 * that POST /api/verify answered plain VALID for every one of the 58 cards WITHDRAWN.jsonl
 * withdraws. The bytes are still served on purpose (a withdrawal is a public record, not an
 * erasure), and their signatures still verify — the signature is over the bytes and the bytes did
 * not change. What was missing was the second question a verifier owes its caller: is this card
 * still one we stand behind? The cryptographic result and the publication status are DIFFERENT
 * FACTS and this module keeps them in different fields; it never lets one answer the other.
 *
 * THE SOURCE OF TRUTH is the pair of ledgers under /interop/mill-cards-signed/ (the authority
 * /api/state → ledgers names for withdrawn signed cards; /api/hub-cards reads the same two files):
 *   WITHDRAWN.jsonl  — withdrawn with no replacement; each row names the correction (C-YYYY-MMDD-NN)
 *   SUPERSEDED.jsonl — replaced by a later card; each row names by_id, the replacement
 * They are fetched from the estate's own origin at check time, like /api/hub-cards does, so a
 * withdrawal appended on master reaches this verdict on the next deploy with no second producer.
 *
 * FOUR STATES, NEVER THREE. LIVE / WITHDRAWN / SUPERSEDED / UNCHECKED. UNCHECKED means a ledger
 * could not be read, so the status is unknown — it is reported as unknown, never rounded to LIVE.
 * A malformed ledger row makes that ledger unreadable (fail closed, the same rule as hub-cards):
 * a verifier that silently skipped a row it could not parse could skip the one that matters.
 */
export type CardStatus = "LIVE" | "WITHDRAWN" | "SUPERSEDED" | "UNCHECKED";

export const WITHDRAWN_LEDGER_PATH = "/interop/mill-cards-signed/WITHDRAWN.jsonl";
export const SUPERSEDED_LEDGER_PATH = "/interop/mill-cards-signed/SUPERSEDED.jsonl";

export interface WithdrawalRow {
  withdrawn_id: string;
  withdrawn_file: string | null;
  correction: string | null;
  reason: string | null;
  at: string | null;
  status_as_signed: string | null;
  model: string | null;
  axis: string | null;
}

export interface SupersessionRow {
  superseded_id: string;
  /** null when a correction retired the card without naming a replacement (one row on 2026-10-07, C-2026-0922-02). */
  by_id: string | null;
  by_file: string | null;
  reason: string | null;
  at: string | null;
  model: string | null;
  axis: string | null;
}

/** Flat, not a discriminated union: the functions tsconfig is strict:false, where `ok` would not narrow. */
export type LedgerRead<Row> = { ok: boolean; rows: Map<string, Row>; reason: string | null; url: string };
type Parsed<Row> = { ok: boolean; rows: Map<string, Row>; reason: string | null };

export interface StatusLedgers {
  withdrawn: LedgerRead<WithdrawalRow>;
  superseded: LedgerRead<SupersessionRow>;
}

/** What the verdict carries about a withdrawal. superseded_by is filled when SUPERSEDED.jsonl also names the id. */
export interface WithdrawalInfo {
  withdrawn_at: string | null;
  reason: string | null;
  correction_id: string | null;
  /** Where the correction that withdrew the card is published. */
  correction_pointer: string | null;
  status_as_signed: string | null;
  superseded_by: string | null;
  ledger: string;
}

export interface SupersessionInfo {
  superseded_at: string | null;
  reason: string | null;
  superseded_by: string | null;
  superseded_by_url: string | null;
  ledger: string;
}

export interface StatusVerdict {
  status: CardStatus;
  withdrawal: WithdrawalInfo | null;
  supersession: SupersessionInfo | null;
  /** Ledger reads that did not complete, each named. Empty when both ledgers were read. */
  unchecked: string[];
  ledgers: { withdrawn: string; superseded: string };
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function parseJsonl(text: string): { ok: boolean; rows: Record<string, unknown>[]; reason: string | null } {
  const rows: Record<string, unknown>[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    let v: unknown;
    try {
      v = JSON.parse(t);
    } catch {
      return { ok: false, rows: [], reason: `row ${i + 1} is not JSON` };
    }
    if (!isRecord(v)) return { ok: false, rows: [], reason: `row ${i + 1} is not an object` };
    rows.push(v);
  }
  return { ok: true, rows, reason: null };
}

function parseWithdrawn(text: string): Parsed<WithdrawalRow> {
  const p = parseJsonl(text);
  const out = new Map<string, WithdrawalRow>();
  if (!p.ok) return { ok: false, rows: out, reason: p.reason };
  for (const [i, r] of p.rows.entries()) {
    const id = str(r.withdrawn_id);
    if (!id) return { ok: false, rows: new Map(), reason: `row ${i + 1} has no withdrawn_id` };
    out.set(id, {
      withdrawn_id: id,
      withdrawn_file: str(r.withdrawn_file),
      correction: str(r.correction),
      reason: str(r.reason),
      at: str(r.at),
      status_as_signed: str(r.status_as_signed),
      model: str(r.model),
      axis: str(r.axis),
    });
  }
  return { ok: true, rows: out, reason: null };
}

function parseSuperseded(text: string): Parsed<SupersessionRow> {
  const p = parseJsonl(text);
  const out = new Map<string, SupersessionRow>();
  if (!p.ok) return { ok: false, rows: out, reason: p.reason };
  for (const [i, r] of p.rows.entries()) {
    const id = str(r.superseded_id);
    if (!id) return { ok: false, rows: new Map(), reason: `row ${i + 1} has no superseded_id` };
    if (r.by_id !== null && r.by_id !== undefined && !str(r.by_id)) return { ok: false, rows: new Map(), reason: `row ${i + 1} by_id is neither a string nor null` };
    out.set(id, {
      superseded_id: id,
      by_id: str(r.by_id),
      by_file: str(r.by_file),
      reason: str(r.reason),
      at: str(r.at),
      model: str(r.model),
      axis: str(r.axis),
    });
  }
  return { ok: true, rows: out, reason: null };
}

async function readOne<Row>(url: string, parse: (text: string) => Parsed<Row>, fetchImpl: typeof fetch): Promise<LedgerRead<Row>> {
  const failed = (reason: string): LedgerRead<Row> => ({ ok: false, rows: new Map(), reason, url });
  let res: Response;
  try {
    const init: RequestInit & { cf?: unknown } = {
      headers: { accept: "application/jsonl, text/plain" },
      cf: { cacheTtl: 300, cacheEverything: true },
    };
    res = await fetchImpl(url, init);
  } catch (e) {
    return failed(`fetch failed (${(e as Error).name || "error"})`);
  }
  if (!res.ok) return failed(`HTTP ${res.status}`);
  let text: string;
  try {
    text = await res.text();
  } catch {
    return failed("body unreadable");
  }
  const p = parse(text);
  return p.ok ? { ok: true, rows: p.rows, reason: null, url } : failed(p.reason ?? "unparseable");
}

/** Read both ledgers from the estate's own origin. Never throws; an unreadable ledger is reported as such. */
export async function readStatusLedgers(origin: string, fetchImpl: typeof fetch = fetch): Promise<StatusLedgers> {
  const [withdrawn, superseded] = await Promise.all([
    readOne(`${origin}${WITHDRAWN_LEDGER_PATH}`, parseWithdrawn, fetchImpl),
    readOne(`${origin}${SUPERSEDED_LEDGER_PATH}`, parseSuperseded, fetchImpl),
  ]);
  return { withdrawn, superseded };
}

/**
 * The status of one id. WITHDRAWN outranks SUPERSEDED (seven ids sit in both ledgers, read
 * 2026-10-07: the withdrawal is the later and stronger finding, and the supersession is still
 * reported beside it). A ledger that could not be read leaves its question open: the id is
 * UNCHECKED unless the other ledger already answered WITHDRAWN or SUPERSEDED, and even then the
 * unread ledger is named in `unchecked`.
 */
export function statusFor(id: string, ledgers: StatusLedgers, origin: string): StatusVerdict {
  const unchecked: string[] = [];
  const w: WithdrawalRow | null = ledgers.withdrawn.ok ? ledgers.withdrawn.rows.get(id) ?? null : null;
  const s: SupersessionRow | null = ledgers.superseded.ok ? ledgers.superseded.rows.get(id) ?? null : null;
  if (!ledgers.withdrawn.ok) unchecked.push(`WITHDRAWN.jsonl could not be read (${ledgers.withdrawn.reason})`);
  if (!ledgers.superseded.ok) unchecked.push(`SUPERSEDED.jsonl could not be read (${ledgers.superseded.reason})`);

  const supersession: SupersessionInfo | null = s
    ? {
        superseded_at: s.at,
        reason: s.reason,
        superseded_by: s.by_id,
        superseded_by_url: s.by_id && s.by_file ? `${origin}/interop/mill-cards-signed/${s.by_file}` : null,
        ledger: ledgers.superseded.url,
      }
    : null;
  const withdrawal: WithdrawalInfo | null = w
    ? {
        withdrawn_at: w.at,
        reason: w.reason,
        correction_id: w.correction,
        correction_pointer: w.correction ? `${origin}/api/corrections (corrections[].id == "${w.correction}")` : null,
        status_as_signed: w.status_as_signed,
        superseded_by: s?.by_id ?? null,
        ledger: ledgers.withdrawn.url,
      }
    : null;

  const status: CardStatus = w ? "WITHDRAWN" : s ? "SUPERSEDED" : unchecked.length ? "UNCHECKED" : "LIVE";
  return {
    status,
    withdrawal,
    supersession,
    unchecked,
    ledgers: { withdrawn: ledgers.withdrawn.url, superseded: ledgers.superseded.url },
  };
}
