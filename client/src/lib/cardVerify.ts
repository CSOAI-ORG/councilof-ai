/**
 * cardVerify — verify a published Council of AI MEASUREMENT CARD in the browser.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS
 *
 * The estate publishes TWO signed families and they are not the same shape:
 *
 *   estate envelope  { …fields, content_id, signature }   -> lib/recordVerify.ts
 *   measurement card { id, pubkey, signature, alg, body } -> THIS FILE
 *
 * Council OS shipped only the first. Feeding a genuine, published, correctly
 * signed measurement card into the "Verify a card" pane produced:
 *
 *     content_id:  ○  Absent — hash check not applicable.
 *     Signature:   ✗  INVALID — no published key verifies this signature.
 *
 * — i.e. the tab named "Verify a card" reported FORGERY on authentic evidence,
 * because it hashed the wrong object with the wrong canonicaliser. A verifier
 * that says INVALID when it means "I do not know this family" is the worst
 * possible defect on a measurement estate: it is a false accusation, and it is
 * indistinguishable to the reader from a real one. Hence the three-outcome
 * contract below.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THREE OUTCOMES, NEVER TWO
 *
 *   VALID        the id recomputes AND the signature verifies under the pinned key
 *   INVALID      the check ran to completion and FAILED — say why
 *   UNCHECKABLE  the check could not be completed (no key on the wire, no Ed25519
 *                in this runtime, unserialisable body). NOT the same claim as
 *                "forged", and never rendered as one.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE CANONICALISATION QUIRK — the reason a naive JS verifier fails ~1/3 of cards
 *
 * The preimage was produced by CPython:
 *     json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True)
 * CPython renders a FLOAT of integral value as "0.0". ECMAScript's
 * JSON.stringify, Go's encoding/json and RFC 8785 (JCS) all render it "0".
 * JavaScript cannot tell 0 from 0.0 at runtime — both are the same IEEE-754
 * double — so the verifier must be TOLD which fields are floats. FLOAT_FIELDS
 * below is that list. It is a property of our schema, not of the data.
 *
 * We cannot re-canonicalise our way out of it: every card id IS the sha256 of
 * these exact bytes, so changing them would invalidate every id and break every
 * citation already published.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE ALGORITHM, TWO IMPLEMENTATIONS, ONE TEST
 *
 * public/signed/verify-card.mjs is the published Node verifier a stranger runs.
 * This file is the browser twin. They must never drift, so
 * client/src/lib/cardVerify.test.ts verifies REAL published cards through BOTH
 * and fails if the two disagree on a single card. Do not edit one without the
 * other; the test will catch you if you do.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AUTHENTICITY REQUIRES PINNING
 *
 * A card carries its own `pubkey`. Verifying against THAT proves only that the
 * file is self-consistent — anyone can alter a body and re-sign it with a key
 * they generated a second ago. So the key is pinned to the one published in the
 * estate's DID document (`did:web:csoai.org#card-attestation-1`), read off the
 * wire at check time rather than typed here, so there is exactly one place the
 * card key lives. If did.json cannot be read, the result is UNCHECKABLE.
 */

export type CardState = "VALID" | "INVALID" | "UNCHECKABLE";

export interface CardVerdict {
  state: CardState;
  /** Why, in one sentence. Always populated. */
  reason: string;
  /** The card's own id, when it had one. */
  id?: string;
  /** body.axis, when present — useful for labelling the result. */
  axis?: string;
  /** The DID verification method the signature verified under. */
  keyId?: string;
  /** The recomputed sha256 of the canonical body, when it got that far. */
  digest?: string;
}

/** Fields whose values are floats in the card schema. See the header. */
const FLOAT_FIELDS = new Set(["accuracy", "ci_low", "ci_high", "recall", "precision", "f1"]);

/** The DID verification method whose key signs measurement cards. */
export const CARD_KEY_ID = "did:web:csoai.org#card-attestation-1";

