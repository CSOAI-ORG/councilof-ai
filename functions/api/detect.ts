/**
 * POST /api/detect — free Article 50 provenance VERIFICATION (EU AI Act 50(2)).
 * GET  /api/detect  — service descriptor.
 *
 * HONESTY OVER APPEARANCE (same discipline as article50.ts / assess/key.ts)
 * `article50.ts` *issues* a passport but trusts a `watermarked` boolean on input.
 * This endpoint *verifies* a supplied C2PA-style signed manifest cryptographically:
 * it recomputes the canonical JSON (recursively sorted keys, no whitespace — the
 * same rule cross.ts/assess use) of `manifest.claim`, checks the Ed25519 signature,
 * and reads the IPTC/schema.org `digitalSourceType` mark. So the passport's
 * `watermarked`/`source_type` can be PROVEN, not claimed.
 *
 * We verify only the signed-METADATA layer. The imperceptible-watermark layer we
 * cannot see is DECLARED (`watermark_layer: "not_checked"`), never claimed — the
 * free detection endpoint the Code of Practice guarantees to the public, media,
 * fact-checkers, researchers, and authorities.
 *
 * The verdict receipt is Ed25519-signed IFF a board key is bound to this
 * deployment; otherwise it is returned UNSIGNED with an honest note (never faked).
 * Ported from the .github reference harness (harness/detect.py, c2pa.py). Finding
 * codes are stable across CLI (ClaimGuard) / API / this Function.
 */

import { DETECTION_PREDICATE, toDsse, toInTotoStatement } from "./intoto";

interface Env {
  BOARD_ATTESTATION_KEY_PKCS8_B64?: string;
  ASSESS_SIGNING_KEY_PKCS8_B64?: string;
}

const AI_SOURCE_TOKENS = [
  "trainedalgorithmicmedia",
  "compositewithtrainedalgorithmicmedia",
  "algorithmicmedia",
];
const NON_AI_TOKENS = ["digitalcapture", "humanedits", "minorhumanedits", "compositecapture"];

type Finding = { status: "PASS" | "FAIL" | "WARN"; code: string; message: string };

/* Integrity is not identity.
 *
 * `manifest.signature.public_key_x` is carried BY THE MANIFEST. Verifying against it
 * proves only that whoever holds that key signed these bytes — it says nothing about
 * WHO that is. Until 2026-09-04 this endpoint returned PASS/c2pa.signature_valid and
 * metadata_layer:"verified" for a self-embedded key, and echoed the manifest's own
 * `signer` string unresolved. A forged manifest claiming did:web:bbc.co.uk verified
 * clean, and the result was then wrapped in a DSSE receipt signed with the real board
 * key — laundering the forgery through our own signature into a portable envelope.
 *
 * Now: integrity and identity are reported separately, and identity is never asserted
 * without a resolved trust anchor. We deliberately do NOT resolve did:web here — that
 * would make an anonymous POST drive an outbound fetch to an attacker-chosen host.
 * The caller anchors; we report honestly. Mirrors the UNCHECKABLE rule in
 * gspc-card-verifier and CSOAI-ORG/a2a-signed-receipts. */

/** Canonical JSON: recursively sorted keys, no whitespace (byte-identical to RFC 8785
 *  for the ASCII/number payloads used across the estate — see .github canonical.py). */
function canon(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  const o = v as Record<string, unknown>;
  return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + canon(o[k])).join(",") + "}";
}

