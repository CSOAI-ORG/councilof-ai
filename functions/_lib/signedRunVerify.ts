/**
 * signedRunVerify — the csoai.signed-run/0.1 family for POST /api/verify.
 *
 * WHY. Every signed evidence record the estate publishes (the censuses, the contract-parity and
 * cross-ledger records, the claim registries) is a csoai.signed-run/0.1 wrapper produced by
 * POST /api/board-sign. The record pages built by scripts/pubbus tell a reader to POST the
 * signed document to /api/verify, and until this module /api/verify answered UNCHECKABLE
 * ("unrecognised_family") to every one of them: a verify-it-yourself block pointing at a door
 * that could not read the thing it was pointed at.
 *
 * THE RULE is the signer's own: Ed25519 over canonical(payload), where canonical is
 * JSON.stringify of the recursively key-sorted value (functions/_lib/cardSign.ts canonicalBytes,
 * reproduced as cardVerify.jsCanonical). The key is PINNED (cardVerify.PINNED_ANCHORS); no
 * network fetch decides the verdict.
 *
 * WHAT IT DOES NOT CHECK: the record bytes. The signature pins them by payload.artifact.sha256;
 * this door returns that digest so the caller compares it with sha256 of the record they hold.
 */
import { PINNED_ANCHORS, jsCanonical, hexToBytes, sha256hex } from "./cardVerify";

export const SIGNED_RUN_SCHEMA = "csoai.signed-run/0.1";

export type SignedRunCheck = { check: string; ok: boolean | null; code: string; detail: string };
export type SignedRunVerdict = {
  family: "csoai.signed-run";
  state: "VALID" | "INVALID" | "UNCHECKABLE";
  reasons: string[];
  checks: SignedRunCheck[];
  did: string | null;
  payload_sha256: string | null;
  artifact: { path?: unknown; sha256?: unknown; schema?: unknown; as_of?: unknown } | null;
};

export function isSignedRun(x: unknown): boolean {
  return !!x && typeof x === "object" && (x as { schema?: unknown }).schema === SIGNED_RUN_SCHEMA;
}

export async function verifySignedRunDoc(doc: unknown): Promise<SignedRunVerdict> {
  const d = (doc ?? {}) as { payload?: Record<string, unknown>; signature?: Record<string, unknown> };
  const checks: SignedRunCheck[] = [];
  const s = d.signature ?? {};
  const did = typeof s.did === "string" ? s.did : null;
  const artifact = (d.payload && typeof d.payload.artifact === "object" ? d.payload.artifact : null) as SignedRunVerdict["artifact"];
  const out = (state: SignedRunVerdict["state"], reasons: string[], digest: string | null = null): SignedRunVerdict =>
    ({ family: "csoai.signed-run", state, reasons, checks, did, payload_sha256: digest, artifact });

  checks.push({ check: "Family", ok: true, code: "family", detail: "csoai.signed-run/0.1 — a signed evidence record from POST /api/board-sign." });
  if (!d.payload || typeof d.payload !== "object") {
    checks.push({ check: "Payload", ok: false, code: "payload_missing", detail: "no payload object to canonicalise" });
    return out("UNCHECKABLE", ["payload_missing"]);
  }
  const anchor = did ? PINNED_ANCHORS.find((a) => a.id === did) : undefined;
  if (!anchor) {
    checks.push({ check: "Key", ok: null, code: "key_not_pinned", detail: `signature.did ${did ?? "(absent)"} is not a key this verifier pins` });
    return out("UNCHECKABLE", ["key_not_pinned"]);
  }
  checks.push({ check: "Key", ok: true, code: "key_pinned", detail: `${did} (pinned ${anchor.hex.slice(0, 16)}…)` });
  const sigHex = typeof s.sig_ed25519 === "string" ? s.sig_ed25519 : "";
  if (!/^[0-9a-fA-F]{128}$/.test(sigHex)) {
    checks.push({ check: "Signature bytes", ok: false, code: "signature_malformed", detail: "sig_ed25519 is not 64 bytes of hex" });
    return out("INVALID", ["signature_malformed"]);
  }
  const bytes = new TextEncoder().encode(jsCanonical(d.payload));
  const digest = await sha256hex(bytes);
  const digestOk = digest === s.payload_sha256;
  checks.push({
    check: "Payload digest",
    ok: digestOk,
    code: digestOk ? "payload_digest_ok" : "payload_digest_mismatch",
    detail: digestOk ? `sha256(canonical payload) = ${digest}` : `sha256(canonical payload) = ${digest}, signature says ${String(s.payload_sha256)}`,
  });
  if (!digestOk) return out("INVALID", ["payload_digest_mismatch"], digest);
  let sigOk = false;
  try {
    const key = await crypto.subtle.importKey("raw", hexToBytes(anchor.hex) as unknown as BufferSource, { name: "Ed25519" }, false, ["verify"]);
    sigOk = await crypto.subtle.verify({ name: "Ed25519" }, key, hexToBytes(sigHex) as unknown as BufferSource, bytes as unknown as BufferSource);
  } catch (e) {
    checks.push({ check: "Signature", ok: null, code: "ed25519_unavailable", detail: `this runtime could not run Ed25519 (${(e as Error)?.message ?? "error"})` });
    return out("UNCHECKABLE", ["ed25519_unavailable"], digest);
  }
  checks.push({
    check: "Signature",
    ok: sigOk,
    code: sigOk ? "signature_ok" : "signature_invalid",
    detail: sigOk ? "Ed25519 verifies over the canonical payload under the pinned key" : "Ed25519 does not verify over the canonical payload",
  });
  if (!sigOk) return out("INVALID", ["signature_invalid"], digest);
  checks.push({
    check: "Record bytes",
    ok: null,
    code: "record_not_posted",
    detail: "Not checked here: compare sha256 of the record you hold with artifact.sha256 in this response.",
  });
  return out("VALID", [], digest);
}
