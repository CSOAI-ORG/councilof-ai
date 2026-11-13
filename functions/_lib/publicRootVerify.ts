/**
 * publicRootVerify — the verdict for public/root.json (kind csoai.public-root/v1).
 *
 * WHY THIS EXISTS. Until 7 Oct 2026 POST /api/verify answered UNCHECKABLE (unrecognised_family)
 * for the estate's own public root, so nobody could check our root with our own verifier. The rule
 * was already implemented twice elsewhere — scripts/publish_public_root.py writes the root and
 * functions/api/fabric.ts verifyRootEnvelope re-checks its signature — and this module is that
 * rule, not a third guess at it:
 *
 *   signature  = Ed25519 over canonical JSON (sorted keys, compact separators, ensure_ascii=false:
 *                functions/_lib/cardSign.ts canonicalBytes) of EXACTLY
 *                {kind, schema, as_of, merkle_root, card_count, did_intended}
 *                under the key did_intended names — resolved ONLY against the pinned anchor set.
 *   merkle_root = pairwise sha256(left || right) over the RAW 32-byte leaves of card_sha256[],
 *                bottom-up, an odd node paired WITH ITSELF, no domain separation
 *                (root.json node_definition; publish_public_root.py merkle_root).
 *   card_count  MUST equal len(card_sha256): the signed count is what closes the CVE-2012-2459
 *                twin the odd-node rule admits (root.json tree_caveat). A count that disagrees
 *                with the leaf list is a positive failure, never a warning.
 *
 * TWO COMPONENTS, EACH WITH ITS OWN STATE. The signature binds six fields; the leaf list is bound
 * only through merkle_root. So the verdict reports `components.signature` and `components.merkle`
 * separately, and the overall state is the strictest of the two: any INVALID component makes the
 * root INVALID; otherwise any UNCHECKABLE component (no leaves posted, key not pinned, runtime
 * without Ed25519) makes it UNCHECKABLE — a component that could not be checked is never VALID.
 */
import { PINNED_ANCHORS, hexToBytes, bytesToHex, type Anchor } from "./cardVerify";
import { canonicalBytes, sha256Hex } from "./cardSign";

export const PUBLIC_ROOT_KIND = "csoai.public-root/v1";
/** scripts/publish_public_root.py ENVELOPE_PREIMAGE_KEYS; functions/api/fabric.ts ROOT_PREIMAGE_FIELDS. */
export const ROOT_PREIMAGE_FIELDS = ["kind", "schema", "as_of", "merkle_root", "card_count", "did_intended"] as const;

