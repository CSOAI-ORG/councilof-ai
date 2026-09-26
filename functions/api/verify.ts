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
 */
import { verifyCard, cardState, PINNED_ANCHORS, type Anchor } from "../_lib/cardVerify";
import { isSignedRun, verifySignedRunDoc } from "../_lib/signedRunVerify";
import { verifyLeaf, canonicalBytes, sha256Hex } from "../_lib/cardSign";

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

/** A labelled cross-check only. It never decides a verdict; PINNED_ANCHORS do. */
async function liveAnchors(origin: string): Promise<Anchor[]> {
  try {
    const r = await fetch(`${origin}/.well-known/did.json`, { headers: { accept: "application/json" } });
    if (!r.ok) return [];
    const did = (await r.json()) as { verificationMethod?: { id?: string; publicKeyMultibase?: string }[] };
    return (did.verificationMethod ?? [])
      .filter((v) => v.id)
      .map((v) => ({ id: String(v.id), hex: "" }))
      .filter((a) => a.id) as Anchor[];
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

/**
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
 * failure the header above explains.
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
  const pin = PINNED_ANCHORS.find((a) => a.id === did);
  if (!pin) {
    checks.push({ check: "Signing key", ok: null, code: "key_not_pinned", detail: `${did || "(no did)"} is not in this verifier's offline pin set` });
    return { state: "UNCHECKABLE", family: "csoai.card-v0", id: rec.sha256, reasons: ["key_not_pinned"], checks };
  }
  const v = await verifyLeaf(rec.payload, rec.sha256.toLowerCase(), rec.sig_ed25519, pin.hex);
  checks.push({ check: "Signature", ok: v.sig_ok, code: v.sig_ok ? "signature_ok" : "signature_invalid", detail: v.sig_ok ? `Ed25519 verifies under pinned ${did}` : `Ed25519 does not verify under pinned ${did}` });
  return { state: v.sig_ok ? "VALID" : "INVALID", family: "csoai.card-v0", id: rec.sha256, reasons: v.sig_ok ? [] : ["signature_invalid"], checks };
}

/** Same verdict path for every caller: card-v0 → verifyCardV0; everything else → cardVerify. */
async function verdictFor(card: unknown, rawText: string | null, origin: string) {
  if (isCardV0(card)) return verifyCardV0(card, rawText);
  const v = await verifyCard(card, await liveAnchors(origin));
  return {
    state: cardState(v.valid, v.reasons),
    family: v.family ?? null,
    id: v.id ?? null,
    reasons: v.reasons,
    checks: v.checks.map((c) => ({ check: c.label, ok: c.ok, code: c.code, detail: c.detail })),
  };
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
    family: v.family,
    id: v.id,
    reason: v.state === "VALID" ? null : v.reasons.join(", "),
    reasons: v.reasons,
    checks: v.checks,
    rule: `${origin}/signed/HOW-TO-VERIFY.md`,
    trust_anchor: "pinned in functions/_lib/cardVerify.ts (PINNED_ANCHORS) — no key resolution decides this verdict",
    note: "fetched.sha256 is the digest of the exact bytes served at record_url on this request; the verdict is about the record those bytes carry. Verification is free, forever. It certifies nothing.",
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
      VALID: "the body reproduces its own id and the signature verifies under a pinned key",
      INVALID: "a positive finding — the card fails the published rule, with the reason named",
      UNCHECKABLE: "the input was not a card this endpoint could read",
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
    id: v.id ?? null,
    family: v.family ?? null,
    reason: state === "VALID" ? null : v.reasons.join(", "),
    reasons: v.reasons,
    checks: v.checks,
    rule: `${origin}/signed/HOW-TO-VERIFY.md`,
    trust_anchor: "pinned in functions/_lib/cardVerify.ts (PINNED_ANCHORS) — no key resolution decides this verdict",
    free: true,
    not_a_certification: true,
    note: state === "VALID"
      ? "The body reproduces its own id and the signature verifies under a published key. A verified measurement card — not a certification of anything."
      : state === "UNCHECKABLE"
        ? "The check could not be completed for the stated reason. UNCHECKABLE is not INVALID: nothing was judged."
        : "This card fails the published rule for the stated reason. INVALID is a positive finding, distinct from UNCHECKABLE.",
  });
};
