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

import { verifyCard, anchorsFromDid, type Anchor, type CardVerdict } from "../../../functions/_lib/cardVerify";
import { readDenominator, denominatorSentence, type Denominator } from "../../../functions/_lib/denominator";

export interface RecordVerdict {
  lines: { label: string; ok: boolean | null; detail: string; code: string }[];
  /** True only when nothing failed. Drives the headline and the tally opt-in. */
  valid: boolean;
  family: string;
  /**
   * What the record's own n counts, and what it leaves out. A signature verdict said
   * nothing about the denominator, so a reader could confirm a card as genuine and still
   * walk away thinking `n: 235` meant 235 attempts when 237 were made and 2 were dropped.
   * null when the pasted record carries no n. Read from the pasted bytes, never fetched.
   */
  denominator: Denominator | null;
  /** The same thing in words, for the panel. null when there is nothing to say. */
  denominator_sentence: string | null;
}

async function loadAnchors(): Promise<Anchor[]> {
  try {
    const did = await (await fetch("/.well-known/did.json")).json();
    return anchorsFromDid(did);
  } catch {
    return [];
  }
}

export async function verifyRecord(raw: string): Promise<RecordVerdict> {
  let rec: unknown;
  try {
    rec = JSON.parse(raw);
  } catch {
    return {
      valid: false,
      family: "unknown",
      denominator: null,
      denominator_sentence: null,
      lines: [{ label: "Parse", ok: false, code: "parse_error", detail: "Not valid JSON — nothing was checked." }],
    };
  }

  const anchors = await loadAnchors();
  const verdict: CardVerdict = await verifyCard(rec, anchors);

  // The card's own body if it has one; a bare body pasted on its own also reads.
  const body = (rec && typeof rec === "object" && "body" in (rec as Record<string, unknown>)
    ? (rec as Record<string, unknown>).body
    : rec);
  const denominator = readDenominator(body);

  return {
    valid: verdict.valid,
    family: verdict.family,
    denominator: denominator.n === null ? null : denominator,
    denominator_sentence: denominatorSentence(denominator),
    lines: [
      { label: "Parse", ok: true, code: "parse_ok", detail: "Valid JSON." },
      ...verdict.checks.map((c) => ({ label: c.label, ok: c.ok, detail: c.detail, code: c.code })),
    ],
  };
}
