/**
 * POST /api/verify — verify a posted measurement card. GET explains how.
 *
 * WHY THIS EXISTS. /api/verify answered 404 while six /interop manifests and four generators
 * pointed at it, and the estate's own MCP tool `verify_card` had been doing the real thing all
 * along. The capability was never missing; only the HTTP door was. A 410 was the alternative and
 * would have been the wrong call: you do not retire a door to a capability you have.
 *
 * IT ADDS NO VERIFICATION LOGIC. The verdict comes from functions/_lib/cardVerify.ts — the same
 * module behind the MCP `verify_card` tool and /gspc-verify — so this endpoint cannot return a
 * verdict those surfaces would disagree with. That mattered more than convenience: three doors
 * giving three answers about the same card is exactly the failure this estate keeps finding.
 *
 * THE FLOAT QUIRK IS WHY YOU MUST NOT REIMPLEMENT THIS. Our cards were signed over CPython's
 * json.dumps output, which renders an integral float as "0.0"; ECMAScript, Go and RFC 8785 all
 * render "0". A naive JavaScript verifier therefore computes different bytes and reports a FALSE
 * FAILURE on roughly a third of the published set (116 of 313 measured 2026-08-26). cardVerify
 * handles it via GSPC_FLOAT_FIELDS/pyCanonical. Anything that re-derives the preimage by hand
 * will be wrong on that third and will look right on the rest.
 *
 * THREE STATES, NEVER TWO. VALID / INVALID / UNCHECKABLE. INVALID is a positive finding — the
 * card fails the published rule for a stated reason. UNCHECKABLE means the input was not a card
 * this endpoint could read. Collapsing them is how a verifier tells a caller "no" for two
 * completely different reasons.
 *
 * Trust anchors are PINNED in the verifier's source, so an unreachable did.json cannot turn a
 * valid card UNCHECKABLE, and an unpinned signer cannot pass because the network was down.
 * Verification is free, forever. It certifies nothing.
 *
 * THREE DEFECTS FOUND BY OUTSIDE TOOLS ON 7 OCT 2026, fixed here (lane V1-verify-truth):
 *   D1  A WITHDRAWN card came back plain VALID. The bytes are still served on purpose and the
 *       signature still verifies over them, but the verdict never said the estate had withdrawn the
 *       card. The cryptographic result now lives in `cryptographic_state`; `status` (LIVE / WITHDRAWN
 *       / SUPERSEDED / UNCHECKED, from the two ledgers under /interop/mill-cards-signed/) is a
 *       separate fact; and `state` is WITHDRAWN or SUPERSEDED when the signature is VALID and the
 *       ledger says so. A cryptographic failure still wins: a tampered withdrawn card is INVALID.
 *   D2  liveAnchors() mapped every did.json key to hex "" and never decoded publicKeyJwk.x, so the
 *       advisory cross-check compared every signing key against an empty string and reported
 *       live_anchor_disagrees on every card. It now decodes the OKP JWK through anchorsFromDid, the
 *       same decoder the MCP tool and /gspc-verify use.
 *   D3  public/root.json (csoai.public-root/v1) and the corrections ledger (csoai.corrections/0.1)
 *       were UNCHECKABLE/unrecognised_family: our own root and ledger could not be checked by our own
 *       verifier. Both families are routed to the rule the repo already applies to them elsewhere
 *       (functions/_lib/publicRootVerify.ts; functions/api/corrections.ts checkSignature).
 */
import { verifyCard, cardState, anchorsFromDid, PINNED_ANCHORS, type Anchor } from "../_lib/cardVerify";
import { isSignedRun, verifySignedRunDoc } from "../_lib/signedRunVerify";
import { verifyLeaf, canonicalBytes, sha256Hex } from "../_lib/cardSign";
import { isPublicRoot, verifyPublicRoot, PUBLIC_ROOT_KIND } from "../_lib/publicRootVerify";
import { readStatusLedgers, statusFor, type StatusVerdict } from "../_lib/cardStatus";
import { checkSignature as checkLedgerSignature } from "./corrections";
import { headFromGet } from "./_head";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...CORS },
  });

