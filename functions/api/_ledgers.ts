/**
 * _ledgers.ts — the `ledgers` block of GET /api/state: every public ledger, its ONE authority, its
 * count, head digest, last update and whether its head is a leaf of the ONE public root.
 *
 * NOTHING HERE IS TYPED FROM MEMORY. Every count and digest is read from committed bytes:
 *   - the ledger-head atoms public/interop/ledger-heads-2026-09/card-ledger-<key>-unsigned.json,
 *     written by scripts/readers/ledger_heads_reader.py from the SERVED bytes of each ledger (a public
 *     readback) and refreshed by the daily root job, which also signs each atom into the public root;
 *   - root-inclusion.json beside them (the reader's --resolve-root join: which root leaf carries which
 *     atom), checked here against public/root.json card_sha256 itself;
 *   - public/interop/root-witness-latest.json for the root's Rekor and OTS states;
 *   - the corrections ledger object (./corrections LEDGER) for the count this deploy serves.
 * No live probe runs here (see the /api/state contract): the block is deterministic for a deploy.
 *
 * EVIDENCE STATES ARE SEPARATE FIELDS and are never collapsed into one word: signature, OTS calendar
 * pending, Bitcoin verified and public readback each answer a different question. A withdrawn
 * record is never counted as admitted.
 *
 * ONE AUTHORITY PER RECORD TYPE. Where two surfaces made different determinations about the same
 * thing, `authorities[].resolved` names the authority and the other surface becomes a feed into it
 * or a view of it (council-os/LANE-PROTOCOL.md; the two-determinations rule).
 */
import { LEDGER } from "./corrections";
import publicRoot from "../../public/root.json";
import rootWitness from "../../public/interop/root-witness-latest.json";
import hCorrections from "../../public/interop/ledger-heads-2026-09/card-ledger-corrections-unsigned.json";
import hFix from "../../public/interop/ledger-heads-2026-09/card-ledger-fix-receipts-unsigned.json";
import hWithdrawals from "../../public/interop/ledger-heads-2026-09/card-ledger-withdrawals-mill-cards-unsigned.json";
import hRegister from "../../public/interop/ledger-heads-2026-09/card-ledger-claim-maintenance-register-unsigned.json";
import hChecks from "../../public/interop/ledger-heads-2026-09/card-ledger-claim-maintenance-checks-unsigned.json";
import hWatch from "../../public/interop/ledger-heads-2026-09/card-ledger-corrections-watch-unsigned.json";
import hLayerO from "../../public/interop/ledger-heads-2026-09/card-ledger-layer-o-presence-unsigned.json";
import hReceipts from "../../public/interop/ledger-heads-2026-09/card-ledger-receipt-chain-unsigned.json";
import rootInclusion from "../../public/interop/ledger-heads-2026-09/root-inclusion.json";

type Json = Record<string, any>;
type Atom = { as_of: string; sha256: string; source_urls: string[]; payload: Json };

export const LEDGER_HEADS_DIR = "public/interop/ledger-heads-2026-09";
const READER = "scripts/readers/ledger_heads_reader.py";
const ROOT_JOB = "the daily public-root job (build pod root-daily, 05:00Z) via scripts/adapters/staged_leaves.py";

