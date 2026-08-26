/**
 * Client-side verification — shared by /gspc-verify and the Council OS Verify pane.
 *
 * TWO FAMILIES, AND THE DIFFERENCE MATTERS.
 *
 *   estate envelope   { …fields, content_id, signature }
 *   measurement card  { id, pubkey, signature, alg, body }
 *
 * Until 2026-08-26 this module knew only the first. A genuine, published,
 * correctly signed MEASUREMENT CARD pasted into the pane called "Verify a card"
 * came back:
 *
 *     content_id:  ○  Absent — hash check not applicable.
 *     Signature:   ✗  INVALID — no published key verifies this signature.
 *
 * The card was fine. The verifier hashed the wrong object with the wrong
 * canonicaliser and then reported the shortfall as forgery. Reproduced against
 * every card in public/signed/card_index.json before the fix.
 *
 * The card path now lives in lib/cardVerify.ts (which is cross-checked against
 * the published public/signed/verify-card.mjs by cardVerify.test.ts), and the
 * dispatch below routes by SHAPE before anything is hashed. An input this module
 * does not recognise is reported as UNRECOGNISED — never as INVALID. "I do not
 * know this family" and "this is forged" are different claims and a verifier
 * that collapses them is worse than one that refuses.
 */

import { fetchPinnedCardKey, looksLikeCard, verifyCard } from "./cardVerify";

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

export async function verifyRecord(raw: string): Promise<RecordVerdict> {
  const lines: RecordVerdict["lines"] = [];
  let rec: Record<string, unknown>;
  try {
    rec = JSON.parse(raw);
  } catch {
    return { lines: [{ label: "Parse", ok: false, detail: "Not valid JSON — nothing was checked." }] };
  }
  lines.push({ label: "Parse", ok: true, detail: "Valid JSON." });

  // ── family dispatch, by SHAPE, before anything is hashed ──────────────────
  if (looksLikeCard(rec)) {
    lines.push({
      label: "Family",
      ok: true,
      detail: "Measurement card (id + pubkey + signature over a canonical body).",
    });
    const key = await fetchPinnedCardKey();
    const v = await verifyCard(rec, key);
    lines.push({
      label: "Card id",
      ok: v.digest ? v.digest === (rec as any).id : null,
      detail: v.digest
        ? v.digest === (rec as any).id
          ? `Recomputed sha256 of the canonical body matches (${v.digest.slice(0, 16)}…).`
          : `MISMATCH — the body hashes to ${v.digest.slice(0, 16)}….`
        : "Not reached — see below.",
    });
    lines.push({
      label: "Signature",
      ok: v.state === "VALID" ? true : v.state === "INVALID" ? false : null,
      detail: v.state === "VALID" ? `VALID against ${v.keyId}.` : `${v.state} — ${v.reason}`,
    });
    if (typeof (rec as any).body?.public_framing === "string") {
      // A card is frozen at its signing date and cannot be edited without
      // re-signing, so a stale framing inside one is expected. Say so, rather
      // than letting a reader take a card's wording as the current board.
      lines.push({
        label: "Framing",
        ok: null,
        detail:
          `The card carries public_framing "${(rec as any).body.public_framing}" as at ${
            (rec as any).body.created ?? "its signing date"
          }. A signed card is frozen — read the live count from GET /api/gspc, not from a card.`,
      });
    }
    return { lines };
  }

  const { signature, content_id, ...body } = rec as Record<string, unknown>;

  if (content_id === undefined && signature === undefined) {
    lines.push({
      label: "Family",
      ok: null,
      detail:
        "UNRECOGNISED — this is neither an estate envelope (content_id + signature) nor a " +
        "measurement card (id + pubkey + signature + body). Nothing was checked, and nothing " +
        "is claimed about it: not recognising a document is not the same as finding it forged.",
    });
    return { lines };
  }

  lines.push({ label: "Family", ok: true, detail: "Estate envelope (content_id + signature)." });
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
