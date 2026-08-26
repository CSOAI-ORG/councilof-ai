/**
 * Client-side chain verification — WebCrypto only.
 * The PASS label is "chain intact — tamper-evidence", NOT "verified authentic";
 * the FAIL label says the chain is broken. The label tracks the state — it is never
 * a constant with only a glyph flipping in front of it.
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

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface Ed25519Result {
  ok: boolean;
  supported: boolean;        // false ONLY if this browser lacks WebCrypto Ed25519
  sha256: string;            // sha256 of the exact signed bytes, recomputed here
  sha256_matches: boolean;   // vs the sidecar's stated body_sha256
  key_is_published: boolean; // sidecar key === the published trust anchor
  pubkey_b64: string;
  reason: string;
}

/**
 * Verify an Ed25519 signature over the EXACT bytes that were signed — no
 * re-canonicalization in the browser (Python's float/ASCII JSON repr is not
 * byte-reproducible in JS, and a mismatch there would show a FALSE "invalid").
 * The caller fetches the raw `.body` file (the signed bytes) and the sidecar
 * (sig + pubkey + expected sha256). We recompute sha256 locally, and verify the
 * signature with WebCrypto Ed25519 against the published public key.
 *
 * This authenticates BOTH: integrity (bytes unaltered) AND that the holder of
 * the published key signed them. It does NOT by itself prove the key belongs to
 * CSOAI — that is identity binding (a published key page / cert chain), a
 * separate claim the page must not overstate.
 */
export async function verifyEd25519Detached(
  body: ArrayBuffer,
  sigB64: string,
  pubkeyB64: string,
  expectedSha256?: string,
  publishedPubkeyB64?: string,
): Promise<Ed25519Result> {
  const bodyBytes = new Uint8Array(body);
  const sha = bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", bodyBytes)));
  const sha256_matches = expectedSha256 ? sha === expectedSha256 : true;

  // Pin to the PUBLISHED trust anchor. The sidecar declares its own pubkey, which
  // is attacker-controllable; a swapped keypair would otherwise verify green while
  // the page still shows the real published key. So the sidecar key MUST equal the
  // published key, or this is an untrusted signer regardless of signature validity.
  const key_is_published = !publishedPubkeyB64 || pubkeyB64 === publishedPubkeyB64;

  const base = {
    sha256: sha,
    sha256_matches,
    key_is_published,
    pubkey_b64: pubkeyB64,
  };

  // Browser-INDEPENDENT invalidators first. A key that is not the published
  // anchor, or bytes that do not match the stated hash, are INVALID regardless
  // of whether this browser supports Ed25519 — both are plain comparisons that
  // never touch WebCrypto. Returning them as supported:true, ok:false keeps a
  // swapped key or tampered body RED, not the amber "can't check here" state
  // (which would let tampering masquerade as a browser gap).
  if (!key_is_published) {
    return { ...base, supported: true, ok: false,
      reason: "Signed by a key that is NOT the published trust anchor — untrusted signer." };
  }
  if (!sha256_matches) {
    return { ...base, supported: true, ok: false,
      reason: "The signed bytes do not match the stated hash — artifact altered." };
  }

  // Only now does WebCrypto matter. Distinguish a genuine browser gap (Ed25519
  // unavailable) from malformed input — the latter is INVALID, never amber.
  const keyToUse = publishedPubkeyB64 || pubkeyB64;
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey("raw", b64ToBytes(keyToUse), { name: "Ed25519" }, false, ["verify"]);
  } catch (e) {
    const name = (e as { name?: string }).name || "";
    if (name === "NotSupportedError") {
      return {
        ...base,
        supported: false,
        ok: false,
        reason:
          "This browser's WebCrypto lacks Ed25519, so the signature can't be checked here. " +
          "The sha256 above is still recomputed locally; verify offline with `python3 sign.py --verify`.",
      };
    }
    // Malformed key bytes — not a browser limitation. This is a failure, not unsupported.
    return { ...base, supported: true, ok: false, reason: "The public key is malformed — cannot verify." };
  }

  let sig_ok = false;
  try {
    sig_ok = await crypto.subtle.verify("Ed25519", key, b64ToBytes(sigB64), bodyBytes);
  } catch {
    // Malformed signature bytes → the signature does not verify. Invalid, not unsupported.
    sig_ok = false;
  }

  // key_is_published and sha256_matches are guaranteed true here (both short-circuit
  // above), so the only remaining question is whether the signature itself verifies.
  return {
    ...base,
    supported: true,
    ok: sig_ok,
    reason: sig_ok
      ? "Signature valid over the exact signed bytes by the published key; content is unaltered."
      : "Signature does NOT verify — altered, or signed by a different key.",
  };
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
  const broken = lines.filter((l) => !l.body_hash_ok);
  return {
    ok,
    sig_alg,
    // The label MUST state the outcome. It used to be the constant string
    // "chain intact — tamper-evidence" with only the ✓/✗ glyph flipping, so the
    // FAILURE state of a tamper detector read "chain intact", in green, on the page
    // whose entire pitch is that a broken row is "reported as BROKEN, visibly".
    label: ok
      ? "chain intact — tamper-evidence"
      : `CHAIN BROKEN — ${broken.length} record${broken.length === 1 ? "" : "s"} altered after signing`,
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
