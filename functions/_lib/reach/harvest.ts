/**
 * The HARVEST digest carried by each daily note (/notes/daily/<date>/): what the estate's SIGNED
 * outputs dated <date> recorded, and nothing else. Each item links to its signed record.
 *
 *   divergences   new / changed / resolved INCONSISTENT findings in that day's signed cross-ledger
 *                 record, against the previous record it names in `changes.previous` (sha256-pinned);
 *   corrections   corrections-ledger entries dated that day (the signed ledger, /api/corrections);
 *   payers        outside payers first seen that day: distinct wallets that are not ours
 *                 (self-settlements excluded) and paid a non-zero amount; each links to its
 *                 settlement transaction on Base (the chain is the signed record);
 *   reproductions outside reproductions or implementations — no record of any exists in the estate,
 *                 so this is UNMEASURED, never 0;
 *   chain         days unbroken: consecutive daily indexes ending at <date>, walked back through
 *                 prev_index_sha256 links with gap_days = 0, every link signature-verified.
 *
 * No editorial judgement: counts, states, links. A section whose source has no record for the date
 * says so; a section whose source cannot be read makes the whole note a 503 (never half a digest).
 */
import { type Ctx, type Json, NotFound, SITE } from "./core";
import { correctionLink, ledgerEntries } from "./corrections";
import { type SignedRecord } from "./hf";
import { type Finding, loadXl } from "./stablecoins";

export interface DivergenceItem { change: "NEW" | "CHANGED" | "RESOLVED"; key: string; state: string; was?: string; asset: string; ledger: string; product?: string; kind?: string; page: string }
export interface Harvest {
  date: string;
  divergences: { state: "COMPARED" | "BASELINE" | "NO_RECORD"; record?: { url: string; signed: string; sha256: string; version: string }; previous?: { date: string; sha256: string } | null; items: DivergenceItem[]; record_reported_changes?: Record<string, number> };
  corrections: { items: { id: string; status: string; what_was_wrong: string; url: string }[]; ledger: string };
  payers: { state: "MEASURED" | "UNMEASURED"; why?: string; items: { payer: string; tx: string; tx_url: string; settled_at: string; resource: string | null }[] };
  reproductions: { state: "UNMEASURED"; why: string };
  chain: { days_unbroken: number; since: string; walked: { date: string; sha256: string; gap_days: number }[]; stop: string };
}

const fkey = (f: Finding) => [f.asset, f.ledger, (f.deployment_id || "").toLowerCase(), f.kind || ""].join("|");
const chainOf = (s: string) => String(s || "").toLowerCase();

export function diffDivergences(cur: Finding[], prev: Finding[] | null): DivergenceItem[] {
  const page = (f: Finding) => `${SITE}/stablecoins/${chainOf(f.asset)}/${chainOf(f.ledger)}/`;
  const incon = (xs: Finding[]) => new Map(xs.filter((f) => f.state === "INCONSISTENT").map((f) => [fkey(f), f]));
  const c = incon(cur);
  if (!prev) return [...c.values()].map((f) => ({ change: "NEW", key: fkey(f), state: f.state, asset: f.asset, ledger: f.ledger, product: f.product, kind: f.kind, page: page(f) }));
  const pAll = new Map(prev.map((f) => [fkey(f), f]));
  const p = incon(prev);
  const out: DivergenceItem[] = [];
  for (const [k, f] of c) {
    const was = pAll.get(k);
    if (!was) out.push({ change: "NEW", key: k, state: f.state, asset: f.asset, ledger: f.ledger, product: f.product, kind: f.kind, page: page(f) });
    else if (was.state !== f.state || (was.supply_decimal ?? null) !== (f.supply_decimal ?? null)) out.push({ change: "CHANGED", key: k, state: f.state, was: was.state, asset: f.asset, ledger: f.ledger, product: f.product, kind: f.kind, page: page(f) });
  }
  for (const [k, f] of p) if (!c.has(k)) out.push({ change: "RESOLVED", key: k, state: "no longer INCONSISTENT", was: f.state, asset: f.asset, ledger: f.ledger, product: f.product, kind: f.kind, page: page(f) });
  return out.sort((a, b) => a.change.localeCompare(b.change) || a.key.localeCompare(b.key));
}

async function divergences(ctx: Ctx, date: string): Promise<Harvest["divergences"]> {
  const cur = await loadXl(ctx, date);
  if (!cur) return { state: "NO_RECORD", items: [] };
  const ch = (cur.changes || {}) as Json;
  const prevRef = (ch.previous || null) as { date?: string; sha256?: string } | null;
  let prev: Finding[] | null = null;
  if (ch.state === "COMPARED" && prevRef?.date) {
    const p = await loadXl(ctx, prevRef.date);
    // The previous record must be the exact bytes this record names; otherwise no diff is claimed.
    if (p && (!prevRef.sha256 || p.record.sha256 === prevRef.sha256)) prev = p.findings;
  }
  const reported: Record<string, number> = {};
  for (const [k, v] of Object.entries(ch)) if (v && typeof v === "object") for (const [k2, v2] of Object.entries(v as Json)) if (Array.isArray(v2)) reported[`${k}.${k2}`] = v2.length;
  for (const [k, v] of Object.entries(ch)) if (Array.isArray(v)) reported[k] = v.length;
  return {
    state: prev ? "COMPARED" : "BASELINE",
    record: { url: cur.record.url, signed: cur.record.signedUrl, sha256: cur.record.sha256, version: cur.version },
    previous: prev && prevRef?.date ? { date: prevRef.date, sha256: String(prevRef.sha256 || "") } : null,
    items: diffDivergences(cur.findings, prev),
    record_reported_changes: reported,
  };
}