export type ComponentState = "VALID" | "INVALID" | "UNCHECKABLE";
export type RootCheck = { check: string; ok: boolean | null; code: string; detail: string };
export interface RootVerdict {
  state: ComponentState;
  family: typeof PUBLIC_ROOT_KIND;
  /** The merkle_root the envelope declares. */
  id: string | null;
  reasons: string[];
  checks: RootCheck[];
  components: { signature: ComponentState; merkle: ComponentState };
  as_of: string | null;
  card_count: number | null;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const HEX64 = /^[0-9a-f]{64}$/;

export function isPublicRoot(rec: unknown): rec is Record<string, unknown> {
  return isRecord(rec) && rec.kind === PUBLIC_ROOT_KIND && typeof rec.merkle_root === "string";
}

/** publish_public_root.py merkle_root, byte for byte: odd node duplicated, no prefix, empty list → sha256(""). */
export async function merkleRootOf(leafHexes: string[]): Promise<string> {
  let level = leafHexes.map((h) => hexToBytes(h));
  if (level.length === 0) return sha256Hex(new Uint8Array(0));
  while (level.length > 1) {
    const next: Uint8Array[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const a = level[i];
      const b = i + 1 < level.length ? level[i + 1] : level[i];
      const cat = new Uint8Array(a.length + b.length);
      cat.set(a, 0);
      cat.set(b, a.length);
      next.push(new Uint8Array(await crypto.subtle.digest("SHA-256", cat as BufferSource)));
    }
    level = next;
  }
  return bytesToHex(level[0]);
}

export async function verifyPublicRoot(rec: Record<string, unknown>, anchors: Anchor[] = PINNED_ANCHORS): Promise<RootVerdict> {
  const checks: RootCheck[] = [];
  const reasons: string[] = [];
  const fail = (code: string) => { if (!reasons.includes(code)) reasons.push(code); };
  const merkleRoot = typeof rec.merkle_root === "string" ? rec.merkle_root.toLowerCase() : null;
  const asOf = typeof rec.as_of === "string" ? rec.as_of : null;
  const cardCount = typeof rec.card_count === "number" && Number.isInteger(rec.card_count) ? rec.card_count : null;
  checks.push({
    check: "Family",
    ok: true,
    code: "family",
    detail: `${PUBLIC_ROOT_KIND} — the signed public root: Ed25519 over {${ROOT_PREIMAGE_FIELDS.join(", ")}}; card_sha256[] bound through merkle_root.`,
  });

  /* ---- component 1: the envelope signature ---- */
  let signature: ComponentState;
  const did = typeof rec.did_intended === "string" ? rec.did_intended : null;
  const pin = did ? anchors.find((a) => a.id === did && HEX64.test(a.hex)) ?? null : null;
  const sig = typeof rec.sig_ed25519 === "string" ? rec.sig_ed25519.toLowerCase() : null;
  if (!did) {
    signature = "UNCHECKABLE";
    fail("key_not_pinned");
    checks.push({ check: "Signing key", ok: null, code: "key_not_pinned", detail: "UNCHECKABLE — the root names no did_intended, so there is no key to resolve." });
  } else if (!pin) {
    signature = "UNCHECKABLE";
    fail("key_not_pinned");
    checks.push({ check: "Signing key", ok: null, code: "key_not_pinned", detail: `UNCHECKABLE — ${did} is not in this verifier's offline pin set.` });
  } else if (!sig) {
    signature = "UNCHECKABLE";
    fail("unsigned");
    checks.push({ check: "Signature", ok: null, code: "unsigned", detail: "UNSIGNED — sig_ed25519 is absent or null; the envelope declares itself unsigned, nothing to verify." });
  } else if (!/^[0-9a-f]{128}$/.test(sig)) {
    signature = "INVALID";
    fail("signature_malformed");
    checks.push({ check: "Signature", ok: false, code: "signature_malformed", detail: "sig_ed25519 is not 64 bytes of hex." });
  } else {
    const missing = ROOT_PREIMAGE_FIELDS.filter((k) => !(k in rec));
    if (missing.length) {
      signature = "INVALID";
      fail("preimage_incomplete");
      checks.push({ check: "Signature", ok: false, code: "preimage_incomplete", detail: `the envelope lacks ${missing.join(", ")}, which the signed preimage requires.` });
    } else {
      const preimage = Object.fromEntries(ROOT_PREIMAGE_FIELDS.map((k) => [k, rec[k]]));
      const msg = canonicalBytes(preimage);
      let ok: boolean | null;
      try {
        const key = await crypto.subtle.importKey("raw", hexToBytes(pin.hex) as BufferSource, { name: "Ed25519" }, false, ["verify"]);
        ok = await crypto.subtle.verify({ name: "Ed25519" }, key, hexToBytes(sig) as BufferSource, msg as BufferSource);
      } catch (e) {
        ok = (e as { name?: string })?.name === "NotSupportedError" ? null : false;
      }
      if (ok === null) {
        signature = "UNCHECKABLE";
        fail("ed25519_unsupported");
        checks.push({ check: "Signature", ok: null, code: "ed25519_unsupported", detail: "this runtime's WebCrypto lacks Ed25519, so the envelope signature could not be checked here." });
      } else if (ok) {
        signature = "VALID";
        checks.push({ check: "Signature", ok: true, code: "signature_valid", detail: `VALID — Ed25519 verifies over the canonical envelope {${ROOT_PREIMAGE_FIELDS.join(", ")}} under pinned ${did}.` });
      } else {
        signature = "INVALID";
        fail("signature_invalid");
        checks.push({ check: "Signature", ok: false, code: "signature_invalid", detail: `INVALID — the signature does not verify over the canonical envelope under pinned ${did}. One of the six signed fields, or the signature, has changed.` });
      }
    }
  }

  /* ---- component 2: the leaf list against merkle_root and card_count ---- */
  let merkle: ComponentState;
  const leaves = rec.card_sha256;
  if (!merkleRoot || !HEX64.test(merkleRoot)) {
    merkle = "INVALID";
    fail("merkle_root_malformed");
    checks.push({ check: "Merkle root", ok: false, code: "merkle_root_malformed", detail: "merkle_root is not a 32-byte hex digest." });
  } else if (leaves === undefined || leaves === null) {
    merkle = "UNCHECKABLE";
    fail("leaves_absent");
    checks.push({ check: "Merkle root", ok: null, code: "leaves_absent", detail: "UNCHECKABLE — no card_sha256[] was posted, so the root could not be recomputed from its leaves. The signature above still binds merkle_root and card_count; post the full root.json to check the tree." });
  } else if (!Array.isArray(leaves) || leaves.some((l) => typeof l !== "string" || !HEX64.test(l))) {
    merkle = "INVALID";
    fail("leaf_malformed");
    checks.push({ check: "Merkle root", ok: false, code: "leaf_malformed", detail: "card_sha256 is not a list of 32-byte hex digests." });
  } else {
    const hexes = leaves as string[];
    if (cardCount === null || cardCount !== hexes.length) {
      merkle = "INVALID";
      fail("count_mismatch");
      checks.push({ check: "Leaf count", ok: false, code: "count_mismatch", detail: `card_count is ${cardCount ?? "absent"} but card_sha256 holds ${hexes.length} leaves. The signed count is what makes this tree unambiguous (root.json tree_caveat), so the disagreement is a failure, not a warning.` });
    } else {
      checks.push({ check: "Leaf count", ok: true, code: "count_binds", detail: `card_count ${cardCount} equals len(card_sha256).` });
      const recomputed = await merkleRootOf(hexes);
      if (recomputed === merkleRoot) {
        merkle = "VALID";
        checks.push({ check: "Merkle root", ok: true, code: "merkle_match", detail: `the ${hexes.length} leaves recompute to ${merkleRoot.slice(0, 16)}… — pairwise sha256 over raw digests, odd node paired with itself.` });
      } else {
        merkle = "INVALID";
        fail("merkle_mismatch");
        checks.push({ check: "Merkle root", ok: false, code: "merkle_mismatch", detail: `MISMATCH — the posted leaves recompute to ${recomputed.slice(0, 16)}… but the envelope declares ${merkleRoot.slice(0, 16)}…. The leaf list and the signed root disagree.` });
      }
    }
  }

  const states = [signature, merkle];
  const state: ComponentState = states.includes("INVALID") ? "INVALID" : states.includes("UNCHECKABLE") ? "UNCHECKABLE" : "VALID";
  return { state, family: PUBLIC_ROOT_KIND, id: merkleRoot, reasons, checks, components: { signature, merkle }, as_of: asOf, card_count: cardCount };
}
