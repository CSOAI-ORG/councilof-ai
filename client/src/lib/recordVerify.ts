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

export interface RecordVerdict {
  lines: { label: string; ok: boolean | null; detail: string; code: string }[];
  /** True only when nothing failed. Drives the headline and the tally opt-in. */
  valid: boolean;
  family: string;
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
      lines: [{ label: "Parse", ok: false, code: "parse_error", detail: "Not valid JSON — nothing was checked." }],
    };
  }

  const anchors = await loadAnchors();
  const verdict: CardVerdict = await verifyCard(rec, anchors);

  return {
    valid: verdict.valid,
    family: verdict.family,
    lines: [
      { label: "Parse", ok: true, code: "parse_ok", detail: "Valid JSON." },
      ...verdict.checks.map((c) => ({ label: c.label, ok: c.ok, detail: c.detail, code: c.code })),
    ],
  };
}
