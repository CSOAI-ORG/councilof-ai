/**
 * cardVerify — the ONE implementation of "is this published CSOAI card genuine?".
 *
 * Shared verbatim by the browser verifier (/gspc-verify → RecordVerifyForm) and the
 * MCP `verify` tool (/mcp). Both surfaces previously carried their own wrong guess at
 * the preimage and both rejected the estate's own cards; there is now one rule here.
 *
 * Pure module. No imports, no DOM, no Node. Uses only WebCrypto (`crypto.subtle`),
 * which exists in browsers and in Cloudflare Workers.
 *
 * WHY THIS FILE LIVES UNDER functions/: `npm run build:client` copies functions/ into
 * dist/client/functions wholesale, so a Pages Function may only import from inside
 * functions/. The client imports it by relative path and Vite inlines it at build time.
 *
 * ---------------------------------------------------------------------------------
 * THE PUBLISHED RULE (public/signed/HOW-TO-VERIFY.md — do not diverge from it)
 *
 *   gspc.measurement-card
 *     preimage  = json.dumps(body, sort_keys=True, separators=(',',':'),
 *                            ensure_ascii=True).encode('utf-8')
 *     id        = sha256(preimage).hexdigest()
 *     signature = Ed25519(preimage) under did:web:csoai.org#card-attestation-1
 *
 *   csoai.east-west-card/1, csoai.axis-signal/0.1 and the other /signals cards
 *     preimage   = json.dumps(card minus {content_id, signature}, sort_keys=True,
 *                             separators=(',',':'), ensure_ascii=True)
 *     content_id = sha256(preimage).hexdigest()
 *     signature  = Ed25519 over the ASCII HEX OF content_id (not over the preimage)
 *
 * THREE FAILURE MODES, THREE DISTINCT VERDICTS. Reporting a preimage mismatch as a
 * missing trust anchor is what sent the outside auditor hunting for a key that was
 * published all along, so they are never collapsed:
 *   preimage_mismatch  — the bytes do not hash to the id the card declares
 *   signature_invalid  — the signature does not verify over those bytes
 *   untrusted_signer   — it verifies, but not under a key published in did.json
 */

/** The one key that anchors gspc.measurement-card. Published at did:web:csoai.org. */
export const CARD_ATTESTATION_KID = "did:web:csoai.org#card-attestation-1";
export const CARD_ATTESTATION_HEX =
  "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38";

/* ------------------------------------------------------------------ canonical */

/**
 * Fields that CPython held as FLOATS when the preimage was produced. JavaScript
 * cannot tell 0 from 0.0 at runtime — both are the same IEEE-754 double — so the
 * schema has to say which fields are floats. This is the whole of D4: measured
 * 2026-08-26, 116 of the 313 card files under public/signed/cards/ carry an integral
 * declared-float, and a verifier that renders it `0` instead of `0.0` reports a false
 * failure on 37% of a corpus that is fine. (Recount, do not trust this number:
 *   python3 -c "import json,glob; print(sum(any(isinstance(v,float) and v==int(v) for k,v in json.load(open(f))['body'].items() if k=='accuracy' or k.endswith('_ci_low') or k.endswith('_ci_high')) for f in glob.glob('public/signed/cards/*.json')))")
 *
 * HOW-TO-VERIFY.md §3 names exactly this set: `accuracy`, and any `_ci_low`/`_ci_high`.
 */
export type FloatFieldTest = (key: string) => boolean;

export const GSPC_FLOAT_FIELDS: FloatFieldTest = (k) =>
  k === "accuracy" || k.endsWith("_ci_low") || k.endsWith("_ci_high");

/** No field is a declared float — integers render as integers. */
export const NO_FLOAT_FIELDS: FloatFieldTest = () => false;

/**
 * Escape a string the way CPython `json.dumps(..., ensure_ascii=True)` does.
 * JSON.stringify already agrees on quoting, backslashes and control characters;
 * the sole divergence is non-ASCII, which ensure_ascii=True emits as \uXXXX
 * (lowercase, UTF-16 code units, so astral characters become a surrogate pair —
 * which is exactly what charCodeAt gives us).
 */
function pyString(s: string): string {
  return JSON.stringify(s).replace(/[\u0080-\uffff]/g, (c) =>
    "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"),
  );
}

/** Render a number the way CPython `repr()` does, given whether it is a float. */
function pyNumber(v: number, isFloat: boolean): string {
  if (!Number.isFinite(v)) {
    // CPython emits Infinity/NaN; JSON.stringify emits null. Rather than silently
    // produce different bytes, refuse — no published card contains one.
    throw new Error("non-finite number in preimage");
  }
  if (isFloat && Number.isInteger(v)) return v.toFixed(1);
  return JSON.stringify(v);
}

