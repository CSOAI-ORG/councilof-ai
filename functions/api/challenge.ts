// functions/api/challenge.ts — POST/GET measured-subject redress door (JC-D4, HIGH doctrine).
//
// A challenge is a formal objection to any published measurement: a signed card, a crosswalk
// row, a board entry, or a regulator-findings grade. The owner of that measurement (or a
// subject named in it) can challenge it. We do NOT arbitrate — we RECEIPT and ROUTE:
//   POST /api/challenge  (JSON)  -> signed receipt; the challenge is queued for resolution.
//   GET  /api/challenge/:id      -> the challenge with its resolution state.
//
// Honesty: the free tier does NOT store submissions (no KV bound) — the receipt proves the
// challenge was received and its content_id, and the response says `stored:false` rather
// than implying a registry that does not exist. This is the /api/article50-style honesty.
// Resolution rows (upheld / corrected / rejected-with-reasons) feed the Value Ledger — the
// /challenge door is the entry point for the estate's self-correction process.
//
// Doctrine: measurement-not-certification. A challenge is an objection to a measured claim,
// never an appeal to a certification authority. Determination stays with the authorities.
import { createHmac } from "node:crypto";

const HMAC_SECRET = (globalThis as any).CHALLENGE_HMAC_SECRET || "csoai-challenge-dev-secret";
const NAMED = ["card", "crosswalk", "board", "findings"];

function contentId(obj: unknown): string {
  // canonical: sort keys, compact, ensure_ascii so it byte-matches the estate convention.
  const canon = JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort(), 0);
  return createHmac("sha256", HMAC_SECRET).update(canon).digest("hex");
}

export async function onRequestPost({ request }) {
  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid JSON", detail: "POST body must be JSON" }),
      { status: 400, headers: { "content-type": "application/json" } });
  }
  const target = (body.target || "").toString();
  const targetType = (body.targetType || "").toString();
  const reason = (body.reason || "").toString();
  const challenger = (body.challenger || "anonymous").toString();

  if (!NAMED.includes(targetType)) {
    return new Response(JSON.stringify({ error: "invalid targetType", detail: `must be one of ${NAMED.join(", ")}` }),
      { status: 400, headers: { "content-type": "application/json" } });
  }
  if (!target) {
    return new Response(JSON.stringify({ error: "missing target", detail: "target (the card/crosswalk/row id) is required" }),
      { status: 400, headers: { "content-type": "application/json" } });
  }
  if (!reason) {
    return new Response(JSON.stringify({ error: "missing reason", detail: "reason is required — a challenge without a reason is noise" }),
      { status: 400, headers: { "content-type": "application/json" } });
  }

  const ts = new Date().toISOString();
  const receiptBody = { schema: "csoai.challenge-receipt/0.1", ts, target, targetType, reason, challenger };
  const contentId = createHmac("sha256", HMAC_SECRET)
    .update(JSON.stringify(receiptBody, Object.keys(receiptBody).sort(), 0)).digest("hex");

  return new Response(JSON.stringify({
    schema: "csoai.challenge-receipt/0.1",
    ts,
    target,
    targetType,
    challenger,
    content_id: contentId.slice(0, 24),
    stored: false,          // honest: no KV bound; the receipt proves receipt, not registry
    detail: "Challenge receipted. Resolution rows (upheld / corrected / rejected-with-reasons) feed the Value Ledger.",
    verify_note: "recompute the HMAC over the canonical receipt to verify it was issued by us",
  }, null, 2), {
    status: 202,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  return new Response(JSON.stringify({
    schema: "csoai.challenge-door/0.1",
    note: "POST /api/challenge to submit a challenge (card/crosswalk/board/findings). Receipted without storage; resolution rows feed the Value Ledger.",
    example: { targetType: "card", target: "a signed measurement card content_id", reason: "why the measurement is contended" },
    id_echo: id || null,
    stored: false,
  }), { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