/**
 * A labelled cross-check only. It never decides a verdict; PINNED_ANCHORS do.
 *
 * Until 2026-10-07 this returned every verificationMethod with `hex: ""` — it read the ids and
 * never decoded publicKeyJwk.x — so the cross-check in cardVerify compared each signing key against
 * an empty string and every card reported live_anchor_disagrees: a vacuous check on an absent field.
 * anchorsFromDid decodes the OKP/Ed25519 JWK `x` (base64url) to the raw 32-byte key, as the MCP tool
 * and /gspc-verify already did. An anchor with no decodable key is dropped, never returned empty
 * (functions/api/verify.truth.test.ts guards this).
 */
export async function liveAnchors(origin: string, fetchImpl: typeof fetch = fetch): Promise<Anchor[]> {
  try {
    const r = await fetchImpl(`${origin}/.well-known/did.json`, { headers: { accept: "application/json" } });
    if (!r.ok) return [];
    return anchorsFromDid(await r.json()).filter((a) => /^[0-9a-f]{64}$/i.test(a.hex));
  } catch {
    return [];
  }
}

/** Accept a card object, a JSON string, or a councilof.ai / csoai.org URL to one. */
async function coerceCard(raw: unknown): Promise<{ card?: unknown; error?: string }> {
  if (raw && typeof raw === "object") return { card: raw };
  if (typeof raw !== "string" || !raw.trim()) {
    return { error: "pass the card as a JSON object, a JSON string, or a councilof.ai / csoai.org URL" };
  }
  const s = raw.trim();
  if (s.startsWith("{")) {
    try { return { card: JSON.parse(s) }; } catch { return { error: "the string is not valid JSON" }; }
  }
  if (/^https:\/\/(councilof\.ai|csoai\.org|www\.csoai\.org)\//.test(s)) {
    try {
      const r = await fetch(s, { headers: { accept: "application/json" } });
      if (!r.ok) return { error: `fetching the card returned HTTP ${r.status}` };
      return { card: await r.json() };
    } catch {
      return { error: "the card URL could not be fetched" };
    }
  }
  return {
    error: "only councilof.ai and csoai.org URLs are fetched by this endpoint; fetch other URLs yourself and post the JSON",
  };
}

/** card-v0 leaves: the shared verdict lives in functions/_lib/cardV0Verify.ts (re-exported for existing importers). */
import { isCardV0, verifyCardV0 } from "../_lib/cardV0Verify";
export { isCardV0, verifyCardV0 };

export const CORRECTIONS_LEDGER_SCHEMA = "csoai.corrections/0.1";

/** The corrections ledger as GET /api/corrections serves it, or its committed body. */
export function isCorrectionsLedger(rec: unknown): rec is Record<string, unknown> {
  return !!rec && typeof rec === "object" && !Array.isArray(rec)
    && (rec as Record<string, unknown>).schema === CORRECTIONS_LEDGER_SCHEMA
    && Array.isArray((rec as Record<string, unknown>).corrections);
}

/**
 * The corrections ledger's own rule, unchanged: functions/api/corrections.ts checkSignature strips
 * the unsigned wrapper fields, recomputes content_id over the canonical body (ensure_ascii=True) and
 * verifies the detached Ed25519 attestation under pinned did:web:csoai.org#board-attestation-1.
 * Mapped onto this door's three states: STALE (signature sound, body moved) is a positive failure
 * of the posted document — the bytes you hold are not the bytes that were attested — so it is
 * INVALID/content_id_mismatch here, never VALID.
 */
