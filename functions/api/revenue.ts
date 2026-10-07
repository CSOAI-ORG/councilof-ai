/**
 * GET /api/revenue — the three-SKU revenue instrumentation (EXEC-A-REVENUE.md §5).
 *
 * Reads the revenue counters straight out of counters.json (the counter canon) and, WHERE A
 * store is bound, the live KV/D1 tallies. It follows the same honesty doctrine as /api/counters
 * and /api/state:
 *   · No new Date() — nothing here follows the clock.
 *   · A count is null, NEVER 0, when there is no source. 0 asserts a measured zero; there is no
 *     live settle path until a facilitator is provisioned; the rail state is READ from
 *     railMode(env) rather than asserted here — in contract.null_rule AND in every SKU note —
 *     so every SKU count is honestly null until a receipt actually settles.
 *   · The north-of-truth number is settled_usdc — USDC that cleared to the estate pay_to on Base.
 *     Bytes/chain adjudicate revenue, not intent and not a CRM.
 *   · NO PRICES. This surface never imports _skus price atoms — doctrine forbids a public price,
 *     and the metered amount belongs only in an x402 402 challenge, never on a reporting surface.
 *
 * PROVISIONING (owner): bind a KV namespace (e.g. REVENUE_KV) for the replay/tally store and a
 * D1/licence registry; set REVENUE_KEY to gate the surface. Until then the counts read from the
 * canon (all null) and the surface reports UNMEASURED, which is the honest state of a rail that
 * has not yet taken money.
 */
import countersDoc from "../../counters.json";
import { railMode } from "./_x402_config";
import { selfWallets } from "./_x402";
import { headFromGet } from "./_head";
import { REQUEST_ATTESTATION_EXAMPLE_SUBJECT } from "./_x402_descriptions";

type CanonCounter = {
  value: string | number | null;
  status: string;
  phrasing: string;
  evidence: string;
  owner: string;
  note?: string;
};

export type RevenueEnv = {
  // Optional KV store holding live tallies + the settled-receipt replay set. Absent ⇒ canon-only.
  REVENUE_KV?: KVNamespace;
  // Optional gate. When set, the caller must present ?key= or an x-revenue-key header that matches.
  REVENUE_KEY?: string;
  // Read by railMode(env) — the ONLY way this surface learns the rail state. Never typed here.
  X402_PAY_TO?: string;
  X402_FACILITATOR_URL?: string;
  X402_SELF_WALLETS?: string;
};

// The rail clause of every SKU note is DERIVED from env, never copied from counters.json.
// The canon note for SKU-1 used to carry "No live settle path (x402 is fail-closed, mode:mock)"
// as typed text. contract.null_rule below was already reading railMode(env) — so after the
// facilitator was provisioned (2026-09-03) this endpoint said "live" in one field and "mock" in
// another, on the same payload, about money. Same defect, second field. A note about the rail
// reads itself off railMode(env); counters.json keeps the doctrine and nothing about the env.
// A rail clause must not assert that a metric is null: recorded settlements can leave a
// non-null count even when the current configuration changes.
function withRailState(env: RevenueEnv, canonNote: string | undefined): string {
  const r = railMode(env);
  const rail = r.mode === "live"
    ? `x402 rail: ${r.mode} — a facilitator is provisioned; settled receipts can be counted when recorded.`
    : `x402 rail: ${r.mode} — no live settlement path is configured; new receipts cannot settle through this configuration.`;
  return [(canonNote || "").trim(), rail].filter(Boolean).join(" ");
}

const canon = (countersDoc as { counters: Record<string, CanonCounter> }).counters;

/** A settlement record as recordSettlement() (functions/api/_x402.ts) wrote it, read back loosely:
 *  old records lack fields later versions carry, so every field is optional here. */
export type StoredSettlement = {
  payer?: string | null;
  self?: boolean;
  settled_at?: string;
  zero_value?: boolean;
  amount_atomic?: string | null;
  bazaar?: { status?: string } | null;
  resource?: string | null;
  transaction?: string | null;
  network?: string | null;
};

