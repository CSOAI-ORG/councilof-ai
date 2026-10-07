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

const INTEGRAL_FLOAT_RE = /[:\[,]\s*-?\d+\.0+\s*[,}\]]/;

export async function verifyCardV0(
  rec: { payload: Record<string, unknown>; sha256: string; sig_ed25519: string | null; did?: string; did_intended?: string },
  rawText: string | null,
  anchors: Anchor[] = PINNED_ANCHORS,
): Promise<{ state: "VALID" | "INVALID" | "UNCHECKABLE"; family: string; id: string; reasons: string[]; checks: { check: string; ok: boolean | null; code: string; detail: string }[] }> {
  const checks: { check: string; ok: boolean | null; code: string; detail: string }[] = [
    { check: "Family", ok: true, code: "family", detail: "csoai.card-v0 — payload + sha256 + sig_ed25519 over the canonical payload bytes" },
  ];
  const computed = await sha256Hex(canonicalBytes(rec.payload));
  const shaOk = computed === rec.sha256.toLowerCase();
  if (!shaOk) {
    const ambiguous = rawText !== null && INTEGRAL_FLOAT_RE.test(rawText);
    checks.push({ check: "Digest", ok: ambiguous ? null : false, code: ambiguous ? "float_rendering_ambiguous" : "sha256_mismatch", detail: ambiguous ? `computed ${computed}; the bytes carry an integral float JavaScript renders differently from the signer, so this is not judged` : `canonical payload hashes to ${computed}, not the declared ${rec.sha256}` });
    return { state: ambiguous ? "UNCHECKABLE" : "INVALID", family: "csoai.card-v0", id: rec.sha256, reasons: [ambiguous ? "float_rendering_ambiguous" : "sha256_mismatch"], checks };
  }
  checks.push({ check: "Digest", ok: true, code: "sha256_ok", detail: "the canonical payload bytes reproduce the declared sha256" });
  if (!rec.sig_ed25519) {
    checks.push({ check: "Signature", ok: null, code: "unsigned", detail: "sig_ed25519 is null — the leaf declares itself unsigned; nothing to verify" });
    return { state: "UNCHECKABLE", family: "csoai.card-v0", id: rec.sha256, reasons: ["unsigned"], checks };
  }
  const did = String(rec.did || "");
  const pin = anchors.find((a) => a.id === did && /^[0-9a-f]{64}$/i.test(a.hex));
  if (!pin) {
    checks.push({ check: "Signing key", ok: null, code: "key_not_pinned", detail: `${did || "(no did)"} is not in this verifier's offline pin set` });
    return { state: "UNCHECKABLE", family: "csoai.card-v0", id: rec.sha256, reasons: ["key_not_pinned"], checks };
  }
  const v = await verifyLeaf(rec.payload, rec.sha256.toLowerCase(), rec.sig_ed25519, pin.hex);
  checks.push({ check: "Signature", ok: v.sig_ok, code: v.sig_ok ? "signature_ok" : "signature_invalid", detail: v.sig_ok ? `Ed25519 verifies under pinned ${did}` : `Ed25519 does not verify under pinned ${did}` });
  return { state: v.sig_ok ? "VALID" : "INVALID", family: "csoai.card-v0", id: rec.sha256, reasons: v.sig_ok ? [] : ["signature_invalid"], checks };
}