/** JSON string escaping with ensure_ascii=True — non-ASCII becomes \\uXXXX, as CPython does. */
function jsonString(s: string): string {
  let out = '"';
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (ch === '"') out += '\\"';
    else if (ch === "\\") out += "\\\\";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (c < 0x20) out += "\\u" + c.toString(16).padStart(4, "0");
    else if (c < 0x7f) out += ch;
    else if (c <= 0xffff) out += "\\u" + c.toString(16).padStart(4, "0");
    else {
      // Astral plane: CPython emits a surrogate pair, so we must too.
      const v = c - 0x10000;
      out += "\\u" + (0xd800 + (v >> 10)).toString(16).padStart(4, "0");
      out += "\\u" + (0xdc00 + (v & 0x3ff)).toString(16).padStart(4, "0");
    }
  }
  return out + '"';
}

/** Canonicalise exactly as CPython json.dumps(sort_keys=True, separators=(',',':')) does. */
export function canonicalPy(value: unknown, key: string | null = null): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`non-finite number at ${key}`);
    if (Number.isInteger(value) && key !== null && FLOAT_FIELDS.has(key)) return value.toFixed(1);
    return String(value);
  }
  if (typeof value === "string") return jsonString(value);
  if (Array.isArray(value)) return "[" + value.map((v) => canonicalPy(v, key)).join(",") + "]";
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    return (
      "{" +
      Object.keys(o)
        .sort()
        .map((k) => jsonString(k) + ":" + canonicalPy(o[k], k))
        .join(",") +
      "}"
    );
  }
  throw new Error(`unserialisable value at ${key}`);
}

/**
 * RFC 8785 JCS — Rule B. Numbers are ES6 Number.prototype.toString (0.0 → "0",
 * 1e-6 → "0.000001"). Used only when the artefact declares jcs-rfc8785.
 * Published /signed/cards/ do not; they stay on canonicalPy.
 */
function jcsString(s: string): string {
  let out = '"';
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (ch === '"') out += '\\"';
    else if (ch === "\\") out += "\\\\";
    else if (ch === "\b") out += "\\b";
    else if (ch === "\f") out += "\\f";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (c < 0x20) out += "\\u" + c.toString(16).padStart(4, "0");
    else out += ch;
  }
  return out + '"';
}

export function canonicalJcs(value: unknown, key: string | null = null): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`non-finite number at ${key}`);
    return Number.prototype.toString.call(value);
  }
  if (typeof value === "string") return jcsString(value);
  if (Array.isArray(value)) return "[" + value.map((v) => canonicalJcs(v, key)).join(",") + "]";
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    return (
      "{" +
      Object.keys(o)
        .sort()
        .map((k) => jcsString(k) + ":" + canonicalJcs(o[k], k))
        .join(",") +
      "}"
    );
  }
  throw new Error(`unserialisable value at ${key}`);
}

const hex = (buf: ArrayBuffer): string =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

const unhex = (s: string): Uint8Array =>
  Uint8Array.from(s.match(/../g) ?? [], (b) => parseInt(b, 16));

const b64uToBytes = (s: string): Uint8Array => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};

/** True when this object has the shape of a measurement card. Shape only — no claim. */
export function looksLikeCard(v: unknown): boolean {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.signature === "string" && !!o.body && typeof o.body === "object";
}

/**
 * Read the pinned card key off the wire.
 *
 * Returns the raw 32 bytes, or null when the DID document cannot be read or does
 * not publish the card key — in which case the caller must report UNCHECKABLE,
 * never INVALID. "I could not fetch the key" is not evidence about the card.
 */