/** How many settled:tx:* keys one read will enumerate before it stops — bounded so the surface
 *  cannot spend an unbounded KV budget; the bound is reported, never silently applied. */
export const SETTLEMENT_KEY_LIMIT = 5000;

/**
 * listSettlementRecords — THE ONE enumeration of `settled:tx:*`. /api/revenue derives the One
 * Number from it and /api/door-settles derives each door's last settle from it; neither re-parses
 * the store on its own, so a record both surfaces can read is one record, read one way.
 * A key whose value is missing or not JSON is counted in `unreadable`, never dropped silently.
 */
export async function listSettlementRecords(
  kv: KVNamespace,
  limit = SETTLEMENT_KEY_LIMIT,
): Promise<{ keys: string[]; records: { key: string; record: StoredSettlement }[]; unreadable: number; truncated: boolean }> {
  const keys: string[] = [];
  let cursor: string | undefined;
  let truncated = false;
  do {
    const page = await kv.list({ prefix: "settled:tx:", cursor, limit: 1000 });
    for (const k of page.keys) keys.push(k.name);
    // KVNamespaceListResult is a union; the cursor exists only on the incomplete branch.
    cursor = page.list_complete ? undefined : (page as { cursor?: string }).cursor;
    if (cursor && keys.length >= limit) truncated = true;
  } while (cursor && keys.length < limit);
  const records: { key: string; record: StoredSettlement }[] = [];
  let unreadable = 0;
  for (const key of keys) {
    const raw = await kv.get(key);
    if (!raw) { unreadable++; continue; }
    try {
      records.push({ key, record: JSON.parse(raw) as StoredSettlement });
    } catch {
      unreadable++;
    }
  }
  return { keys, records, unreadable, truncated };
}

// Pull one revenue metric: prefer a live KV tally if bound, else the canon value (null).
async function metric(
  env: RevenueEnv,
  canonKey: string,
  kvKey: string,
): Promise<{ id: string; count: number | null; status: string; source: string; owner: string; note: string }> {
  const c = canon[canonKey] || ({} as CanonCounter);
  let count: number | null = null;
  let source = "counters.json";
  let status = c.status || "UNMEASURED";
  if (env.REVENUE_KV) {
    try {
      const raw = await env.REVENUE_KV.get(kvKey);
      if (raw != null && raw !== "") {
        const n = Number(raw);
        if (Number.isFinite(n)) {
          count = n;
          source = "REVENUE_KV";
          status = "MEASURED";
        }
      }
    } catch {
      // A KV read failure is not a zero. Leave count null and say the source could not be read.
      source = "REVENUE_KV (read failed — count stays null, never substituted)";
    }
  }
  // The canon value is a string; only adopt it when KV gave us nothing AND it is a real number.
  if (count == null && c.value != null) {
    const n = Number(c.value);
    if (Number.isFinite(n)) count = n;
  }
  return {
    id: canonKey,
    count,
    status: count != null ? status : "UNMEASURED",
    source,
    owner: c.owner || "Revenue",
    note: withRailState(env, c.note),
  };
}

/**
 * WHOSE SUBJECT WAS PAID FOR (7 Oct 2026, sell organ SG-09). A non-self payer is not yet a customer:
 * the two counted on 7 Oct paid for a pack about our own og-image and for our own data feed. The
 * subject a paid request named is read from the settled resource URL and classed:
 *   OURS        a host of the estate, or an id of one of our own models / overlays
 *   PLACEHOLDER a documentation placeholder (model-or-subject-id, example.com/.org/.net, localhost)
 *   EXAMPLE     the example value a door is listed under in /.well-known/x402.json — the subject a
 *               tester following the catalogue pays for (pinned to the manifest by revenue.outside.test.ts)
 *   OUTSIDE     anything else that names a single subject
 *   NONE        the door names no single subject (board totals, feeds, population slices, batches)
 * Read from the URL only: nothing here fetches the subject or decides who its owner is beyond this list.
 */