function b64urlToBytes(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
function hexToBytes(h: string): Uint8Array {
  const clean = h.trim().toLowerCase();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}
function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function collectSourceTypes(claim: Record<string, unknown>): string[] {
  const out: string[] = [];
  const assertions = Array.isArray(claim.assertions) ? claim.assertions : [];
  for (const a of assertions) {
    const data = (a as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
    for (const k of ["digitalSourceType", "digital_source_type", "sourceType"]) {
      const val = data?.[k];
      if (typeof val === "string") out.push(val);
    }
  }
  for (const k of ["digitalSourceType", "digital_source_type"]) {
    const val = claim[k];
    if (typeof val === "string") out.push(val);
  }
  return out;
}

async function verifyManifest(manifest: Record<string, unknown>): Promise<{
  findings: Finding[]; isAiMarked: boolean; sourceType: string | null; signer: string | null;
  metadataVerified: boolean; integrityHeld: boolean;
}> {
  const findings: Finding[] = [];
  const claim = manifest.claim as Record<string, unknown> | undefined;
  const sig = manifest.signature as Record<string, unknown> | undefined;
  const metadataVerified = false;   // identity: never established without a resolved anchor
  let integrityHeld = false;        // bytes: signature holds against the embedded key
  let signer: string | null = null;

  if (!claim || typeof claim !== "object") {
    findings.push({ status: "FAIL", code: "c2pa.no_claim", message: "manifest.claim missing" });
  } else if (!sig || typeof sig.sig !== "string" || typeof sig.public_key_x !== "string") {
    findings.push({ status: "FAIL", code: "c2pa.no_signature", message: "manifest.signature.{sig,public_key_x} missing" });
  } else {
    signer = typeof sig.signer === "string" ? sig.signer : null;
    try {
      const pk = await crypto.subtle.importKey("raw", b64urlToBytes(sig.public_key_x), { name: "Ed25519" }, false, ["verify"]);
      const ok = await crypto.subtle.verify("Ed25519", pk, hexToBytes(sig.sig), new TextEncoder().encode(canon(claim)));
      if (ok) {
        integrityHeld = true;
        findings.push({
          status: "WARN",
          code: "c2pa.signature_unanchored",
          message:
            `integrity holds against the key embedded in the manifest, but signer ` +
            `${signer ?? "(unnamed)"} was not resolved — identity is NOT established. ` +
            `A self-embedded key never establishes identity. Resolve the signer against ` +
            `a trust anchor you already hold before relying on this attribution.`,
        });
      } else {
        findings.push({ status: "FAIL", code: "c2pa.signature_invalid", message: "Ed25519 verify failed over canonical claim — these bytes do not match this signature" });
      }
    } catch (e) {
      // A malformed key or hex string is UNCHECKABLE, not a forgery. Do not conflate them.
      findings.push({ status: "WARN", code: "c2pa.signature_uncheckable", message: `could not evaluate the signature: ${(e as Error).message}` });
    }
  }

  let isAiMarked = false;
  let sourceType: string | null = null;
  const types = claim ? collectSourceTypes(claim) : [];
  if (!types.length) {
    findings.push({ status: "FAIL", code: "c2pa.no_source_type", message: "no digitalSourceType (Article 50 marking absent)" });
  } else {
    const aiMatch = types.find((t) => AI_SOURCE_TOKENS.some((tok) => t.toLowerCase().includes(tok)));
    if (aiMatch) {
      isAiMarked = true; sourceType = aiMatch;
      findings.push({ status: "PASS", code: "c2pa.ai_source_marked", message: `digitalSourceType=${aiMatch}` });
    } else {
      sourceType = types.find((t) => NON_AI_TOKENS.some((tok) => t.toLowerCase().includes(tok))) ?? types[0];
      findings.push({ status: "WARN", code: "c2pa.non_ai_source", message: `digitalSourceType=${sourceType} is not an AI-generation mark` });
    }
  }
  if (claim && !claim.timestamp) findings.push({ status: "WARN", code: "c2pa.no_timestamp", message: "claim.timestamp missing" });
  return { findings, isAiMarked, sourceType, signer, metadataVerified, integrityHeld };
}

async function signVerdict(env: Env, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const b64 = env.BOARD_ATTESTATION_KEY_PKCS8_B64 || env.ASSESS_SIGNING_KEY_PKCS8_B64;
  if (!b64) {
    return { unsigned: true, note: "no board key bound to this deployment — verdict returned UNSIGNED (honest gap, not a faked receipt)" };
  }
  try {
    const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
    const sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(canon(payload))));
    const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
    return {
      alg: "Ed25519",
      signer: "did:web:csoai.org#board-attestation-1",
      sig,
      public_key_x: jwk.x,
      sig_input: "canonical JSON (recursively sorted keys, no whitespace) of the verdict payload",
      verify: "fetch /.well-known/did.json → #board-attestation-1 → recompute canonical JSON and verify Ed25519",
    };
  } catch {
    return { error: "board key present but unusable — operations must fix; no signature emitted" };
  }
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ ok: false, error: "body must be JSON with a `manifest` object" }, { status: 400 });
  }
  const manifest = body.manifest as Record<string, unknown> | undefined;
  if (!manifest || typeof manifest !== "object") {
    return Response.json({ ok: false, error: "`manifest` (object) required — a C2PA-style signed manifest" }, { status: 400 });
  }

  const { findings, isAiMarked, sourceType, signer, metadataVerified, integrityHeld } = await verifyManifest(manifest);

  let verdict: "AI_MARKED" | "NOT_AI_MARKED" | "UNVERIFIABLE";
  if (!metadataVerified) verdict = "UNVERIFIABLE";
  else if (isAiMarked) verdict = "AI_MARKED";
  else verdict = "NOT_AI_MARKED";

  // Optional hard-binding to asset bytes.
  const assetHash = typeof body.asset_hash === "string" ? body.asset_hash : null;
  if (assetHash) {
    const claimHash = (manifest.claim as Record<string, unknown> | undefined)?.asset as Record<string, unknown> | undefined;
    if (claimHash?.hash !== assetHash) {
      verdict = "UNVERIFIABLE";
      findings.push({ status: "FAIL", code: "detect.asset_mismatch", message: `asset_hash != manifest ${String(claimHash?.hash)}` });
    }
  }

  const payload = {
    schema: "csoai.article50-detection/1",
    verdict,
    source_type: sourceType,
    manifest_signer: signer,
    manifest_signer_resolved: false,
    manifest_signer_note: signer
      ? "self-asserted by the manifest and NOT resolved here — do not treat as attribution"
      : null,
    detected: {
      metadata_layer: metadataVerified ? "verified" : integrityHeld ? "integrity_only" : "unverified",
      watermark_layer: "not_checked",
    },
    findings,
    issued_at: new Date().toISOString(),
    issuer: "CSOAI Ltd (UK 16939677)",
  };
  const receipt = await signVerdict(ctx.env, payload);

  // Also emit the standard in-toto/DSSE receipt (ecosystem-verifiable) when a key
  // is bound — same envelope auditors/`cosign`-style tools read.
  let receiptDsse: Record<string, unknown> | null = null;
  const keyB64 = ctx.env.BOARD_ATTESTATION_KEY_PKCS8_B64 || ctx.env.ASSESS_SIGNING_KEY_PKCS8_B64;
  if (keyB64) {
    try {
      const der = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
      const stmt = await toInTotoStatement(payload, {
        subjectName: "ai-content-detection",
        predicateType: DETECTION_PREDICATE,
      });
      receiptDsse = await toDsse(stmt, der, "did:web:csoai.org#board-attestation-1");
    } catch {
      receiptDsse = null;
    }
  }

  return Response.json({ ok: verdict !== "UNVERIFIABLE", ...payload, receipt, receipt_dsse: receiptDsse });
};

export const onRequestGet: PagesFunction<Env> = async () =>
  Response.json({
    service: "article50-detection",
    article: "EU AI Act Article 50(2)",
    post_to_verify: "POST { manifest: <C2PA-style signed manifest>, asset_hash?: string }",
    verifies: { metadata_layer: "Ed25519 over canonical claim", watermark_layer: "declared, not checked" },
    access: "free for all; unrestricted for authorities, media, fact-checkers, researchers, civil society",
    complements: "/api/article50 (issues a passport) — this proves the mark that endpoint otherwise trusts",
  });