export async function verifyCorrectionsLedger(rec: Record<string, unknown>) {
  const c = await checkLedgerSignature(rec);
  const checks: { check: string; ok: boolean | null; code: string; detail: string }[] = [
    { check: "Family", ok: true, code: "family", detail: `${CORRECTIONS_LEDGER_SCHEMA} — the public corrections ledger: content_id over the canonical body minus ${c.unsigned_wrapper_fields.join("/")}, detached Ed25519 attestation under ${c.key}.` },
  ];
  const reasons: string[] = [];
  const attested = c.attested_content_id;
  if (c.state === "UNSIGNED") {
    checks.push({ check: "Signature", ok: null, code: "unsigned", detail: "UNSIGNED — the document carries no signature.attestation, nothing to verify. Recomputed content_id " + c.recomputed_content_id.slice(0, 16) + "…." });
    reasons.push("unsigned");
  } else {
    checks.push({
      check: "content_id",
      ok: c.content_id_matches,
      code: c.content_id_matches ? "content_id_match" : "content_id_mismatch",
      detail: c.content_id_matches
        ? `the canonical body reproduces the attested ${attested?.slice(0, 16)}…`
        : `MISMATCH — the body hashes to ${c.recomputed_content_id.slice(0, 16)}… but the attestation names ${attested?.slice(0, 16) ?? "nothing"}…; the signature covers an earlier body (what /api/corrections reports as STALE), not these bytes.`,
    });
    checks.push({ check: "Signing key", ok: true, code: "anchor_match", detail: `${c.key} (${c.key_ed25519_hex.slice(0, 8)}…) — pinned in the ledger handler, no key resolved at check time.` });
    if (c.ed25519_verified === null) {
      checks.push({ check: "Signature", ok: null, code: "ed25519_unsupported", detail: "this runtime could not perform Ed25519; the attestation is neither confirmed nor refuted here." });
      reasons.push("ed25519_unsupported");
    } else {
      checks.push({
        check: "Signature",
        ok: c.ed25519_verified,
        code: c.ed25519_verified ? "signature_valid" : "signature_invalid",
        detail: c.ed25519_verified ? `VALID — Ed25519 verifies over the canonical attestation under ${c.key}.` : `INVALID — the attestation signature does not verify under ${c.key}.`,
      });
      if (!c.ed25519_verified) reasons.push("signature_invalid");
    }
    if (!c.content_id_matches) reasons.push("content_id_mismatch");
  }
  const state: "VALID" | "INVALID" | "UNCHECKABLE" = c.state === "VALID" ? "VALID" : c.state === "UNSIGNED" || c.state === "UNCHECKABLE" ? "UNCHECKABLE" : "INVALID";
  return { state, family: CORRECTIONS_LEDGER_SCHEMA, id: attested ?? c.recomputed_content_id, reasons, checks, ledger_signature_state: c.state };
}

type Verdict = {
  state: "VALID" | "INVALID" | "UNCHECKABLE";
  family: string | null;
  id: string | null;
  reasons: string[];
  checks: { check: string; ok: boolean | null; code: string; detail: string }[];
  [extra: string]: unknown;
};

/**
 * Same verdict path for every caller: public root → publicRootVerify; corrections ledger → the
 * ledger's own checkSignature; card-v0/v1 leaves → verifyCardV0; everything else → cardVerify.
 */
async function cryptographicVerdict(card: unknown, rawText: string | null, origin: string): Promise<Verdict> {
  if (isPublicRoot(card)) return { ...(await verifyPublicRoot(card)) };
  if (isCorrectionsLedger(card)) return { ...(await verifyCorrectionsLedger(card)) };
  if (isCardV0(card)) return { ...(await verifyCardV0(card, rawText)) };
  const v = await verifyCard(card, await liveAnchors(origin));
  return {
    state: cardState(v.valid, v.reasons),
    family: v.family ?? null,
    id: v.id ?? null,
    reasons: v.reasons,
    checks: v.checks.map((c) => ({ check: c.label, ok: c.ok, code: c.code, detail: c.detail })),
  };
}

export type PublicState = "VALID" | "INVALID" | "UNCHECKABLE" | "WITHDRAWN" | "SUPERSEDED";

/** Families that are not cards and have no row in the withdrawal ledgers. */
const NOT_A_CARD = new Set<string | null>([PUBLIC_ROOT_KIND, CORRECTIONS_LEDGER_SCHEMA, "unknown", null]);

/**
 * The cryptographic result plus the publication status, kept as separate facts:
 *   cryptographic_state — VALID / INVALID / UNCHECKABLE, from the family's own rule, unchanged;
 *   status              — LIVE / WITHDRAWN / SUPERSEDED / UNCHECKED, from the ledgers;
 *   state               — what a caller reading one field should act on: WITHDRAWN or SUPERSEDED
 *                         when the signature is VALID and the ledger retires the id; otherwise the
 *                         cryptographic state. A crypto failure wins — a tampered withdrawn card is
 *                         INVALID — and an unreadable ledger is UNCHECKED, never LIVE.
 */