/** Static description of each ledger: who produces it, how it is signed, where it lives. Counts never live here. */
export const LEDGER_META: Record<string, { name: string; authority_for: string; producer: string; signing: string; anchoring_own: string; page: string | null; atom: Atom }> = {
  corrections: {
    name: "Corrections ledger", authority_for: "corrections of our own published statements (C-YYYY-MMDD-NN)",
    producer: "functions/api/corrections.ts (entries added by promotion or by the lane that found the fault; re-signed by scripts/sign-corrections-ledger.mjs)",
    signing: "detached Ed25519 attestation over the ledger body's sha256, did:web:csoai.org#board-attestation-1 via POST /api/board-sign",
    anchoring_own: "none of its own; its head is a leaf of the public root", page: "/corrections", atom: hCorrections as Atom,
  },
  "fix-receipts": {
    name: "Fix receipts", authority_for: "before/after readings that a fix held (FR-YYYY-MMDD-NN)",
    producer: "scripts/fix_receipts.py", signing: "unsigned; hash-linked (prev_hash, state_digest)",
    anchoring_own: "none of its own; its head is a leaf of the public root", page: null, atom: hFix as Atom,
  },
  "withdrawals-mill-cards": {
    name: "Withdrawn signed mill cards", authority_for: "signed mill cards withdrawn from use; each row names its correction",
    producer: "public/interop/mill-cards-signed/WITHDRAWN.jsonl (appended with the correction that withdraws)", signing: "unsigned rows; the withdrawn cards keep their own signatures",
    anchoring_own: "none of its own; its head is a leaf of the public root", page: null, atom: hWithdrawals as Atom,
  },
  "claim-maintenance-register": {
    name: "Claim-maintenance register", authority_for: "claim state per maintained subject (CLAIM_CAPTURED / CLAIM_MEASURED / UNMEASURED / UNCHECKABLE)",
    producer: "scripts/claim-maintenance-register.mjs from public/claims/*.json", signing: "each registry has a signed sidecar (.signed.json, did:web:csoai.org#board-attestation-1); the register itself is generated",
    anchoring_own: "per-registry .ots receipts", page: "/claims-register", atom: hRegister as Atom,
  },
  "claim-maintenance-checks": {
    name: "Claim-maintenance re-checks", authority_for: "executed day-7/30/90 re-checks of maintained claims and their outcomes",
    producer: "scripts/claims/maintenance_due.py inside the daily claim-watch job (the ONE scheduler)", signing: "unsigned; hash-linked rows (prev_hash, row_sha256)",
    anchoring_own: "none of its own; its head is a leaf of the public root", page: "/corrections#claim-maintenance", atom: hChecks as Atom,
  },
  "corrections-watch": {
    name: "Corrections watch", authority_for: "whether OTHER organisations' published corrections reached their own pages (third-party measurement; not our corrections)",
    producer: "corrections-watch.py, daily 06:10Z", signing: "each dated file signed via POST /api/board-sign since 2026-09-28",
    anchoring_own: "each dated file OTS-stamped", page: null, atom: hWatch as Atom,
  },
  "layer-o-presence": {
    name: "Distribution presence", authority_for: "operational surfaces where our artifacts appear, with their states (rollup of the distribution-presence registry)",
    producer: "the distribution-presence registry daily job", signing: "unsigned; its event chain is hash-linked",
    anchoring_own: "none of its own; its head is a leaf of the public root", page: null, atom: hLayerO as Atom,
  },
  "receipt-chain": {
    name: "Receipt chain", authority_for: "what the estate's own loops did, hash-linked",
    producer: "the hourly spine loop", signing: "unsigned; hash-linked (prev_hash, state_digest)",
    anchoring_own: "an OpenTimestamps receipt of the chain file", page: null, atom: hReceipts as Atom,
  },
};

const rootLeaves = new Set<string>(((publicRoot as Json).card_sha256 ?? []) as string[]);
const inc = rootInclusion as Json;
const w = ((rootWitness as Json).witnesses ?? {}) as Json;
const otsStatus: string | null = w.ots?.status ?? null;
const rekorStatus: string | null = w.rekor?.status ?? null;

/** IN_ROOT only when the recorded leaf is actually in the committed root.json. */
export function rootInclusionOf(key: string, atomSha: string, incDoc: Json, leaves: Set<string>, atomAsOf = "", rootMerkle: unknown = (publicRoot as Json).merkle_root) {
  const r = incDoc?.ledgers?.[key];
  const sameRoot = incDoc?.merkle_root === rootMerkle;
  const pending = { state: "PENDING_NEXT_ROOT", leaf_sha256: null, why: "this head has not been through a root run yet; the next daily root signs it as a leaf" };
  if (!r || r.atom_sha256 !== atomSha) return pending;
  if (r.leaf_sha256 && leaves.has(r.leaf_sha256) && sameRoot) return { state: "IN_ROOT", leaf_sha256: r.leaf_sha256, why: null };
  // an inclusion record made against a root older than this read cannot say the head was left out
  if (!r.leaf_sha256 && String(incDoc?.root_as_of ?? "") < atomAsOf) return pending;
  return { state: "NOT_IN_ROOT", leaf_sha256: r.leaf_sha256 ?? null, why: sameRoot ? "no leaf of the committed root carries this head" : "the inclusion record names a different root" };
}

