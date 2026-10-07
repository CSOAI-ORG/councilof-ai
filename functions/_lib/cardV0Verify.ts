import { PINNED_ANCHORS, type Anchor } from "./cardVerify";
import { verifyLeaf, canonicalBytes, sha256Hex } from "./cardSign";

/**
 * The card-v0 verdict, shared by every door that judges one: POST /api/verify, GET
 * /api/x402/<name>, and the /gspc-verify page's "Verify a single record" (client/src/lib/
 * recordVerify.ts). Moved here from functions/api/verify.ts on 2026-10-07 because the page could
 * not import a Pages handler, and so it answered UNCHECKABLE/unrecognised_family for the very
 * leaf a paid art50 pack tells its buyer to check there ("verify: /gspc-verify").
 *
 * CARD-V0 LEAVES (added 2026-09-25 with the self-serve RAS doors). The receipts those doors
 * return, the population-door attestations and /api/wrapper cards are card-v0 leaves: `payload`,
 * `sha256` over the payload's canonical bytes, `sig_ed25519` over those same bytes under a DID key
 * (functions/_lib/cardSign.ts — the rule /api/board-sign applies). cardVerify.ts does not know
 * that shape, so before this it answered UNCHECKABLE/unrecognised_family for every receipt the
 * estate itself issues. This adds no new rule: the preimage is canonicalBytes, the check is
 * cardSign.verifyLeaf, and the key is the PINNED anchor the DID names — never a fetched one.
 *
 * CARD-V1 WHOLE-CARD LEAVES (2026-10-07). The same shape (payload + sha256 + sig_ed25519) is also
 * used by card-v1 leaves that declare `digest_covers: "whole-card-except-sha256-and-sig_ed25519"`
 * (scripts/publish_public_root.py card_sha256 + sign_card; scripts/root_digest_domain.py
 * WHOLE_CARD_V1): `sha256` is over the whole card minus `sha256` and `sig_ed25519`, and the
 * signature is over the compact envelope {did, schema, surface, as_of, sha256}. They used to be
 * judged by the payload-only rule, so a GENUINE estate-signed card read INVALID/sha256_mismatch —
 * a false failure, read live on POST /api/verify on 7 Oct with
 * public/archive/xrpl-rlusd/2026-09.jsonl's last line. The whole-card rule below reproduces all
 * 2,994 signed and 126 unsigned whole-card leaves under public/archive (read 7 Oct): 0 mismatches.
 * A leaf that declares any OTHER digest domain is UNCHECKABLE (digest_domain_unknown), never
 * judged by a rule it did not declare.
 *
 * The float quirk applies here too: a leaf signed by Python over an integral float ("1.0") is
 * re-rendered "1" by JavaScript. A digest mismatch on bytes that carry such a float is therefore
 * UNCHECKABLE (float_rendering_ambiguous), never INVALID — the same refusal to report a false
 * failure that functions/api/verify.ts's header explains.
 *
 * `anchors` defaults to the PINNED set and every production caller leaves it so; a test passes a
 * throwaway key to prove a leaf round-trips without holding the board key.
 */
export function isCardV0(rec: unknown): rec is { payload: Record<string, unknown>; sha256: string; sig_ed25519: string | null; did?: string; did_intended?: string } {
  if (!rec || typeof rec !== "object" || Array.isArray(rec)) return false;
  const r = rec as Record<string, unknown>;
  return !!r.payload && typeof r.payload === "object" && !Array.isArray(r.payload) && typeof r.sha256 === "string" && "sig_ed25519" in r;
}

/** The digest domain a card-v1 leaf declares (scripts/root_digest_domain.py WHOLE_CARD_V1). */
export const WHOLE_CARD_COVERS = "whole-card-except-sha256-and-sig_ed25519";
/** The fields a whole-card signature covers (scripts/publish_public_root.py CARD_ENVELOPE_KEYS). */
export const CARD_ENVELOPE_KEYS = ["did", "schema", "surface", "as_of", "sha256"] as const;

const INTEGRAL_FLOAT_RE = /[:\[,]\s*-?\d+\.0+\s*[,}\]]/;

type Check = { check: string; ok: boolean | null; code: string; detail: string };
type Verdict = { state: "VALID" | "INVALID" | "UNCHECKABLE"; family: string; id: string; reasons: string[]; checks: Check[] };