function corrections(date: string): Harvest["corrections"] {
  const items = ledgerEntries()
    .filter((c) => String(c.date || "").slice(0, 10) === date)
    .map((c) => ({ id: c.id, status: String(c.status || "not stated"), what_was_wrong: String(c.what_was_wrong || ""), url: `${SITE}${correctionLink(c.id)}` }));
  return { items, ledger: `${SITE}/api/corrections` };
}

type Kv = { list: (o: { prefix: string; cursor?: string; limit?: number }) => Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>; get: (k: string) => Promise<string | null> };
type SettleRec = { payer?: string | null; self?: boolean; settled_at?: string; zero_value?: boolean; amount_atomic?: string | null; tx?: string | null; resource?: string | null };
export const MAX_RECEIPTS = 2000;

export function newOutsidePayers(records: { name: string; rec: SettleRec }[], date: string): Harvest["payers"]["items"] {
  const first = new Map<string, { payer: string; tx: string; settled_at: string; resource: string | null }>();
  for (const { name, rec } of records) {
    if (rec.self || rec.zero_value || !rec.payer || !rec.settled_at) continue;
    if (!rec.amount_atomic || !/^[1-9]\d*$/.test(rec.amount_atomic)) continue;
    const payer = rec.payer.toLowerCase();
    const tx = rec.tx || name.replace(/^settled:tx:/, "");
    const cur = first.get(payer);
    if (!cur || rec.settled_at < cur.settled_at) first.set(payer, { payer, tx, settled_at: rec.settled_at, resource: rec.resource ?? null });
  }
  return [...first.values()].filter((x) => x.settled_at.slice(0, 10) === date)
    .map((x) => ({ ...x, tx_url: `https://basescan.org/tx/${encodeURIComponent(x.tx)}` }))
    .sort((a, b) => a.settled_at.localeCompare(b.settled_at));
}

async function payers(ctx: Ctx, date: string): Promise<Harvest["payers"]> {
  const kv = (ctx.env as { REVENUE_KV?: Kv }).REVENUE_KV;
  if (!kv) return { state: "UNMEASURED", why: "the settlement store is not bound here", items: [] };
  const recs: { name: string; rec: SettleRec }[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: "settled:tx:", cursor, limit: 1000 });
    for (const k of page.keys) {
      if (recs.length >= MAX_RECEIPTS) break;
      const raw = await kv.get(k.name);
      if (!raw) continue;
      try { recs.push({ name: k.name, rec: JSON.parse(raw) as SettleRec }); } catch { /* unreadable record: not counted */ }
    }
    cursor = page.list_complete || recs.length >= MAX_RECEIPTS ? undefined : page.cursor;
  } while (cursor);
  if (recs.length >= MAX_RECEIPTS) return { state: "UNMEASURED", why: `more than ${MAX_RECEIPTS} settlement records: a partial read is never counted`, items: [] };
  return { state: "MEASURED", items: newOutsidePayers(recs, date) };
}

/** Days unbroken, from the chained index: walk prev links while each link is gapless and pins the previous day's bytes. */
async function chain(date: string, index: SignedRecord, load: (d: string) => Promise<SignedRecord>): Promise<Harvest["chain"]> {
  const walked: Harvest["chain"]["walked"] = [];
  let cur = index;
  let curDate = date;
  let stop = "reached the genesis index (prev = null)";
  for (let i = 0; i < 400; i++) {
    const j = cur.json;
    const gap = typeof j.gap_days === "number" ? j.gap_days : 0;
    walked.push({ date: curDate, sha256: cur.sha256, gap_days: gap });
    const prevDate = typeof j.prev_date === "string" ? j.prev_date : null;
    if (!prevDate) break;
    if (gap !== 0) { stop = `${curDate} declares gap_days = ${gap} before it`; break; }
    let prev: SignedRecord;
    try { prev = await load(prevDate); } catch (e) {
      if (e instanceof NotFound) { stop = `the index for ${prevDate} is missing or does not verify`; break; }
      throw e;
    }
    if (typeof j.prev_index_sha256 === "string" && j.prev_index_sha256 !== prev.sha256) { stop = `${curDate} names bytes for ${prevDate} that are not the published index`; break; }
    cur = prev;
    curDate = prevDate;
  }
  return { days_unbroken: walked.length, since: walked[walked.length - 1].date, walked, stop };
}

export async function harvest(ctx: Ctx, date: string, index: SignedRecord, load: (d: string) => Promise<SignedRecord>): Promise<Harvest> {
  const [d, p, c] = await Promise.all([divergences(ctx, date), payers(ctx, date), chain(date, index, load)]);
  return {
    date,
    divergences: d,
    corrections: corrections(date),
    payers: p,
    reproductions: { state: "UNMEASURED", why: "no record of an outside reproduction or implementation exists in the estate's published records; none is counted, and absence is not a zero" },
    chain: c,
  };
}
