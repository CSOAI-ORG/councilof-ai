/**
 * Client-side record verification for the "Verify a single record" box on /gspc-verify.
 *
 * The page's promise is that hash and signature are recomputed in the reader's browser
 * against the published keys, so a reader must be able to paste anything the estate
 * publishes and get a truthful verdict. Two envelopes reach this box:
 *
 *   1. A signed measurement card from /signed/cards/ — { body, id, pubkey, signature }.
 *      Its rules (a CPython-shaped canonicalisation, and pinning to the published
 *      card-attestation key rather than to the key the card ships with) live in
 *      /signed/verify-card.mjs, which is itself published. We IMPORT that file rather
 *      than restate it: a reader running `node verify-card.mjs` and a reader pasting the
 *      same card here must be running the same code, or one of them is being misled.
 *      A second in-browser implementation drifted from it once already — a naive
 *      canonicalisation reported the Council's own signature as INVALID.
 *
 *   2. The estate envelope — { content_id, signature?, ...body }, and replay records
 *      carrying a sigil.chain_hash. Hash-checked here, and where a detached signature
 *      is present, verified against the keys in /.well-known/did.json.
 *
 * A record that genuinely carries no signature is reported as UNSIGNED — hash only.
 * That is a smaller claim than "valid", and it is never rounded up to one.
 */

import { isSignedCard, verifyCard } from "../../../public/signed/verify-card.mjs";

export interface RecordVerdict {
  lines: { label: string; ok: boolean | null; detail: string }[];
}