export function ledgerRow(key: string) {
  const m = LEDGER_META[key];
  const p = m.atom.payload;
  const probed = p.state === "PROBED";
  const inclusion = rootInclusionOf(key, m.atom.sha256, inc, rootLeaves, m.atom.as_of);
  return {
    key, name: m.name, authority_for: m.authority_for, served_url: p.served_url, page: m.page, producer: m.producer,
    count: probed ? p.entries ?? null : null,
    count_kind: probed ? "probed" : "unmeasured",
    head_id: p.head_id ?? null,
    head_digest: p.head_digest ?? p.ids_sha256 ?? null,
    bytes_sha256: p.bytes_sha256 ?? null,
    last_update: p.last_update ?? null,
    read_at: m.atom.as_of,
    state: p.state,
    ...(p.reason ? { reason: p.reason } : {}),
    detail: Object.fromEntries(Object.entries(p).filter(([k]) =>
      ["verdicts", "corrections_refs", "by_correction", "row_states", "outcomes", "registries", "subjects", "kinds", "events", "counts_by_state", "signed", "scope", "admitted", "admitted_rule", "links", "signature_state"].includes(k))),
    evidence_state: {
      signature: key === "corrections" ? (p.signature_state ?? "UNMEASURED") : m.signing,
      public_readback: probed ? `HTTP ${p.http_status}, sha256 ${String(p.bytes_sha256).slice(0, 16)}… at ${m.atom.as_of}` : `UNMEASURED (HTTP ${p.http_status})`,
      root_inclusion: inclusion.state,
      root_leaf_sha256: inclusion.leaf_sha256,
      ots_calendar_pending: inclusion.state === "IN_ROOT" ? otsStatus === "STAMPED_PENDING_BITCOIN" : null,
      bitcoin_verified: inclusion.state === "IN_ROOT" ? /BITCOIN_VERIFIED|UPGRADED_VERIFIED/.test(String(otsStatus)) : null,
      rekor: inclusion.state === "IN_ROOT" ? rekorStatus : null,
    },
    signing: m.signing,
    anchoring_own: m.anchoring_own,
    atom: `${LEDGER_HEADS_DIR}/card-ledger-${key}-unsigned.json`,
    atom_sha256: m.atom.sha256,
  };
}

type Check = { registry_id: string; check: string; due: string; outcome: string };

export function parseChecks(p: Json): Check[] {
  const rows: string[] = Array.isArray(p.checks) ? p.checks : [];
  return rows.map((s) => {
    const [registry_id, check, due, outcome] = String(s).split("|");
    return { registry_id, check, due, outcome };
  });
}