export type SubjectClass = "OURS" | "PLACEHOLDER" | "EXAMPLE" | "OUTSIDE" | "NONE";

/** The estate's own hosts (domain portfolio, 25 Sep 2026) and its Pages projects. */
export const OWN_HOSTS: readonly string[] = [
  "councilof.ai", "csoai.org", "proofof.ai", "openmoe.ai", "asisecurity.ai", "agisafe.ai", "safetyof.ai", "meok.ai",
  "defoneos.com", "councilof-ai.pages.dev", "csoai-site.pages.dev",
];
/** Our own model ids: the council fine-tunes and overlays (clan-*, sov*, csoai*, meok*). */
const OWN_ID = /(^|[^a-z0-9])(csoai|councilof|sov\d*|sovos|meok|clan)(?=$|[^a-z])/i;
const PLACEHOLDER_HOST = /(^|\.)(example\.(com|org|net)|localhost)$/i;
const PLACEHOLDER_IDS = new Set(["model-or-subject-id", "<id>", "<subject>", "<url>"]);
/** Query parameters through which a paid door names its one subject. */
export const SUBJECT_PARAMS = ["url", "subject", "endpoint", "server", "asset", "id", "model"] as const;
/**
 * The subject values the paid doors are LISTED under in /.well-known/x402.json (functions/.well-known/
 * x402.json.ts). revenue.outside.test.ts renders the manifest and fails when a listed example is not here.
 */
export const LISTED_EXAMPLE_SUBJECTS: ReadonlySet<string> = new Set([
  REQUEST_ATTESTATION_EXAMPLE_SUBJECT, "RLUSD", "usdc.e:arbitrum", "USDC",
  "https://councilof.ai/og-image.png", "https://councilof.ai/mcp", "https://councilof.ai/api/free-door",
]);

const hostOf = (v: string): string | null => {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" ? u.hostname.toLowerCase() : null;
  } catch {
    return null;
  }
};
const ownHost = (h: string) => OWN_HOSTS.some((o) => h === o || h.endsWith(`.${o}`));

export function subjectClassOf(resource: string | null | undefined): { cls: SubjectClass; subject: string | null } {
  let u: URL;
  try {
    u = new URL(String(resource || ""));
  } catch {
    return { cls: "NONE", subject: null };
  }
  let subject: string | null = null;
  for (const k of SUBJECT_PARAMS) {
    const v = u.searchParams.get(k);
    if (v && v.trim()) {
      subject = v.trim();
      break;
    }
  }
  const fromQuery = !!subject;
  // Per-asset doors carry the subject in the path: /api/wrapper/asset/<symbol>. That door IS the
  // asset (one door per asset), so its subject is never read as a listed example.
  if (!subject) subject = u.pathname.match(/^\/api\/wrapper\/asset\/([^/]+)$/)?.[1] ?? null;
  if (!subject) return { cls: "NONE", subject: null };
  if (PLACEHOLDER_IDS.has(subject.toLowerCase())) return { cls: "PLACEHOLDER", subject };
  const host = hostOf(subject);
  if (host && PLACEHOLDER_HOST.test(host)) return { cls: "PLACEHOLDER", subject };
  if (host ? ownHost(host) : OWN_ID.test(subject)) return { cls: "OURS", subject };
  if (fromQuery && LISTED_EXAMPLE_SUBJECTS.has(subject)) return { cls: "EXAMPLE", subject };
  return { cls: "OUTSIDE", subject };
}

/** The invoice rail's request counter (functions/api/art50/marking-evidence.ts). */
export const INVOICE_REQUESTED_KEY = "count:invoice_requested";
/** The first day the invoice rail recorded requests instead of issuing the pack before payment. */
export const INVOICE_COUNTING_SINCE = "2026-10-07";