export function canonical(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object")
    return (
      "{" +
      Object.keys(v as Record<string, unknown>)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical((v as Record<string, unknown>)[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(v);
}

export async function sha256hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function b64uToBytes(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

export function hexToBytes(s: string): Uint8Array {
  return Uint8Array.from(s.match(/.{2}/g) ?? [], (h) => parseInt(h, 16));
}

/**
 * A signed measurement card, verified by the published verifier itself.
 * Every line below is read off that verifier's `checks` — nothing is re-derived here,
 * so this box cannot disagree with `node verify-card.mjs` about the same bytes.
 */
async function verifySignedCard(card: Record<string, unknown>): Promise<RecordVerdict["lines"]> {
  const lines: RecordVerdict["lines"] = [];
  const kind = typeof (card.body as Record<string, unknown>)?.kind === "string"
    ? String((card.body as Record<string, unknown>).kind)
    : "signed card";
  lines.push({
    label: "Envelope",
    ok: true,
    detail: `Signed measurement card (${kind}) — checked with the published /signed/verify-card.mjs, the same file the command-line verifier runs.`,
  });

  const v = await verifyCard(card);
  const id = String(card.id ?? "");

  lines.push({
    label: "Signing key",
    ok: v.checks.pinned_key,
    detail:
      v.checks.pinned_key === true
        ? "Pinned — the card's pubkey is the published did:web:csoai.org#card-attestation-1 key."
        : v.checks.pinned_key === false
          ? "NOT the published card-attestation key — a card signed by any other key is not ours, whatever its signature says."
          : "Not checked — the record is missing a pubkey, id or signature.",
  });

  lines.push({
    label: "id",
    ok: v.checks.id,
    detail:
      v.checks.id === true
        ? `Recomputed sha256 of the canonical body matches (${id.slice(0, 16)}…).`
        : v.checks.id === false
          ? `MISMATCH — card claims ${id.slice(0, 16)}…, body hashes to ${String(v.computed_id ?? "").slice(0, 16)}….`
          : `Not checked — ${v.reason ?? "the key check did not pass"}.`,
  });

  lines.push({
    label: "Signature",
    ok: v.checks.signature,
    detail:
      v.checks.signature === true
        ? "VALID — Ed25519 over the canonical body verifies under the pinned card-attestation key."
        : v.checks.signature === false
          ? "INVALID — the signature does not verify under the pinned key."
          : `UNCHECKED — ${v.reason ?? "an earlier check did not pass"}.`,
  });

  return lines;
}

export async function verifyRecord(raw: string): Promise<RecordVerdict> {
  const lines: RecordVerdict["lines"] = [];
  let rec: Record<string, unknown>;
  try {
    rec = JSON.parse(raw);
  } catch {
    return { lines: [{ label: "Parse", ok: false, detail: "Not valid JSON — nothing was checked." }] };
  }
  lines.push({ label: "Parse", ok: true, detail: "Valid JSON." });

  if (isSignedCard(rec)) {
    lines.push(...(await verifySignedCard(rec)));
    return { lines };
  }

  const { signature, content_id, ...body } = rec as Record<string, unknown>;
  if (typeof content_id === "string") {
    const withSig = signature !== undefined ? { ...body, signature } : body;
    const candA = await sha256hex(canonical(withSig));
    const candB = await sha256hex(canonical(body));
    const ok = candA === content_id || candB === content_id;
    lines.push({
      label: "content_id",
      ok,
      detail: ok
        ? `Recomputed sha256 matches (${String(content_id).slice(0, 16)}…, envelope ${candA === content_id ? "A" : "B"}).`
        : `MISMATCH — record claims ${String(content_id).slice(0, 16)}….`,
    });
  } else {
    lines.push({ label: "content_id", ok: null, detail: "Absent — hash check not applicable." });
  }

  // Replay/estate records carry their hash in a sigil instead of a content_id. It is the
  // same claim — sha256 over the canonical body — so it gets the same recomputation.
  // The sigil holds the hash being checked, so it is stripped from its own preimage
  // (exactly as lib/verify.ts verifyChain does); the content_id path above is left
  // untouched, hashing the record as it always did.
  const { sigil, ...bodyWithoutSigil } = body;
  const chainHash = (sigil as Record<string, unknown> | undefined)?.chain_hash;
  if (typeof chainHash === "string") {
    const computed = await sha256hex(canonical(bodyWithoutSigil));
    const ok = computed === chainHash;
    lines.push({
      label: "chain_hash",
      ok,
      detail: ok
        ? `Recomputed sha256 of the record body matches the sigil (${chainHash.slice(0, 16)}…).`
        : `MISMATCH — sigil claims ${chainHash.slice(0, 16)}…, body hashes to ${computed.slice(0, 16)}….`,
    });
  }

  if (typeof signature === "string" && signature.length > 0) {
    try {
      const did = await (await fetch("/.well-known/did.json")).json();
      const methods: { id: string; publicKeyJwk?: JsonWebKey; publicKeyHex?: string }[] =
        did.verificationMethod ?? [];
      const signedBytes = new TextEncoder().encode(canonical({ ...body, ...(content_id !== undefined ? { content_id } : {}) }));
      const sigBytes = /^[0-9a-f]+$/i.test(signature) ? hexToBytes(signature) : b64uToBytes(signature);
      let verdict = "no published key verifies this signature";
      let ok = false;
      for (const m of methods) {
        try {
          const key = m.publicKeyJwk
            ? await crypto.subtle.importKey("jwk", m.publicKeyJwk, { name: "Ed25519" }, false, ["verify"])
            : m.publicKeyHex
              ? await crypto.subtle.importKey("raw", hexToBytes(m.publicKeyHex), { name: "Ed25519" }, false, ["verify"])
              : null;
          if (!key) continue;
          if (await crypto.subtle.verify({ name: "Ed25519" }, key, sigBytes as unknown as BufferSource, signedBytes)) {
            verdict = `VALID against ${m.id}`;
            ok = true;
            break;
          }
        } catch { /* try next */ }
      }
      lines.push({ label: "Signature", ok, detail: ok ? verdict : `INVALID — ${verdict}.` });
    } catch {
      lines.push({ label: "Signature", ok: false, detail: "Could not fetch did.json keys." });
    }
  } else {
    lines.push({ label: "Signature", ok: null, detail: "UNSIGNED — hash only." });
  }
  return { lines };
}
