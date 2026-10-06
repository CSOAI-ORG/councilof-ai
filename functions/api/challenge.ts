// functions/api/challenge.ts - POST/GET measured-subject redress door (JC-D4).
// Receipts challenges without implying a registry: nothing is persisted (stored:false), and the
// response says so in words, with the mailbox that does record a challenge.
// Do not import node:crypto - Pages Functions cannot publish that module.
import { headFromGet } from "./_head";

interface ChallengeEnv {
  CHALLENGE_HMAC_SECRET?: string;
}

const NAMED = ["card", "crosswalk", "board", "findings"];

// Said in every response while stored is false. Exported so the test holds the words.
export const NOT_RECORDED =
  "Not yet recorded: this endpoint issues a receipt and stores nothing. To have a challenge recorded and reviewed, email nicholas@csoai.org with the content_id.";

function canonical(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestPost: PagesFunction<ChallengeEnv> = async ({ request, env }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON", detail: "POST body must be JSON" }, { status: 400 });
  }
  const target = String(body.target || "");
  const targetType = String(body.targetType || "");
  const reason = String(body.reason || "");
  const challenger = String(body.challenger || "anonymous");

  if (!NAMED.includes(targetType)) {
    return Response.json(
      { error: "invalid targetType", detail: `must be one of ${NAMED.join(", ")}` },
      { status: 400 },
    );
  }
  if (!target) {
    return Response.json({ error: "missing target", detail: "target (card/crosswalk/row id) is required" }, { status: 400 });
  }
  if (!reason) {
    return Response.json({ error: "missing reason", detail: "reason is required" }, { status: 400 });
  }

  const ts = new Date().toISOString();
  const receiptBody = { schema: "csoai.challenge-receipt/0.1", ts, target, targetType, reason, challenger };
  const secret = env.CHALLENGE_HMAC_SECRET || "csoai-challenge-dev-secret";
  const cid = (await hmacHex(secret, canonical(receiptBody))).slice(0, 24);

  return Response.json(
    {
      schema: "csoai.challenge-receipt/0.1",
      ts,
      target,
      targetType,
      challenger,
      content_id: cid,
      stored: false,
      recorded: false,
      detail: NOT_RECORDED,
      verify_note: "recompute HMAC over canonical receipt to verify issuance",
    },
    { status: 202, headers: { "cache-control": "no-store" } },
  );
};

export const onRequestGet: PagesFunction = async ({ request }) => {
  const id = new URL(request.url).searchParams.get("id");
  return Response.json({
    schema: "csoai.challenge-door/0.1",
    note: `POST /api/challenge - card/crosswalk/board/findings. ${NOT_RECORDED}`,
    example: { targetType: "card", target: "signed measurement content_id", reason: "why contended" },
    id_echo: id,
    stored: false,
    recorded: false,
  }, { headers: { "cache-control": "no-store" } });
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
