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
import { verifyCard, PINNED_ANCHORS, type Anchor } from "../_lib/cardVerify";

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

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204, headers: CORS });

export const onRequestGet: PagesFunction = async ({ request }) =>
  json({
    schema: "csoai.verify/0.1",
    endpoint: "/api/verify",
    how: "POST the card as JSON (the body itself, or {\"card\": …}), or POST {\"card\": \"https://councilof.ai/signed/cards/<sha>.json\"}",
    states: {
      VALID: "the body reproduces its own id and the signature verifies under a pinned key",
      INVALID: "a positive finding — the card fails the published rule, with the reason named",
      UNCHECKABLE: "the input was not a card this endpoint could read",
    },
    rule: new URL("/signed/HOW-TO-VERIFY.md", request.url).toString(),
    pinned_keys: PINNED_ANCHORS.map((a) => a.id),
    free: true,
    not_a_certification: true,
    note: "Verification is free, forever. A valid card is a measurement, not a certification of anything.",
  });

export const onRequestPost: PagesFunction = async ({ request }) => {
  const origin = new URL(request.url).origin;
  let body: unknown = null;
  try { body = await request.json(); } catch { body = null; }

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

  const v = await verifyCard(card, await liveAnchors(origin));
  return json({
    schema: "csoai.verify/0.1",
    state: v.valid ? "VALID" : "INVALID",
    id: v.id ?? null,
    family: v.family ?? null,
    reason: v.valid ? null : v.reasons.join(", "),
    reasons: v.reasons,
    checks: v.checks.map((c) => ({ check: c.label, ok: c.ok, code: c.code, detail: c.detail })),
    rule: `${origin}/signed/HOW-TO-VERIFY.md`,
    trust_anchor: "pinned in functions/_lib/cardVerify.ts (PINNED_ANCHORS) — no key resolution decides this verdict",
    free: true,
    not_a_certification: true,
    note: v.valid
      ? "The body reproduces its own id and the signature verifies under a published key. A verified measurement card — not a certification of anything."
      : "This card fails the published rule for the stated reason. INVALID is a positive finding, distinct from UNCHECKABLE.",
  });
};