/** Sort by Unicode code point (CPython's order), not by UTF-16 code unit (JS default). */
function byCodePoint(a: string, b: string): number {
  const ca = [...a];
  const cb = [...b];
  for (let i = 0; i < Math.min(ca.length, cb.length); i++) {
    const d = (ca[i].codePointAt(0) as number) - (cb[i].codePointAt(0) as number);
    if (d !== 0) return d;
  }
  return ca.length - cb.length;
}

/**
 * CPython-compatible canonical JSON:
 * `json.dumps(v, sort_keys=True, separators=(',',':'), ensure_ascii=True)`.
 *
 * Known limit, stated rather than hidden: numbers of very large or very small
 * magnitude switch to exponent notation at different thresholds in CPython and
 * ECMAScript (repr(1e16) == '1e+16' vs '10000000000000000'). No published card
 * contains one, and the id check below catches it loudly if one ever does.
 */
export function pyCanonical(v: unknown, isFloatField: FloatFieldTest = NO_FLOAT_FIELDS): string {
  if (v === null) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return pyNumber(v, false);
  if (typeof v === "string") return pyString(v);
  if (Array.isArray(v)) return "[" + v.map((x) => pyCanonical(x, isFloatField)).join(",") + "]";
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return (
      "{" +
      Object.keys(o)
        .sort(byCodePoint)
        .map((k) => {
          const val = o[k];
          const rendered =
            typeof val === "number" ? pyNumber(val, isFloatField(k)) : pyCanonical(val, isFloatField);
          return pyString(k) + ":" + rendered;
        })
        .join(",") +
      "}"
    );
  }
  throw new Error("value is not JSON");
}

/* ---------------------------------------------------------------------- bytes */

export function hexToBytes(s: string): Uint8Array {
  return Uint8Array.from(s.match(/.{2}/g) ?? [], (h) => parseInt(h, 16));
}

