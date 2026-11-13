/**
 * Client-side estate record verification — used by /gspc-verify's "Verify a single record".
 *
 * This file used to hash "the whole envelope minus the signature" and then report the
 * inevitable failure as `no published key verifies this signature`. That was two bugs
 * compounding: the wrong preimage, and a preimage bug reported as a trust-anchor bug —
 * which sent readers hunting for a key that has been published all along as
 * did:web:csoai.org#card-attestation-1.
 *
 * Both are fixed by delegating to functions/_lib/cardVerify.ts, the single shared
 * implementation of the published rule, which the MCP `verify` tool uses too.
 *
 * TRUST ANCHOR (changed 2026-08-27): the deciding anchor set is PINNED in
 * cardVerify.ts's source, so a verdict needs no network — no key resolution at
 * check time. The live /.well-known/did.json fetch below is kept as a labelled
 * cross-check row only; when it fails, the verdict is unaffected and the
 * cross-check says so, instead of the old behavior where an unreachable did.json
 * left the signer effectively unchecked.
 */

import { verifyCard, anchorsFromDid, type Anchor, type CardState, type CardVerdict } from "../../../functions/_lib/cardVerify";
import { isCardV0, verifyCardV0 } from "../../../functions/_lib/cardV0Verify";

export interface RecordVerdict {
  lines: { label: string; ok: boolean | null; detail: string; code: string }[];
  /** True only when nothing failed. Drives the tally opt-in. */
  valid: boolean;
  /**
   * Three states, never two. The headline renders this, not `valid`, so a record
   * that could not be checked (bad JSON, unrecognised shape, unpinned key, no
   * Ed25519 here) shows UNCHECKABLE — never painted as INVALID.
   */
  state: CardState;
  /** Machine-readable reason codes behind the state. */
  reasons: string[];
  family: string;
}

export type RecordUseStatus = {
  state: "WITHDRAWN" | "NOT_ESTABLISHED" | "UNCHECKABLE" | "NOT_APPLICABLE";
  detail: string;
  reference?: string;
};

/** A signature check does not establish that a card was admitted or remains quotable. */
export async function lookupRecordUseStatus(raw: string): Promise<RecordUseStatus> {
  let record: any;
  try { record = JSON.parse(raw); } catch {
    return { state: "NOT_APPLICABLE", detail: "No parsed card to check." };
  }
  if (record?.did !== "did:web:csoai.org#board-attestation-1") {
    return { state: "NOT_APPLICABLE", detail: "Withdrawal lookup applies to board-signed cards." };
  }
  // A card-v0/v1 leaf (an art50 pack's card, a receipt, an archive card) carries no `id`: it is
  // named by its sha256. It used to read "Card id is missing" (UNCHECKABLE) under a VALID verdict,
  // on the very record a paid pack sends its buyer to check (paid-route lane, 7 Oct 2026). The
  // ledger is searched by that sha256 instead; absence is NOT_ESTABLISHED, as for any card.
  const leafId = isCardV0(record) && /^[0-9a-f]{64}$/i.test(record.sha256) ? record.sha256.toLowerCase() : null;
  if ((typeof record?.id !== "string" || !record.id) && !leafId) {
    return { state: "UNCHECKABLE", detail: "Card id is missing; use status cannot be checked." };
  }
  const recordId: string = typeof record?.id === "string" && record.id ? record.id : (leafId as string);
  const ledger = "/interop/mill-cards-signed/WITHDRAWN.jsonl";
  try {
    const response = await fetch(ledger, { headers: { accept: "application/jsonl" }, cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const rows = (await response.text()).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
    if (rows.some((row) => typeof row?.withdrawn_id !== "string")) throw new Error("Malformed withdrawal ledger");
    const match = rows.find((row) => row.withdrawn_id === recordId || (leafId !== null && row.signed_sha256 === leafId));
    if (!match) return {
      state: "NOT_ESTABLISHED",
      detail: "No withdrawal entry was found for this id. This check does not establish GSPC admission or quotability.",
      reference: ledger,
    };
    const currentCorrection = match.correction === "C-2026-0924-03";
    return {
      state: "WITHDRAWN",
      detail: currentCorrection
        ? "Signed bytes were served before admission. This card is unadmitted and withdrawn from quotable use; its signature may still be valid."
        : "This card is listed as withdrawn from quotable use; its signature may still be valid.",
      reference: currentCorrection ? "/corrections/mill16-unadmitted-2026-09-24.json" : ledger,
    };
  } catch {
    return {
      state: "UNCHECKABLE",
      detail: "The current withdrawal ledger could not be checked. A valid signature does not establish admission or quotability.",
      reference: ledger,
    };
  }
}

async function loadAnchors(): Promise<Anchor[]> {
  // This network read is an optional cross-check, not the deciding trust anchor.
  // Bound both the response and body wait so a stalled endpoint cannot strand the UI.
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<Anchor[]>((resolve) => {
    timer = setTimeout(() => { controller.abort(); resolve([]); }, 3000);
  });
  const read = async (): Promise<Anchor[]> => {
    try {
      const response = await fetch("/.well-known/did.json", { signal: controller.signal });
      if (!response.ok) return [];
      return anchorsFromDid(await response.json());
    } catch { return []; }
  };
  try { return await Promise.race([read(), deadline]); }
  finally { if (timer !== undefined) clearTimeout(timer); }
}

export async function verifyRecord(raw: string): Promise<RecordVerdict> {
  let rec: unknown;
  try {
    rec = JSON.parse(raw);
  } catch {
    // Unparsable input is UNCHECKABLE, not INVALID: nothing was checked, and
    // "not JSON" is not a finding that the record is forged.
    return {
      valid: false,
      state: "UNCHECKABLE",
      reasons: ["parse_error"],
      family: "unknown",
      lines: [{ label: "Parse", ok: false, code: "parse_error", detail: "Not valid JSON — nothing was checked." }],
    };
  }

  // card-v0 leaves (an art50 pack, a RAS receipt, a population-door or wrapper card) are judged by
  // the same module POST /api/verify uses. Until 2026-10-07 this page sent them to cardVerify, which
  // does not know the shape, so the record a paid pack told its buyer to check here came back
  // UNCHECKABLE/unrecognised_family. Pinned anchors decide; nothing is fetched.
  // A buyer often pastes the whole delivered pack ({ scope, card, law, … }); the signed record is its
  // `card`, so that is what is judged, and the page says so.
  const inner = !isCardV0(rec) && rec && typeof rec === "object" ? (rec as { card?: unknown }).card : undefined;
  const leaf = isCardV0(rec) ? rec : isCardV0(inner) ? inner : null;
  if (leaf) {
    const v = await verifyCardV0(leaf, raw);
    return {
      valid: v.state === "VALID",
      state: v.state,
      reasons: v.reasons,
      family: v.family,
      lines: [
        { label: "Parse", ok: true, code: "parse_ok", detail: leaf === rec ? "Valid JSON." : "Valid JSON: a delivered pack; its `card` is the signed record checked below." },
        ...v.checks.map((c) => ({ label: c.check, ok: c.ok, detail: c.detail, code: c.code })),
      ],
    };
  }

  const anchors = await loadAnchors();
  const verdict: CardVerdict = await verifyCard(rec, anchors);

  return {
    valid: verdict.valid,
    state: verdict.state,
    reasons: verdict.reasons,
    family: verdict.family,
    lines: [
      { label: "Parse", ok: true, code: "parse_ok", detail: "Valid JSON." },
      ...verdict.checks.map((c) => ({ label: c.label, ok: c.ok, detail: c.detail, code: c.code })),
    ],
  };
}