export async function verifyCardV0(
  rec: { payload: Record<string, unknown>; sha256: string; sig_ed25519: string | null; did?: string; did_intended?: string },
  rawText: string | null,
  anchors: Anchor[] = PINNED_ANCHORS,
): Promise<Verdict> {
  const covers = (rec as { digest_covers?: unknown }).digest_covers;
  const whole = covers === WHOLE_CARD_COVERS;
  const family = whole ? "csoai.card-v1" : "csoai.card-v0";
  const checks: Check[] = [
    {
      check: "Family",
      ok: true,
      code: "family",
      detail: whole
        ? "csoai.card-v1 — sha256 over the whole card except sha256 and sig_ed25519; sig_ed25519 over the envelope {did, schema, surface, as_of, sha256}"
        : "csoai.card-v0 — payload + sha256 + sig_ed25519 over the canonical payload bytes",
    },
  ];
  if (covers !== undefined && covers !== null && !whole) {
    checks.push({ check: "Digest", ok: null, code: "digest_domain_unknown", detail: `the record declares digest_covers ${JSON.stringify(covers)}, a rule this verifier does not implement; it is not judged by another one` });
    return { state: "UNCHECKABLE", family, id: rec.sha256, reasons: ["digest_domain_unknown"], checks };
  }

  let preimage: Record<string, unknown> = rec.payload;
  if (whole) {
    const { sha256: _s, sig_ed25519: _g, ...body } = rec as Record<string, unknown>;
    preimage = body;
  }
  const computed = await sha256Hex(canonicalBytes(preimage));
  const shaOk = computed === rec.sha256.toLowerCase();
  if (!shaOk) {
    const ambiguous = rawText !== null && INTEGRAL_FLOAT_RE.test(rawText);
    const what = whole ? "the canonical card (without sha256 and sig_ed25519)" : "canonical payload";
    checks.push({ check: "Digest", ok: ambiguous ? null : false, code: ambiguous ? "float_rendering_ambiguous" : "sha256_mismatch", detail: ambiguous ? `computed ${computed}; the bytes carry an integral float JavaScript renders differently from the signer, so this is not judged` : `${what} hashes to ${computed}, not the declared ${rec.sha256}` });
    return { state: ambiguous ? "UNCHECKABLE" : "INVALID", family, id: rec.sha256, reasons: [ambiguous ? "float_rendering_ambiguous" : "sha256_mismatch"], checks };
  }
  checks.push({ check: "Digest", ok: true, code: "sha256_ok", detail: whole ? "the canonical card bytes (without sha256 and sig_ed25519) reproduce the declared sha256" : "the canonical payload bytes reproduce the declared sha256" });
  if (!rec.sig_ed25519) {
    checks.push({ check: "Signature", ok: null, code: "unsigned", detail: "sig_ed25519 is null — the leaf declares itself unsigned; nothing to verify" });
    return { state: "UNCHECKABLE", family, id: rec.sha256, reasons: ["unsigned"], checks };
  }
  const did = String(rec.did || "");
  const pin = anchors.find((a) => a.id === did && /^[0-9a-f]{64}$/i.test(a.hex));
  if (!pin) {
    checks.push({ check: "Signing key", ok: null, code: "key_not_pinned", detail: `${did || "(no did)"} is not in this verifier's offline pin set` });
    return { state: "UNCHECKABLE", family, id: rec.sha256, reasons: ["key_not_pinned"], checks };
  }
  // card-v0 signs the payload bytes; card-v1 signs the compact envelope, which carries the
  // whole-card sha256 and so binds every field through it.
  const signed: Record<string, unknown> = whole ? Object.fromEntries(CARD_ENVELOPE_KEYS.map((k) => [k, (rec as Record<string, unknown>)[k]])) : rec.payload;
  const v = await verifyLeaf(signed, await sha256Hex(canonicalBytes(signed)), rec.sig_ed25519, pin.hex);
  const over = whole ? " over the envelope {did, schema, surface, as_of, sha256}" : "";
  checks.push({ check: "Signature", ok: v.sig_ok, code: v.sig_ok ? "signature_ok" : "signature_invalid", detail: v.sig_ok ? `Ed25519 verifies under pinned ${did}${over}` : `Ed25519 does not verify under pinned ${did}${over}` });
  return { state: v.sig_ok ? "VALID" : "INVALID", family, id: rec.sha256, reasons: v.sig_ok ? [] : ["signature_invalid"], checks };
}