/**
 * Art 50 packs issued on the invoice rail BEFORE payment — every invoice-gbp issuance written before
 * the rail became a quotation (7 Oct 2026). They sit inside count:issuances and were never paid, so
 * they are named here rather than left to read as sales. Bounded read; the bound is reported.
 *
 * `named_test` (repair round, 7 Oct 2026): the S-SG-04 check in the estate blueprint asks the invoice
 * rail with commissioned_by=test, and until this rule reaches production every run of it signs a
 * real pack and adds one to count:issuances (13 -> 15 on the morning of 7 Oct, from the engineer's and
 * the verifier's runs). Those packs carry the organisation "test"; they are counted by that name and
 * no other organisation name is read out or returned.
 */
async function legacyInvoiceIssuances(kv: KVNamespace, limit = 1000): Promise<{ count: number; named_test: number; read: number; truncated: boolean }> {
  const keys: string[] = [];
  let cursor: string | undefined;
  let truncated = false;
  do {
    const page = await kv.list({ prefix: "art50:", cursor, limit: 1000 });
    for (const k of page.keys) keys.push(k.name);
    cursor = page.list_complete ? undefined : (page as { cursor?: string }).cursor;
    if (cursor && keys.length >= limit) truncated = true;
  } while (cursor && keys.length < limit);
  let count = 0;
  let named_test = 0;
  for (const key of keys) {
    try {
      const r = JSON.parse((await kv.get(key)) || "null") as { payment?: { mode?: string; state?: string; commissioned_by?: unknown } } | null;
      if (r?.payment?.mode === "invoice-gbp" && r.payment.state !== "MARKED_PAID") {
        count++;
        if (typeof r.payment.commissioned_by === "string" && r.payment.commissioned_by.trim().toLowerCase() === "test") named_test++;
      }
    } catch {
      /* an unreadable record is not evidence of an unpaid pack */
    }
  }
  return { count, named_test, read: keys.length, truncated };
}

async function invoiceCounts(env: RevenueEnv): Promise<Record<string, unknown>> {
  const definition =
    "GBP invoice requests on the Article 50 door: one per reference (one organisation, one output's bytes), " +
    "recorded when the reference is first asked for. A request is neither revenue nor an issuance; the signed pack " +
    "is issued, and counted as an issuance, only when the owner marks the reference paid.";
  const kv = env.REVENUE_KV;
  if (!kv) {
    return {
      invoice_requested: { count: null, status: "UNMEASURED", source: "no REVENUE_KV bound — nothing is recorded, so nothing is counted", definition, counting_since: INVOICE_COUNTING_SINCE },
      issued_before_payment: { count: null, status: "UNMEASURED", source: "no REVENUE_KV bound" },
    };
  }
  let invoice_requested: Record<string, unknown>;
  try {
    const raw = await kv.get(INVOICE_REQUESTED_KEY);
    const n = raw == null || raw === "" ? 0 : Number(raw);
    invoice_requested = Number.isFinite(n)
      ? {
          count: n,
          status: "MEASURED",
          source: raw == null ? `REVENUE_KV ${INVOICE_REQUESTED_KEY} (absent: no request recorded since counting began)` : `REVENUE_KV ${INVOICE_REQUESTED_KEY}`,
          definition,
          counting_since: INVOICE_COUNTING_SINCE,
          counting_note: "Counted from the deploy of the quotation rule (on or after the date above). Earlier invoice-rail requests were issued as packs and are counted under issued_before_payment.",
        }
      : { count: null, status: "UNMEASURED", source: `REVENUE_KV ${INVOICE_REQUESTED_KEY} unreadable (${raw})`, definition, counting_since: INVOICE_COUNTING_SINCE };
  } catch (e) {
    invoice_requested = { count: null, status: "UNMEASURED", source: `REVENUE_KV read failed (${(e as Error).message}) — count stays null, never substituted`, definition, counting_since: INVOICE_COUNTING_SINCE };
  }
  let issued_before_payment: Record<string, unknown>;
  try {
    const legacy = await legacyInvoiceIssuances(kv);
    issued_before_payment = {
      count: legacy.count,
      status: legacy.truncated ? "PARTIAL" : "MEASURED",
      records_read: legacy.read,
      truncated: legacy.truncated,
      named_test: legacy.named_test,
      named_test_definition: 'of count, the packs issued for the organisation name "test" (any case): the blueprint check asks with commissioned_by=test',
      source: "REVENUE_KV art50:* records with payment.mode invoice-gbp and no paid mark",
      note:
        `Article 50 packs the invoice rail signed and issued before any payment, until the quotation rule reached production ` +
        `(on or after ${INVOICE_COUNTING_SINCE}; each record carries its own as_of). Each is inside skus.issuance.count, and none is a sale.`,
    };
  } catch (e) {
    issued_before_payment = { count: null, status: "UNMEASURED", source: `REVENUE_KV list failed (${(e as Error).message})` };
  }
  return { invoice_requested, issued_before_payment };
}