export function bytesToHex(b: Uint8Array): string {
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function b64ToBytes(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function bytesToB64(b: Uint8Array): string {
  return btoa(String.fromCharCode(...b));
}

export async function sha256hex(bytes: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", bytes as unknown as BufferSource);
  return bytesToHex(new Uint8Array(d));
}

const utf8 = (s: string) => new TextEncoder().encode(s);

/** Decode a signature that may be hex or base64/base64url. */
function decodeSig(sig: string): Uint8Array | null {
  try {
    if (/^[0-9a-fA-F]+$/.test(sig) && sig.length % 2 === 0) return hexToBytes(sig);
    return b64ToBytes(sig);
  } catch {
    return null;
  }
}

/** Decode a public key that may be hex or base64/base64url. */
function decodeKey(k: string): Uint8Array | null {
  try {
    if (/^[0-9a-fA-F]{64}$/.test(k)) return hexToBytes(k);
    return b64ToBytes(k);
  } catch {
    return null;
  }
}

export class Ed25519Unsupported extends Error {}

/** Verify Ed25519 with WebCrypto. Throws Ed25519Unsupported ONLY on a browser gap. */
async function ed25519Verify(
  pubkey: Uint8Array,
  sig: Uint8Array,
  msg: Uint8Array,
): Promise<boolean> {
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "raw",
      pubkey as unknown as BufferSource,
      { name: "Ed25519" },
      false,
      ["verify"],
    );
  } catch (e) {
    if ((e as { name?: string })?.name === "NotSupportedError") {
      throw new Ed25519Unsupported("this runtime's WebCrypto lacks Ed25519");
    }
    return false; // malformed key bytes — a failure, not a capability gap
  }
  try {
    return await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      sig as unknown as BufferSource,
      msg as unknown as BufferSource,
    );
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------- verdict */

export type CheckOk = boolean | null; // null = not applicable to this family

export interface CardCheck {
  label: string;
  ok: CheckOk;
  detail: string;
  /** Machine-readable code, stable across wording changes. */
  code: string;
}

export interface CardVerdict {
  /** Machine-readable family id, or "unknown". */
  family: string;
  /** Human label for the family. */
  family_label: string;
  valid: boolean;
  /** Stable failure codes — never collapse a preimage bug into a key-anchor bug. */
  reasons: string[];
  checks: CardCheck[];
  /** The declared id/content_id, if any. */
  id: string | null;
}

/** A trust anchor as published in a DID document. */
export interface Anchor {
  id: string;
  hex: string;
}

/** Pull the Ed25519 verification methods out of a did:web document. */
export function anchorsFromDid(did: unknown): Anchor[] {
  const methods =
    (did as { verificationMethod?: { id: string; publicKeyJwk?: { x?: string }; publicKeyHex?: string }[] })
      ?.verificationMethod ?? [];
  const out: Anchor[] = [];
  for (const m of methods) {
    try {
      if (m.publicKeyHex) out.push({ id: m.id, hex: m.publicKeyHex.toLowerCase() });
      else if (m.publicKeyJwk?.x) out.push({ id: m.id, hex: bytesToHex(b64ToBytes(m.publicKeyJwk.x)) });
    } catch {
      /* a malformed method is not a reason to drop the rest */
    }
  }
  return out;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export type Family =
  | "gspc.measurement-card"
  | "csoai.content-id-card"
  | "csoai.estate-envelope"
  | "unknown";

/**
 * Classify a pasted object into one of the families CSOAI actually publishes.
 * The old MCP tool answered "unrecognized card family" to every one of them.
 */
export function detectFamily(rec: unknown): Family {
  if (!isObj(rec)) return "unknown";
  if (
    isObj(rec.body) &&
    typeof rec.id === "string" &&
    typeof rec.signature === "string" &&
    typeof rec.pubkey === "string"
  ) {
    return "gspc.measurement-card";
  }
  if (typeof rec.content_id === "string" && isObj(rec.signature)) return "csoai.content-id-card";
  if (typeof rec.content_id === "string") return "csoai.estate-envelope";
  return "unknown";
}

const FAMILY_LABEL: Record<Family, string> = {
  // A family label names a SHAPE. It used to carry "(the 150 signed board cards)" — a typed
  // census inside a type name, shown on /gspc-verify and returned as `family_label` by the MCP
  // verify tool. public/signed/cards/ holds 313 card files and the packaged verifier reports
  // VALID 313 · INVALID 0 · UNCHECKABLE 0 over them, so the label contradicted the bytes it
  // was describing. Counts belong in /api/state (signed_cards.count), which derives them.
  "gspc.measurement-card": "gspc.measurement-card (top-level id + body + pubkey + signature)",
  "csoai.content-id-card": "content_id card (cross-border / axis-signal family)",
  "csoai.estate-envelope": "estate envelope (content_id, unsigned or flat signature)",
  unknown: "unrecognised",
};

/**
 * Verify one card. `anchors` are the trust anchors published in did.json; pass an
 * empty array and the anchor check reports "could not be checked" rather than
 * silently claiming the signer is untrusted.
 */
export async function verifyCard(rec: unknown, anchors: Anchor[]): Promise<CardVerdict> {
  const family = detectFamily(rec);
  const checks: CardCheck[] = [];
  const reasons: string[] = [];
  const fail = (code: string) => { if (!reasons.includes(code)) reasons.push(code); };

  if (family === "unknown") {
    checks.push({
      label: "Card family",
      ok: false,
      code: "unrecognised_family",
      detail:
        "Not a shape CSOAI publishes. Expected either a gspc.measurement-card " +
        "(top-level id + body + pubkey + signature) or a content_id card " +
        "(top-level content_id + signature).",
    });
    return { family, family_label: FAMILY_LABEL[family], valid: false, reasons: ["unrecognised_family"], checks, id: null };
  }

  const r = rec as Record<string, unknown>;
  checks.push({
    label: "Card family",
    ok: true,
    code: "family",
    detail: `${family} — ${FAMILY_LABEL[family]}.`,
  });

  /* ---- work out the signed bytes and the declared id, per family ---- */
  let preimage: Uint8Array;
  let declaredId: string;
  let sigOver: Uint8Array; // the bytes the SIGNATURE covers (not always the preimage)
  let sigRaw: string | null;
  let keyRaw: string | null;
  let idLabel: string;

  try {
    if (family === "gspc.measurement-card") {
      idLabel = "id";
      declaredId = r.id as string;
      preimage = utf8(pyCanonical(r.body, GSPC_FLOAT_FIELDS));
      sigOver = preimage; // Ed25519 over the preimage bytes themselves
      sigRaw = r.signature as string;
      keyRaw = r.pubkey as string;
    } else {
      idLabel = "content_id";
      declaredId = r.content_id as string;
      const body: Record<string, unknown> = {};
      for (const k of Object.keys(r)) if (k !== "content_id" && k !== "signature") body[k] = r[k];
      preimage = utf8(pyCanonical(body, NO_FLOAT_FIELDS));
      // This family signs the ASCII hex of content_id, not the preimage.
      sigOver = utf8(declaredId);
      const s = r.signature;
      if (isObj(s)) {
        sigRaw = typeof s.sig === "string" ? s.sig : typeof s.signature === "string" ? s.signature : null;
        keyRaw = typeof s.pubkey === "string" ? s.pubkey : null;
      } else {
        sigRaw = typeof s === "string" ? s : null;
        keyRaw = typeof r.pubkey === "string" ? r.pubkey : null;
      }
    }
  } catch (e) {
    checks.push({
      label: "Preimage",
      ok: false,
      code: "preimage_uncomputable",
      detail: `The signed bytes could not be reconstructed: ${(e as Error).message}.`,
    });
    return { family, family_label: FAMILY_LABEL[family], valid: false, reasons: ["preimage_uncomputable"], checks, id: null };
  }

  /* ---- 1. does the body hash to the id it declares? ---- */
  const computed = await sha256hex(preimage);
  const idOk = computed === declaredId;
  if (!idOk) fail("preimage_mismatch");
  checks.push({
    label: idLabel,
    ok: idOk,
    code: idOk ? "id_match" : "preimage_mismatch",
    detail: idOk
      ? `sha256 of the canonical body reproduces ${declaredId.slice(0, 16)}…`
      : `MISMATCH — the card declares ${declaredId.slice(0, 16)}… but its body hashes to ` +
        `${computed.slice(0, 16)}…. The body was altered, or it was serialised by a different rule. ` +
        `This says nothing about which key signed it.`,
  });

  /* ---- 2. is the signer a key published in did.json? ---- */
  const keyBytes = keyRaw ? decodeKey(keyRaw) : null;
  const keyHex = keyBytes ? bytesToHex(keyBytes) : null;
  if (!keyHex) {
    checks.push({
      label: "Signing key",
      ok: false,
      code: "key_malformed",
      detail: "The card carries no readable public key.",
    });
    fail("key_malformed");
  } else if (anchors.length === 0) {
    checks.push({
      label: "Trust anchor",
      ok: null,
      code: "anchor_unavailable",
      detail: "did.json could not be fetched, so the signer could not be checked against a published anchor.",
    });
  } else {
    const hit = anchors.find((a) => a.hex === keyHex);
    if (hit) {
      checks.push({
        label: "Trust anchor",
        ok: true,
        code: "anchor_match",
        detail: `${keyHex.slice(0, 8)}… is published as ${hit.id}.`,
      });
      if (family === "gspc.measurement-card" && keyHex !== CARD_ATTESTATION_HEX) {
        fail("wrong_anchor_for_family");
        checks.push({
          label: "Expected anchor",
          ok: false,
          code: "wrong_anchor_for_family",
          detail: `A gspc.measurement-card must be signed by ${CARD_ATTESTATION_KID}; this one is not.`,
        });
      }
    } else {
      fail("untrusted_signer");
      checks.push({
        label: "Trust anchor",
        ok: false,
        code: "untrusted_signer",
        detail:
          `${keyHex.slice(0, 8)}… is NOT among the keys published at did:web:csoai.org. ` +
          `A card that carries its own key proves only self-consistency — anyone can mint one. ` +
          `The signature check below is reported separately.`,
      });
    }
  }

  /* ---- 3. does the signature verify over those exact bytes? ---- */
  if (!sigRaw) {
    checks.push({ label: "Signature", ok: null, code: "unsigned", detail: "UNSIGNED — hash only." });
  } else {
    const sigBytes = decodeSig(sigRaw);
    if (!sigBytes || !keyBytes) {
      fail("signature_malformed");
      checks.push({
        label: "Signature",
        ok: false,
        code: "signature_malformed",
        detail: "The signature or key could not be decoded as hex or base64.",
      });
    } else {
      try {
        const sigOk = await ed25519Verify(keyBytes, sigBytes, sigOver);
        if (!sigOk) fail("signature_invalid");
        checks.push({
          label: "Signature",
          ok: sigOk,
          code: sigOk ? "signature_valid" : "signature_invalid",
          detail: sigOk
            ? `Ed25519 verifies over ${
                family === "gspc.measurement-card" ? "the canonical body bytes" : "the content_id"
              } under ${keyHex?.slice(0, 8)}….`
            : `INVALID — the signature does not verify over ${
                family === "gspc.measurement-card" ? "the canonical body bytes" : "the content_id"
              } under the key the card carries. The bytes and the signature disagree; ` +
              `this is not a statement about key publication.`,
        });
      } catch (e) {
        if (e instanceof Ed25519Unsupported) {
          fail("ed25519_unsupported");
          checks.push({
            label: "Signature",
            ok: null,
            code: "ed25519_unsupported",
            detail:
              "This browser's WebCrypto has no Ed25519, so the signature could not be checked here. " +
              "The hash above was still recomputed locally. Verify offline with the recipe at /signed/HOW-TO-VERIFY.md.",
          });
        } else {
          throw e;
        }
      }
    }
  }

  const valid = reasons.length === 0 && checks.every((c) => c.ok !== false);
  return { family, family_label: FAMILY_LABEL[family], valid, reasons, checks, id: declaredId };
}