export function ledgersBlock() {
  const rows = Object.keys(LEDGER_META).map(ledgerRow);
  const corr = LEDGER.corrections as Json[];
  const withdrawnStatus = corr.filter((c) => /^WITHDRAWN/i.test(String(c.status ?? ""))).map((c) => c.id as string);
  const checksAtom = (hChecks as Atom).payload;
  const checks = parseChecks(checksAtom);
  const wd = (hWithdrawals as Atom).payload;
  return {
    what_this_is:
      "Every public ledger the estate keeps, one authority per record type, each head read from the served bytes and committed as a leaf of the ONE daily signed public root.",
    rule: "Quote a ledger's count by field name from here. Counts are read from served bytes (kind probed) at read_at; a failed read is UNMEASURED, never a remembered number.",
    reader: READER,
    root_job: ROOT_JOB,
    root: {
      as_of: (publicRoot as Json).as_of ?? null,
      merkle_root: (publicRoot as Json).merkle_root ?? null,
      card_count: (publicRoot as Json).card_count ?? null,
      rekor: rekorStatus,
      ots: otsStatus,
      inclusion_record_root: inc?.merkle_root ?? null,
      note: "ONE root anchors every ledger head: Rekor and OTS witness the root bytes, the root's merkle tree commits to each head's leaf. An OTS stamp pending Bitcoin is a calendar fragment, not a Bitcoin proof.",
    },
    ledgers: rows,
    corrections_in_this_deploy: {
      count: corr.length,
      head_id: (corr[0]?.id as string) ?? null,
      note: "The corrections ledger this deploy serves. The ledgers[] row is the served bytes at read_at; a difference means entries landed after the last read and reach the root at the next daily run.",
    },
    withdrawals: {
      signed_mill_cards_withdrawn: wd.state === "PROBED" ? wd.entries ?? null : null,
      by_correction: wd.by_correction ?? null,
      admitted: 0,
      rule: "A withdrawn or quarantined record is never counted as an admitted measurement. Each withdrawal names the correction that withdrew it.",
      corrections_with_withdrawal_status: withdrawnStatus,
      withdrawn_pages: "Withdrawn pages answer 410 Gone from a Function (functions/_lib/withdrawn.ts); the sitemap keeps their history with the owner's withdrawal record.",
    },
    claim_maintenance: {
      scheduler: "ONE: scripts/claims/maintenance_due.py inside the daily claim-watch job (cron 50 7 * * *). The weekly 3090-pod loop (scripts/pod-loops/claim-watch-measure.sh) is retired.",
      schedule_rule: "For every LIVE registry in GET /api/claims/register: the read its own signed bytes name, and day 7, day 30 and day 90 after its created date. A passed date with no completed run reads DUE_NOT_RUN.",
      state: checksAtom.state,
      run_at: checksAtom.last_update ?? null,
      counts: checksAtom.outcomes ?? null,
      checks,
      outcomes_head_sha256: checksAtom.head_digest ?? null,
      failures_feed: "A CHANGED_CONFIRMED check writes a correction candidate (cand-<16 hex>-<run>-<claim>) for review; only a person promotes it into /api/corrections. A moved source is never an allegation.",
      source: checksAtom.served_url,
    },
    authorities: [
      { record_type: "a correction of our own published statement", authority: "GET /api/corrections",
        feeds: ["council-os/corrections-drafts (promoted)", "claim-maintenance candidates (promoted)", "corrections-watch reporting faults"],
        views: ["/corrections", "/feeds/corrections.atom", "/corrections.xml", "/api/pop/corrections"] },
      { record_type: "proof that a fix held", authority: "fix-receipt chain", joins_to: "corrections via corrections_ref.id or the ledger entry's draft_id" },
      { record_type: "a withdrawn signed card", authority: "WITHDRAWN.jsonl", joins_to: "corrections via each row's correction id" },
      { record_type: "claim state of a maintained subject", authority: "GET /api/claims/register" },
      { record_type: "whether a scheduled re-check ran", authority: "ledgers.claim_maintenance (executed schedule)",
        resolved: "GET /api/claims/register derives next_scheduled_read from the signed registries and can show a passed date as SCHEDULED; the executed schedule here is the authority for due, done and failed (C-2026-0929-07)." },
      { record_type: "another organisation's correction reaching its page", authority: "corrections-watch",
        resolved: "Not a correction of ours. Its rows never enter /api/corrections; only faults in its own reporting do." },
      { record_type: "the word 'claims register'", authority: "two registers, two record types",
        resolved: "claims_register (public/claims-register.json) holds OUR capability claims; claim-maintenance-register (GET /api/claims/register) holds claims OTHER organisations make about themselves. Never added, never substituted." },
    ],
    not_public: [
      { name: "Distribution-presence registry rows and contract fields", where: "the distribution-presence registry job host; its public view is the presence rollup above", count: null },
      { name: "SovSpace predictions and 3KB reaction records", where: "sandbox store; publication STAGED, never councilof.ai", count: null },
      { name: "outbound message log", where: "private; recipients are never published", count: null },
      { name: "deck-lang receipts", where: "lane stores; not served", count: null },
      { name: "consumer candidates", where: "lanes pod; a listing is never adoption", count: null },
      { name: "x402 door contract-parity runs", where: "evidence pages under /evidence/mcp-contract-parity/; not a ledger", count: null },
    ],
    verify: [
      { what: "the corrections ledger signature", command: "curl -s https://councilof.ai/api/corrections | jq '{signature_state, head: .corrections[0].id, n: (.corrections|length)}'" },
      { what: "a ledger head against its served bytes", command: "curl -sL <served_url> | shasum -a 256   # compare with ledgers[].bytes_sha256 (same read_at)" },
      { what: "the root that commits to the heads", command: "curl -s https://councilof.ai/root.json | jq '{as_of, card_count, merkle_root}'" },
      { what: "a head is a leaf of the root", command: "curl -s https://councilof.ai/root.json | jq --arg l <root_leaf_sha256> '.card_sha256 | index($l)'" },
      { what: "the claim-maintenance chain", command: "curl -sL https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/main/public/interop/claim-maintenance/README.md" },
    ],
  };
}