const DELIVERED_OUTSIDE_BASE = {
  id: "delivered_outside",
  definition:
    "Distinct non-self payer wallets (the one_number rules: payTo and X402_SELF_WALLETS excluded, non-zero settlements only) " +
    "with at least one settlement for a door that names a subject that is not ours. A payer who paid only for our own " +
    "subjects, a documentation placeholder, the example a door is listed under, or a door that names no single subject " +
    "is not counted.",
  subject_rule:
    "The subject is the settled resource URL's url / subject / endpoint / server / asset / id / model parameter, or the " +
    "/api/wrapper/asset/<symbol> path. OURS = an estate host (" + OWN_HOSTS.join(", ") + ") or our own model id " +
    "(clan-*, sov*, csoai*, meok*); PLACEHOLDER = model-or-subject-id, example.com/.org/.net or localhost; EXAMPLE = " +
    "the value the door is listed under in /.well-known/x402.json.",
  caveat:
    "A settlement record is written when the payment settles, before the pack is built; a pack that then failed to build " +
    "would still count. The payer's identity is not known: a wallet that is not on the self list is not proven to be a stranger.",
};

/**
 * THE ONE NUMBER — distinct wallets that are not ours and paid. Every outside read of this estate
 * on 2026-09-05 converged on it as the only figure that decides the next move. Derived from the
 * settlement records recordSettlement() writes (functions/api/_x402.ts), never from the tally:
 * a record names the payer, the tally does not. Null, never 0, when no store is bound. Zero is a
 * real zero only when the store is bound and holds no non-self record.
 */
