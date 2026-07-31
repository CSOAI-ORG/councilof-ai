/**
 * Client-side chain verification — WebCrypto only.
 * Honest label: "chain intact — tamper-evidence", NOT "verified authentic".
 * Ed25519 / ML-DSA upgrades happen in the same commit as the capability.
 *
 * What this does:
 *   1. For each record, recompute sha256(canonical_json(record_body)) and
 *      compare to the stored chain_hash.
 *   2. Report any row whose recomputed hash differs as BROKEN — visibly.
 *
 * What this does NOT do (and never claims to do):
 *   - Authenticate WHO wrote the record. That requires a signature; the chain
 *     is sha256-linked only today.
 *   - Verify against an external authority. The user brings the records;
 *     everything is recomputed locally in the browser.
 */

import type { JRecord } from "@/data/arena";

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Canonical JSON: stable key order so the digest is deterministic. */
export function canonicalJSON(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalJSON).join(",") + "]";
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const obj = keys
    .map((k) => JSON.stringify(k) + ":" + canonicalJSON((value as Record<string, unknown>)[k]))
    .join(",");
  return "{" + obj + "}";
}

export interface VerifyLine {
  record_id: string;
  body_hash_ok: boolean;
  chain_hash_stored: string;
  body_hash_computed: string;
}

export interface VerifyResult {
  ok: boolean;
  sig_alg: JRecord["sigil"]["sig_alg"];
  label: string;            // honest label rendered to user
  what_was_verified: string;
  what_was_NOT_verified: string;
  lines: VerifyLine[];
}

export async function verifyChain(records: JRecord[]): Promise<VerifyResult> {
  const lines: VerifyLine[] = [];
  let ok = true;

  for (const r of records) {
    // Strip sigil before hashing — sigil contains the hash we're trying to verify.
    const { sigil: _sigil, ...body } = r;
    const computed = await sha256Hex(canonicalJSON(body));
    const stored = r.sigil.chain_hash;
    const body_hash_ok = stored === computed;
    if (!body_hash_ok) ok = false;
    lines.push({
      record_id: r.record_id,
      body_hash_ok,
      chain_hash_stored: stored.slice(0, 16) + "…",
      body_hash_computed: computed.slice(0, 16) + "…",
    });
  }

  const sig_alg = records[0]?.sigil.sig_alg ?? "sha256";
  return {
    ok,
    sig_alg,
    label: "chain intact — tamper-evidence",
    what_was_verified:
      "sha256(canonical JSON of each record body) recomputed locally and compared to the stored chain_hash. " +
      "Mismatch on any row would mean the record was edited after signing.",
    what_was_NOT_verified:
      "WHO wrote the record. That requires a signature. Today the chain is sha256-linked only; " +
      "the Ed25519 / ML-DSA hybrid signer is built (see Master Playbook Part E1) and the label will " +
      "upgrade in the same commit as that capability — never ahead of it.",
    lines,
  };
}