async function verdictFor(card: unknown, rawText: string | null, origin: string) {
  const v = await cryptographicVerdict(card, rawText, origin);
  const cryptographic_state = v.state;
  if (NOT_A_CARD.has(v.family) || typeof v.id !== "string" || !v.id) {
    return { ...v, cryptographic_state, state: cryptographic_state as PublicState, status: null as null, withdrawal: null, supersession: null, status_unchecked: [] as string[] };
  }
  const st: StatusVerdict = statusFor(v.id, await readStatusLedgers(origin), origin);
  const checks = [...v.checks];
  const reasons = [...v.reasons];
  if (st.status === "WITHDRAWN") {
    checks.push({ check: "Publication status", ok: false, code: "status_withdrawn", detail: `WITHDRAWN — ${st.withdrawal?.ledger} lists this id${st.withdrawal?.withdrawn_at ? ` (withdrawn ${st.withdrawal.withdrawn_at}` : ""}${st.withdrawal?.correction_id ? `, ${st.withdrawal.correction_id})` : st.withdrawal?.withdrawn_at ? ")" : ""}. The bytes are still served and the signature is unchanged; the estate no longer stands behind the measurement.` });
    reasons.push("withdrawn");
  } else if (st.status === "SUPERSEDED") {
    const by = st.supersession?.superseded_by;
    checks.push({ check: "Publication status", ok: false, code: "status_superseded", detail: `SUPERSEDED ${by ? `by ${by.slice(0, 16)}…` : "with no replacement named"}${st.supersession?.superseded_at ? ` on ${st.supersession.superseded_at}` : ""}${st.supersession?.reason ? ` (${st.supersession.reason.slice(0, 120)})` : ""} — ${by ? "read the replacement, not this card" : "this card is retired"}.` });
    reasons.push("superseded");
  } else if (st.status === "LIVE") {
    checks.push({ check: "Publication status", ok: true, code: "status_live", detail: "LIVE — neither WITHDRAWN.jsonl nor SUPERSEDED.jsonl names this id." });
  } else {
    checks.push({ check: "Publication status", ok: null, code: "status_unchecked", detail: `UNCHECKED — ${st.unchecked.join("; ")}. The status is unknown, not LIVE; the cryptographic verdict stands on its own.` });
  }
  const state: PublicState = cryptographic_state === "VALID" && (st.status === "WITHDRAWN" || st.status === "SUPERSEDED") ? st.status : cryptographic_state;
  return { ...v, checks, reasons, cryptographic_state, state, status: st.status, withdrawal: st.withdrawal, supersession: st.supersession, status_unchecked: st.unchecked };
}

/** Extra fields a family's rule returns beside the common verdict (root components, ledger state). */
function familyExtras(v: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of ["components", "as_of", "card_count", "ledger_signature_state"]) if (k in v) out[k] = v[k];
  return out;
}

function noteFor(state: PublicState, v: { status?: string | null }) {
  switch (state) {
    case "VALID":
      return "The body reproduces its own id and the signature verifies under a published key. A verified measurement card — not a certification of anything.";
    case "WITHDRAWN":
      return "The signature verifies (cryptographic_state VALID) but the estate has WITHDRAWN this card: see `withdrawal` for when, why and the correction. Do not quote it as a measurement.";
    case "SUPERSEDED":
      return "The signature verifies (cryptographic_state VALID) but a later card SUPERSEDES this one: see `supersession.superseded_by`. Read the replacement.";
    case "UNCHECKABLE":
      return "The check could not be completed for the stated reason. UNCHECKABLE is not INVALID: nothing was judged.";
    default:
      return v.status === "WITHDRAWN" || v.status === "SUPERSEDED"
        ? `This record fails the published rule for the stated reason, and the ledger also marks it ${v.status}. INVALID is a positive finding; the cryptographic failure takes precedence.`
        : "This record fails the published rule for the stated reason. INVALID is a positive finding, distinct from UNCHECKABLE.";
  }
}

const RECORD_URL_RE = /^https:\/\/(councilof\.ai|csoai\.org|www\.csoai\.org)\//;
const RECORD_MAX_BYTES = 5 * 1024 * 1024;

/**
 * GET /api/verify?record_url=<https://councilof.ai/… or https://csoai.org/…> — re-fetch a published
 * CSOAI record, sha256 the exact bytes served, and verify its signature. Free, like every path of
 * this endpoint: it imports nothing from the x402 rail and never answers 402. Only the estate's own
 * origins are fetched (the host allowlist is the SSRF guard here); a record that redirects off
 * them is not read.
 */