async function oneNumber(env: RevenueEnv): Promise<Record<string, unknown>> {
  const kv = env.REVENUE_KV;
  const repeatPayerDefinition =
    "Distinct non-self payer wallets with at least two different recorded transaction IDs for facilitator-confirmed, non-zero settlements. " +
    "The 30-day count requires both settlements inside that window. A repeated wallet alone does not prove an independent customer.";
  const repeatPayers = (all_time: number | null, last_30d: number | null) => ({
    all_time, last_30d, definition: repeatPayerDefinition,
  });
  const base = {
    id: "distinct_nonself_payers",
    definition:
      "Count of distinct payer wallets, excluding payTo and X402_SELF_WALLETS, across facilitator-confirmed " +
      "settlements THAT MOVED A NON-ZERO AMOUNT. A wallet we control paying us is recorded but is neither " +
      "revenue nor a buyer, and neither is a wallet that paid nothing: a settlement of zero is not a purchase.",
  };
  if (!kv) {
    return { ...base, status: "UNMEASURED", all_time: null, last_30d: null, settlements: null, self_settlements: null, distinct_payers_by_door: null,
      repeat_nonself_payers: repeatPayers(null, null),
      source: "no REVENUE_KV bound — nothing is recorded, so nothing is counted",
      delivered_outside: { ...DELIVERED_OUTSIDE_BASE, status: "UNMEASURED", all_time: null, last_30d: null, payers_by_subject_class: null, source: "no REVENUE_KV bound" } };
  }
  try {
    const listed = await listSettlementRecords(kv);
    const now = Date.now();
    const since = now - 30 * 24 * 3600 * 1000;
    const all = new Set<string>();
    const recent = new Set<string>();
    const transactionsByPayer = new Map<string, Set<string>>();
    const recentTransactionsByPayer = new Map<string, Set<string>>();
    const byDoor: Record<string, Set<string>> = {};
    const outsideAll = new Set<string>();
    const outsideRecent = new Set<string>();
    const payersByClass: Record<SubjectClass, Set<string>> = { OURS: new Set(), PLACEHOLDER: new Set(), EXAMPLE: new Set(), OUTSIDE: new Set(), NONE: new Set() };
    let settlements = 0;
    let selfSettlements = 0;
    let zeroValueSettlements = 0;
    let externalSettledAtomic = 0n;
    const unreadable = listed.unreadable;
    // WHETHER THE FACILITATOR SAID IT INDEXED US. _x402.ts records this on every settle
    // (readBazaarOutcome, the EXTENSION-RESPONSES sidechannel) precisely because a facilitator
    // only MAY report the outcome and x402#2112 records one that never does, leaving services
    // silently unindexed. It has been written to every settlement record and surfaced NOWHERE:
    // the single number that answers "why are we not in the Bazaar" was measured and unreadable.
    //
    // Counted across ALL records, self included — Move A settled our own doors, and those are
    // exactly the settles whose indexing outcome we need. Aggregate only, like everything here.
    const bazaarOutcomes: Record<string, number> = {};
    for (const { record: r } of listed.records) {
      const bz = r.bazaar?.status ?? "ABSENT";
      bazaarOutcomes[bz] = (bazaarOutcomes[bz] ?? 0) + 1;
      const payer = (r.payer || "").toLowerCase();
      // Re-evaluate ownership when reading. Old records preserve what the deployment knew at
      // settlement time, but an explicitly documented internal test wallet may be identified
      // later. Revenue must correct itself retroactively rather than freeze a known false buyer.
      if (r.self || (!!payer && selfWallets(env).has(payer))) {
        selfSettlements++;
        continue;
      }
      // A SETTLEMENT OF ZERO IS NOT A PURCHASE. Measured 2026-09-05: one zero-value settle through
      // /api/free-door, signed by an EPHEMERAL wallet created in a probe, moved all_time from 0 to
      // 1 — a wallet we created and controlled, paying nothing, counted as a distinct non-self
      // BUYER. That contradicts this number's own definition and is enough to trip its own gate,
      // "≥1 repeat: open the next door", on our own test traffic.
      //
      // `self` cannot catch it: that tests membership of X402_SELF_WALLETS, and a seed or probe
      // signs from a throwaway key no list can enumerate in advance. Amount is the only test that
      // holds for a wallet nobody can name beforehand.
      //
      // amount_atomic is read as a FALLBACK because records written before _x402.ts carried
      // `zero_value` have no such field — including the one that produced the 1. Reading only the
      // flag would have left the live number wrong for exactly the record that revealed the bug.
      // An absent or non-numeric amount counts as zero: it is not evidence of a purchase, and for
      // a revenue figure the honest direction is to decline the claim, not to assume it.
      const zeroValue =
        r.zero_value === true || !r.amount_atomic || !/^[1-9]\d*$/.test(String(r.amount_atomic));
      if (zeroValue) { zeroValueSettlements++; continue; }
      settlements++;
      externalSettledAtomic += BigInt(String(r.amount_atomic));
      if (!payer) continue;
      all.add(payer);
      const settledAt = r.settled_at ? Date.parse(r.settled_at) : NaN;
      const inLast30d = Number.isFinite(settledAt) && settledAt >= since && settledAt <= now;
      if (inLast30d) recent.add(payer);
      // A duplicate KV row is not a repeat purchase. Without a transaction ID, the record
      // remains in the existing payer count but cannot establish the stricter repeat gate.
      const transaction = typeof r.transaction === "string" ? r.transaction.trim().toLowerCase() : "";
      if (transaction) {
        if (!transactionsByPayer.has(payer)) transactionsByPayer.set(payer, new Set());
        transactionsByPayer.get(payer)!.add(transaction);
        if (inLast30d) {
          if (!recentTransactionsByPayer.has(payer)) recentTransactionsByPayer.set(payer, new Set());
          recentTransactionsByPayer.get(payer)!.add(transaction);
        }
      }
      // Per door, the same definition as all_time: distinct non-self wallets that moved a
      // non-zero amount. A record that names no resource is grouped under UNKNOWN_RESOURCE
      // rather than dropped, so the per-door counts always sum to at least all_time.
      const door = (r.resource || "").trim() || "UNKNOWN_RESOURCE";
      (byDoor[door] ??= new Set<string>()).add(payer);
      // Whose subject this payer paid for (SG-09): only a subject that is not ours makes the
      // payer evidence of an outside customer.
      const { cls } = subjectClassOf(r.resource);
      payersByClass[cls].add(payer);
      if (cls === "OUTSIDE") {
        outsideAll.add(payer);
        if (inLast30d) outsideRecent.add(payer);
      }
    }
    const distinct_payers_by_door = Object.fromEntries(
      Object.keys(byDoor).sort().map((d) => [d, byDoor[d].size]),
    );
    const countRepeat = (transactions: Map<string, Set<string>>) =>
      [...transactions.values()].filter((ids) => ids.size >= 2).length;
    return { ...base, status: "MEASURED", all_time: all.size, last_30d: recent.size, settlements, self_settlements: selfSettlements,
      repeat_nonself_payers: repeatPayers(countRepeat(transactionsByPayer), countRepeat(recentTransactionsByPayer)),
      settled_usdc_atomic: Number(externalSettledAtomic),
      // Which doors the non-self wallets actually paid — the only per-door demand signal that is
      // not a listing. Absent (null) when no store is bound; {} when records exist but none count.
      distinct_payers_by_door,
      // Reported, never silently dropped: a reader can see that records exist and why they are
      // not buyers. settlements counts only non-self settlements that moved a non-zero amount.
      zero_value_settlements: zeroValueSettlements,
      zero_value_note:
        "Non-self settlements that moved 0, or carried no readable amount. Recorded for audit, " +
        "never counted as a payer — paying nothing does not make a buyer. Seeds and probes land here.",
      records_unreadable: unreadable, source: "REVENUE_KV settled:tx:* records",
      indexing: {
        facilitator_bazaar_outcomes: bazaarOutcomes,
        note:
          "Per settlement record, what the facilitator reported on the EXTENSION-RESPONSES " +
          "sidechannel at settle time. REPORTED means it said something; UNREPORTED means it " +
          "said nothing, which is NOT the same as not being indexed and is NOT evidence that we " +
          "are. ABSENT means the record predates the field. Nothing here is a claim about any " +
          "index — read the index itself: scripts/interop/x402-bazaar-audit.py walks PayAI and " +
          "Coinbase CDP to completion and is the only thing that can say whether we are in one.",
      },
      gates: { "0 for 30 days": "shape or price is wrong; do not add doors", "≥1 repeat": "open the next door", "≥5 distinct in 30d": "it is a product" },
      delivered_outside: {
        ...DELIVERED_OUTSIDE_BASE,
        status: "MEASURED",
        all_time: outsideAll.size,
        last_30d: outsideRecent.size,
        payers_by_subject_class: Object.fromEntries((Object.keys(payersByClass) as SubjectClass[]).map((k) => [k, payersByClass[k].size])),
        source: "REVENUE_KV settled:tx:* records — the same non-self, non-zero settlements as one_number",
      } };
  } catch (e) {
    return { ...base, status: "UNMEASURED", all_time: null, last_30d: null, settlements: null, self_settlements: null, distinct_payers_by_door: null,
      repeat_nonself_payers: repeatPayers(null, null),
      source: `REVENUE_KV read failed (${(e as Error).message}) — count stays null, never substituted`,
      delivered_outside: { ...DELIVERED_OUTSIDE_BASE, status: "UNMEASURED", all_time: null, last_30d: null, payers_by_subject_class: null, source: "REVENUE_KV read failed" } };
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

export async function buildRevenue(env: RevenueEnv) {
  const [issuances, proofs, licences, settledFromTally, oneNumberRead, invoice] = await Promise.all([
    metric(env, "revenue_issuances", "count:issuances"),
    metric(env, "revenue_proofs", "count:proofs"),
    metric(env, "revenue_licences", "count:licences"),
    metric(env, "revenue_settled_usdc", "settled:usdc_atomic"),
    oneNumber(env),
    invoiceCounts(env),
  ]);
  // delivered_outside is read in the same pass over settled:tx:* and served BESIDE one_number.
  const { delivered_outside, ...one_number } = oneNumberRead as Record<string, unknown> & { delivered_outside: unknown };
  const issuedBeforePayment = (invoice.issued_before_payment as { count?: number | null } | undefined)?.count ?? null;
  const settled =
    one_number.status === "MEASURED" && typeof one_number.settled_usdc_atomic === "number"
      ? {
          ...settledFromTally,
          count: one_number.settled_usdc_atomic,
          status: "MEASURED",
          source: "REVENUE_KV settled:tx:* records (owner-controlled and zero-value settlements excluded)",
        }
      : settledFromTally;

  return {
    schema: "csoai.revenue/0.1",
    contract: {
      derivation:
        "Counts read from counters.json (the counter canon) and, where bound, the REVENUE_KV " +
        "tallies. Nothing is fetched over HTTP and no count is typed by hand.",
      null_rule:
        `A count is null, never 0, when its source has no measured value. The x402 rail is currently ` +
        `${railMode(env).mode}` +
        (railMode(env).mode === "live"
          ? ` — a facilitator is provisioned; settled receipts can be counted when recorded.`
          : ` — no live settlement path is configured; new receipts cannot settle through this configuration.`),
      north_of_truth:
        "settled_usdc is derived from facilitator-confirmed settlement records and the accepted " +
        "challenge amount, with self and zero-value records excluded. This endpoint does not " +
        "independently reconcile the on-chain transfer amount or establish a customer relationship.",
      no_prices:
        "This surface never publishes a price. Metered amounts appear only in an x402 402 " +
        "challenge (the accepts array), never here and never on the free board.",
      not_a_grade: "Revenue is earned on issuance, assembly, and a durable signature — never a grade.",
    },
    skus: {
      issuance: {
        sku: "SKU-1",
        ...issuances,
        // Named, not subtracted: the tally is what was written, and these packs are inside it.
        includes_issued_before_payment: issuedBeforePayment,
      },
      proofs: { sku: "SKU-2", ...proofs },
      licences: { sku: "SKU-3", ...licences },
    },
    settled_usdc: { ...settled, unit: "USDC atomic (6dp) on Base", excludes_self: true },
    one_number,
    delivered_outside,
    invoice,
    provisioning: {
      kv_bound: !!env.REVENUE_KV,
      gated: !!env.REVENUE_KEY,
      owner_switches: [
        "bind REVENUE_KV (replay + tally store)",
        "set X402_PAY_TO + choose facilitator (turns the rail live; see functions/api/_x402.ts)",
      ],
    },
    note: "Aggregate-only. NO telemetry, NO per-user data, NO fabricated counts. Measurement, never certification.",
  };
}

export const onRequestGet: PagesFunction<RevenueEnv> = async ({ request, env }) => {
  // Soft gate: only enforced when the owner has set REVENUE_KEY. No key configured ⇒ the surface
  // carries nothing sensitive (all counts null, no prices), so it serves the canon read-through.
  if (env.REVENUE_KEY) {
    const url = new URL(request.url);
    const presented = url.searchParams.get("key") || request.headers.get("x-revenue-key") || "";
    if (presented !== env.REVENUE_KEY) {
      return json(
        {
          schema: "csoai.revenue/0.1",
          error: "unauthorized",
          reason: "This surface is gated (REVENUE_KEY set). Present ?key= or x-revenue-key.",
        },
        401,
      );
    }
  }

  return json(await buildRevenue(env));
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