export async function fetchPinnedCardKey(signal?: AbortSignal): Promise<Uint8Array | null> {
  try {
    const r = await fetch("/.well-known/did.json", { signal, headers: { accept: "application/json" } });
    if (!r.ok) return null;
    const did: any = await r.json();
    const methods: any[] = Array.isArray(did?.verificationMethod) ? did.verificationMethod : [];
    const m = methods.find((x) => x?.id === CARD_KEY_ID);
    if (!m) return null;
    if (typeof m.publicKeyHex === "string") return unhex(m.publicKeyHex);
    const x = m?.publicKeyJwk?.x;
    if (typeof x === "string") return b64uToBytes(x);
    return null;
  } catch {
    return null;
  }
}

/**
 * Verify one measurement card.
 *
 * `pinnedKey` is the 32-byte raw Ed25519 key from the DID document. Pass null
 * only when it genuinely could not be read: the result is then UNCHECKABLE.
 */
export async function verifyCard(card: unknown, pinnedKey: Uint8Array | null): Promise<CardVerdict> {
  if (!looksLikeCard(card))
    return { state: "UNCHECKABLE", reason: "This is not a measurement card: it has no id, signature and body." };
  const c = card as {
    id: string;
    signature: string;
    pubkey?: string;
    alg?: string;
    body: unknown;
    preimage_rule?: string;
    canon?: string;
  };
  const axis = typeof (c.body as any)?.axis === "string" ? (c.body as any).axis : undefined;

  if (typeof c.pubkey !== "string" || !c.pubkey)
    return { state: "UNCHECKABLE", reason: "The card names no public key, so there is nothing to pin it to.", id: c.id, axis };

  if (!pinnedKey)
    return {
      state: "UNCHECKABLE",
      reason:
        "The published card key could not be read from /.well-known/did.json, so authenticity could not be established. " +
        "That is a statement about this check, not about the card.",
      id: c.id,
      axis,
    };

  if (c.pubkey !== hex(pinnedKey.buffer.slice(pinnedKey.byteOffset, pinnedKey.byteOffset + pinnedKey.byteLength) as ArrayBuffer))
    return {
      state: "INVALID",
      reason: `The card is signed by a key that is not ${CARD_KEY_ID}. A self-consistent card signed by an unpublished key proves nothing.`,
      id: c.id,
      axis,
    };

  let preimage: Uint8Array;
  try {
    const rule = c.preimage_rule || c.canon || "cpython-v1";
    const fn = rule === "jcs-rfc8785" ? canonicalJcs : canonicalPy;
    preimage = new TextEncoder().encode(fn(c.body));
  } catch (e: any) {
    return { state: "UNCHECKABLE", reason: `The body could not be canonicalised: ${e?.message ?? e}.`, id: c.id, axis };
  }

  const digest = hex(await crypto.subtle.digest("SHA-256", preimage as unknown as BufferSource));
  if (digest !== c.id)
    return {
      state: "INVALID",
      reason: `Id mismatch — the body hashes to ${digest.slice(0, 16)}…, the card claims ${c.id.slice(0, 16)}….`,
      id: c.id,
      axis,
      digest,
    };

  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey("raw", pinnedKey as unknown as BufferSource, { name: "Ed25519" }, false, ["verify"]);
  } catch {
    return {
      state: "UNCHECKABLE",
      reason: "This browser has no Ed25519 in WebCrypto, so the signature could not be checked here. The hash matched.",
      id: c.id,
      axis,
      digest,
    };
  }

  let ok = false;
  try {
    ok = await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      unhex(c.signature) as unknown as BufferSource,
      preimage as unknown as BufferSource,
    );
  } catch (e: any) {
    return { state: "UNCHECKABLE", reason: `The signature check could not run: ${e?.message ?? e}.`, id: c.id, axis, digest };
  }

  return ok
    ? {
        state: "VALID",
        reason: `sha256 of the canonical body equals the card id, and the signature verifies under ${CARD_KEY_ID}.`,
        id: c.id,
        axis,
        keyId: CARD_KEY_ID,
        digest,
      }
    : {
        state: "INVALID",
        reason: "The hash matched but the signature does not verify under the published card key.",
        id: c.id,
        axis,
        digest,
      };
}