async function verifyRecordUrl(recordUrl: string, origin: string): Promise<Response> {
  const base = { schema: "csoai.verify/0.1", record_url: recordUrl, free: true, not_a_certification: true };
  if (!RECORD_URL_RE.test(recordUrl)) {
    return json({ ...base, state: "UNCHECKABLE", reason: "only https://councilof.ai/ and https://csoai.org/ records are fetched by this endpoint; POST other records as JSON", fetched: null }, 400);
  }
  let res: Response;
  try {
    res = await fetch(recordUrl, { headers: { accept: "application/json" }, redirect: "follow", signal: AbortSignal.timeout(15000) });
  } catch (e) {
    return json({ ...base, state: "UNCHECKABLE", reason: `the record could not be fetched (${(e as Error).name || "error"})`, fetched: null }, 502);
  }
  if (res.url && !RECORD_URL_RE.test(res.url)) {
    return json({ ...base, state: "UNCHECKABLE", reason: `the record redirected off the estate's origins (${res.url}); not read`, fetched: { http_status: res.status, final_url: res.url } }, 400);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  const fetched = { http_status: res.status, final_url: res.url || recordUrl, bytes: buf.byteLength, sha256: await sha256Hex(buf) };
  if (!res.ok) return json({ ...base, state: "UNCHECKABLE", reason: `fetching the record returned HTTP ${res.status}`, fetched }, 200);
  if (buf.byteLength > RECORD_MAX_BYTES) return json({ ...base, state: "UNCHECKABLE", reason: `record is ${buf.byteLength} bytes, over the ${RECORD_MAX_BYTES}-byte cap`, fetched }, 200);
  const text = new TextDecoder().decode(buf);
  let card: unknown;
  try { card = JSON.parse(text); } catch { return json({ ...base, state: "UNCHECKABLE", reason: "the record is not JSON", fetched }, 200); }
  const v = await verdictFor(card, text, origin);
  return json({
    ...base,
    fetched,
    state: v.state,
    cryptographic_state: v.cryptographic_state,
    status: v.status,
    family: v.family,
    id: v.id,
    reason: v.state === "VALID" ? null : v.reasons.join(", "),
    reasons: v.reasons,
    checks: v.checks,
    withdrawal: v.withdrawal,
    supersession: v.supersession,
    ...familyExtras(v),
    rule: `${origin}/signed/HOW-TO-VERIFY.md`,
    trust_anchor: "pinned in functions/_lib/cardVerify.ts (PINNED_ANCHORS) — no key resolution decides this verdict",
    note: `fetched.sha256 is the digest of the exact bytes served at record_url on this request; the verdict is about the record those bytes carry. ${noteFor(v.state, v)} Verification is free, forever. It certifies nothing.`,
  });
}

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204, headers: CORS });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const u = new URL(request.url);
  const recordUrl = u.searchParams.get("record_url");
  if (recordUrl !== null) return verifyRecordUrl(recordUrl.trim(), u.origin);
  return json({
    schema: "csoai.verify/0.1",
    endpoint: "/api/verify",
    how: "POST the card as JSON (the body itself, or {\"card\": …}), or POST {\"card\": \"https://councilof.ai/signed/cards/<sha>.json\"}",
    also_reads: "csoai.signed-run/0.1 signed evidence records (POST the signed document itself). The door checks the signature over the canonical payload; compare sha256 of the record you hold with artifact.sha256 in the answer.",
    states: {
      VALID: "the body reproduces its own id and the signature verifies under a pinned key, and no ledger retires the id",
      INVALID: "a positive finding — the record fails the published rule, with the reason named. A cryptographic failure wins over any status",
      UNCHECKABLE: "the input was not a record this endpoint could read, or a component could not be checked (named in checks)",
      WITHDRAWN: "the signature verifies (cryptographic_state VALID) but /interop/mill-cards-signed/WITHDRAWN.jsonl withdraws the card; `withdrawal` carries withdrawn_at, reason and the correction id",
      SUPERSEDED: "the signature verifies (cryptographic_state VALID) but /interop/mill-cards-signed/SUPERSEDED.jsonl names a replacement; `supersession.superseded_by` is the card to read",
    },
    status: {
      field: "status — the publication status of a card id, a separate fact from cryptographic_state",
      values: { LIVE: "neither ledger names the id", WITHDRAWN: "WITHDRAWN.jsonl names it", SUPERSEDED: "SUPERSEDED.jsonl names it", UNCHECKED: "a ledger could not be read; unknown is reported as unknown, never as LIVE" },
      not_applicable_to: [PUBLIC_ROOT_KIND, CORRECTIONS_LEDGER_SCHEMA],
    },
    families: {
      "gspc.measurement-card": "signed board/mill card (id + body + signature + did|pubkey)",
      "csoai.content-id-card": "content_id card (cross-border / axis-signal family)",
      "csoai.card-v0": "payload + sha256 + sig_ed25519 leaf (receipts, wrapper cards)",
      "csoai.card-v1": "whole-card leaf declaring digest_covers whole-card-except-sha256-and-sig_ed25519",
      "csoai.signed-run": "signed evidence record (census / probe pages)",
      [PUBLIC_ROOT_KIND]: "public/root.json — envelope signature over {kind, schema, as_of, merkle_root, card_count, did_intended}, plus the Merkle root recomputed from card_sha256[]; `components` reports each",
      [CORRECTIONS_LEDGER_SCHEMA]: "the corrections ledger (GET /api/corrections or its body) — content_id recomputed over the canonical body, detached Ed25519 attestation verified",
    },
    rule: new URL("/signed/HOW-TO-VERIFY.md", request.url).toString(),
    pinned_keys: PINNED_ANCHORS.map((a) => a.id),
    free: true,
    not_a_certification: true,
    record_url: "GET /api/verify?record_url=https://councilof.ai/<path>.json re-fetches a published record, sha256s the served bytes and verifies it",
    card_v0: "card-v0 leaves (payload + sha256 + sig_ed25519, e.g. RAS receipts) are verified over the canonical payload bytes under the pinned DID key",
    note: "Verification is free, forever. A valid card is a measurement, not a certification of anything.",
  });
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  const origin = new URL(request.url).origin;
  let body: unknown = null;
  let rawText: string | null = null;
  try { rawText = await request.text(); body = JSON.parse(rawText); } catch { body = null; }

  const b = (body ?? {}) as Record<string, unknown>;
  const raw = b.card ?? b.record ?? b.json ?? b.url ?? b.input ?? body;
  const { card, error } = await coerceCard(raw);
  if (error) {
    return json({
      schema: "csoai.verify/0.1",
      state: "UNCHECKABLE",
      reason: error,
      not_a_certification: true,
      note: "UNCHECKABLE is not INVALID: nothing was judged, because nothing readable was posted.",
    }, 400);
  }

  // Signed evidence records (the census and probe pages' "verify it yourself" block) are their own
  // family with the signer's own rule and a pinned key; see functions/_lib/signedRunVerify.ts.
  if (isSignedRun(card)) {
    const r = await verifySignedRunDoc(card);
    return json({
      schema: "csoai.verify/0.1",
      state: r.state,
      family: r.family,
      reason: r.state === "VALID" ? null : r.reasons.join(", "),
      reasons: r.reasons,
      checks: r.checks,
      did: r.did,
      payload_sha256: r.payload_sha256,
      artifact: r.artifact,
      trust_anchor: "pinned in functions/_lib/cardVerify.ts (PINNED_ANCHORS) — no key resolution decides this verdict",
      free: true,
      not_a_certification: true,
      note: r.state === "VALID"
        ? "The signature verifies over the canonical payload under a pinned key. It proves who signed these bytes, not that any claim inside is true. Compare sha256 of the record with artifact.sha256."
        : r.state === "UNCHECKABLE"
          ? "The check could not be completed for the stated reason. UNCHECKABLE is not INVALID: nothing was judged."
          : "This signed record fails the published rule for the stated reason. INVALID is a positive finding, distinct from UNCHECKABLE.",
    });
  }

  // Derive the three-state verdict from the shared module's own rule (or the card-v0 rule), so
  // this endpoint cannot paint "could not check" as INVALID.
  const v = await verdictFor(card, typeof raw === "string" ? raw : rawText, origin);
  const state = v.state;
  return json({
    schema: "csoai.verify/0.1",
    state,
    cryptographic_state: v.cryptographic_state,
    status: v.status,
    id: v.id ?? null,
    family: v.family ?? null,
    reason: state === "VALID" ? null : v.reasons.join(", "),
    reasons: v.reasons,
    checks: v.checks,
    withdrawal: v.withdrawal,
    supersession: v.supersession,
    ...familyExtras(v),
    rule: `${origin}/signed/HOW-TO-VERIFY.md`,
    trust_anchor: "pinned in functions/_lib/cardVerify.ts (PINNED_ANCHORS) — no key resolution decides this verdict",
    free: true,
    not_a_certification: true,
    note: noteFor(state, v),
  });
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
