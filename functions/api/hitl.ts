// functions/api/hitl.ts — the human-in-the-loop surface.
//
//   GET  /api/hitl                 the oversight state: policy, gates, modules, counts
//   GET  /api/hitl/modules         the competency curriculum, derived from the live board
//   GET  /api/hitl/modules/<id>    one module
//   GET  /api/hitl/challenges      what is waiting for a human
//   GET  /api/hitl/record          the receipts
//   POST /api/hitl/challenge       raise a challenge
//   POST /api/hitl/modules         answer a module (the competency check)
//   POST /api/hitl/decision        record a decision (APPROVED | HOLD | REJECTED)
//
// THE SHAPES ARE THE MEOK H.I.M. SHAPES.
//
//   POST /api/hitl/modules   -> { ok, correct, module_id, axis, correct_option, explanation,
//                                     oversight_gate_unlocked }
//   POST /api/hitl/decision  -> { ok, blocked_by_competency_gate, reason } and, on success,
//                                     { receipt } whose schema is csoai.hitl-oversight-receipt/0.1
//
// A reader of the MEOK H.I.M. surface reads this one without translation.
//
// THE DECISION PATH IS LOCKED UNTIL AN OPERATOR TOKEN EXISTS.
//
// A public endpoint that accepts an APPROVE with no shared secret is not a human in the loop —
// it is a stranger in the loop, with a signature attached. So POST /api/hitl/decision requires
// HITL_DECIDE_TOKEN, and when that is not configured the endpoint refuses and says which
// variable to set. Everything else here works without it.
//
// COUNTS ARE DERIVED. The module list comes from the live board on every request. The
// decision counts come from the persisted ledger, and when there is no ledger the surface says
// so rather than publishing a zero that reads like a fact about the world.

import { loadBoard } from "./_chatCanon";
import { headFromGet } from "./_head";
import {
  HITL_CHALLENGE_SCHEMA,
  HITL_DECISIONS,
  HITL_POLICY,
  HITL_RECEIPT_SCHEMA,
  HITL_STATE_SCHEMA,
  buildChallenge,
  buildReceipt,
  checkAnswer,
  decisionCounts,
  decisionPathOpen,
  deriveModule,
  deriveModules,
  handlesSensitiveData,
  hitlStore,
  listChallenges,
  listCompletedModules,
  listReceipts,
  markModuleCompleted,
  moduleAxisId,
  operatorTokenOk,
  publicModule,
  putChallenge,
  putReceipt,
  requestsSensitiveData,
  signingKeyConfigured,
  verifyChallenge,
  type HitlChallenge,
  type HitlDecision,
  type HitlEnv,
  type HitlReceipt,
} from "./_hitl";

const CORS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization, X-HITL-Token",
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS });

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS, ...extra },
  });
}

/**
 * The operator token, from the header.
 *
 * Headers, not the body: a body gets logged and echoed. `x-hitl-token` and a bearer
 * `authorization` header are both accepted, because different clients reach for different ones.
 */
function presentedToken(request: Request): string | null {
  const direct = request.headers.get("x-hitl-token");
  if (direct && direct.trim()) return direct.trim();
  const auth = request.headers.get("authorization");
  if (auth && /^bearer\s+/i.test(auth)) return auth.replace(/^bearer\s+/i, "").trim();
  return null;
}

/** The receipt as it is published. Everything the signer published, nothing hidden. */
function publicReceipt(r: HitlReceipt): Record<string, unknown> {
  return {
    schema: r.schema,
    policy: r.policy,
    at: r.at,
    operator: r.operator,
    axis: r.axis,
    decision: r.decision,
    note: r.note,
    competency_verified: r.competency_verified,
    completed_modules: r.completed_modules,
    module_id: r.module_id,
    challenge: r.challenge,
    signature: r.signature,
    verification:
      r.signature.value_hex
        ? "This receipt is signed under the Council's board attestation key. Verify it against the published DID document — the same key and the same rule that verify every published card leaf."
        : `This receipt is UNSIGNED: ${r.signature.unsigned_reason}. An unsigned receipt is honest; it is not a fabricated signature.`,
  };
}

/** A challenge as it is published in the queue. The private source is not published. */
function publicChallenge(c: HitlChallenge, decided: boolean): Record<string, unknown> {
  return {
    id: c.id,
    axis: c.axis,
    subject: c.subject,
    proposed_action: c.proposed_action,
    raised_by: c.raised_by,
    at: c.at,
    state: decided ? "DECIDED" : "PENDING",
    required_module: c.required_module,
  };
}

/**
 * THE PUBLISHED ENDPOINT MAP. Every path named here is a door a reader may walk up to, so every
 * one of them must actually be routable — and it was not.
 *
 * WHY THIS MAP EXISTED WITHOUT THE DOORS. This file dispatched on the sub-path
 * (`/^\/api\/hitl\/?/` stripped off the pathname, then "modules" / "challenge" / "decision" /
 * "record"), and that dispatch was correct and complete. But a Cloudflare Pages Function is
 * reached by its own FILE, not by its pathname pattern: `functions/api/hitl.ts` answers
 * `/api/hitl` and nothing else. Every other path fell through to the platform's 404 before the
 * dispatch ever ran. So the human-in-the-loop path published its own curriculum, its own
 * endpoint map and its own decision machinery, and then 404'd on every one of them except the
 * first. A reader could see that a challenge could be raised, and could not raise one.
 *
 * The doors are the thin route files under `functions/api/hitl/`, each of which re-exports these
 * handlers. They are thin on purpose: the logic stays in one file, and the routing is what was
 * missing. `_published-endpoint-routes.test.ts` is the ratchet — it fails if this map ever names
 * a path with no route file behind it.
 */
export const HITL_ENDPOINTS = {
  state: "GET /api/hitl",
  modules: "GET /api/hitl/modules",
  answer_module: "POST /api/hitl/modules",
  challenge: "POST /api/hitl/challenge",
  decision: "POST /api/hitl/decision",
  record: "GET /api/hitl/record",
} as const;

export const onRequestGet: PagesFunction<HitlEnv> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const path = url.pathname.replace(/^\/api\/hitl\/?/, "");
  const origin = url.origin;

  const board = await loadBoard(origin);
  const store = hitlStore(ctx.env);
  const challenges = await listChallenges(store);
  const receipts = await listReceipts(store);
  const decidedIds = new Set(receipts.map((r) => r.challenge?.id).filter(Boolean));
  const completed = await listCompletedModules(store);

  // GET /api/hitl/modules/<id>
  const moduleMatch = path.match(/^modules\/([^/]+)$/);
  if (moduleMatch) {
    const mod = deriveModule(board, moduleAxisId(moduleMatch[1]));
    if (!mod) {
      return json(
        {
          error: "no such module",
          asked: moduleMatch[1],
          note: "The curriculum is derived from the live board's axis list. A module that is not there cannot be completed.",
        },
        404,
      );
    }
    return json({
      ...publicModule(mod, completed.includes(mod.id)),
      completed_modules: completed,
    });
  }

  // GET /api/hitl/modules
  if (path === "modules") {
    const modules = deriveModules(board);
    return json({
      schema: "csoai.hitl-curriculum/0.1",
      policy: HITL_POLICY,
      derived_from: "GET /api/gspc → axes[] (read live on every request)",
      count: modules.length,
      modules: modules.map((m) => publicModule(m, completed.includes(m.id))),
      note:
        "Each module is derived from its axis's own published record, so the curriculum cannot drift from what the Council publishes. The correct option is not published here; it is re-derived from the live board when the answer is checked.",
    });
  }

  // GET /api/hitl/challenges
  if (path === "challenges") {
    return json({
      schema: HITL_STATE_SCHEMA,
      policy: HITL_POLICY,
      store_bound: Boolean(store),
      count: challenges.length,
      challenges: challenges.map((c) => publicChallenge(c, decidedIds.has(c.id))),
      note:
        "A challenge is a consequential act that a staff member would not perform on its own. It waits for a human. " +
        "Challenges are public: the Council publishes what it is deciding, not only what it has decided. " +
        "A challenge never carries a credential — the door refuses one.",
    });
  }

  // GET /api/hitl/record
  if (path === "record") {
    return json({
      schema: "csoai.hitl-record/0.1",
      policy: HITL_POLICY,
      store_bound: Boolean(store),
      count: receipts.length,
      receipts: receipts.map(publicReceipt),
      note: store
        ? "Every decision recorded on this deployment, with its signature state."
        : "No decision store is bound to this deployment, so this is an empty ledger — which is not the same as 'no decision was ever taken'.",
    });
  }

  // GET /api/hitl — the oversight state.
  const modules = deriveModules(board);
  const counts = decisionCounts(challenges, receipts);
  return json({
    schema: HITL_STATE_SCHEMA,
    policy: HITL_POLICY,
    title: "Human in the loop",
    one_line:
      "A measurement says what was observed. It never says what should happen. The acts — publish, release, send, approve — wait for a competent, named human.",
    statutory_basis: "EU AI Act Art. 14 (human oversight) · Art. 4 (AI literacy) · ETSI EN 304 223 P11",
    decisions: [...HITL_DECISIONS],
    receipt_schema: HITL_RECEIPT_SCHEMA,
    challenge_schema: HITL_CHALLENGE_SCHEMA,
    review_queue_summary: counts,
    counts_are: store
      ? "the persisted ledger of this deployment"
      : "an empty ledger — no decision store is bound, so these zeros are not a claim that nothing was ever decided",
    store_bound: Boolean(store),
    decision_path: decisionPathOpen(ctx.env) ? "open" : "locked",
    decision_path_note: decisionPathOpen(ctx.env)
      ? "An operator token is configured. A decision requires it."
      : "No operator token is configured, so a decision cannot be taken on this deployment. This is deliberate: a public endpoint that accepts an approval from anyone is not a human in the loop.",
    operator_token_configured: decisionPathOpen(ctx.env),
    signing_key_configured: signingKeyConfigured(ctx.env),
    signature_did: signingKeyConfigured(ctx.env) ? "did:web:csoai.org#board-attestation-1" : null,
    modules: modules.map((m) => publicModule(m, completed.includes(m.id))),
    module_count: modules.length,
    completed_modules: completed,
    endpoints: HITL_ENDPOINTS,
    meok_note:
      "These are the MEOK H.I.M. shapes: the same receipt schema, the same decision vocabulary, the same competency gate. This surface does not call the MEOK H.I.M., because the MEOK H.I.M. runs on a private network this deployment cannot reach. The two are interoperable by shape.",
    never: ["certification", "a price", "an approval without a human", "a competence check that is not re-derived from the live record"],
  });
};

export const onRequestPost: PagesFunction<HitlEnv> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const path = url.pathname.replace(/^\/api\/hitl\/?/, "");
  const origin = url.origin;

  let body: any = {};
  try {
    const raw = await ctx.request.text();
    if (raw) body = JSON.parse(raw);
  } catch {
    return json({ error: "body was not JSON" }, 400);
  }

  // POST /api/hitl — a descriptor, not a write. Same pattern as GET /api/chat.
  if (path === "") {
    return json({
      post: "/api/hitl",
      note: "A descriptor, not a write.",
      paths: {
        challenge: "POST /api/hitl/challenge — raise a challenge for a human to decide.",
        modules: "POST /api/hitl/modules — answer a competency module ({ module_id, answer }).",
        decision:
          "POST /api/hitl/decision — record a decision ({ challenge, decision, operator, note, module_id, answer }). Requires the operator token.",
      },
      decisions: [...HITL_DECISIONS],
    });
  }

  const board = await loadBoard(origin);
  const store = hitlStore(ctx.env);

  // POST /api/hitl/challenge — raise one.
  if (path === "challenge") {
    const subject = String(body?.subject ?? "").trim();
    const action = String(body?.proposed_action ?? body?.action ?? "").trim();
    if (!subject || !action) {
      return json({ error: "subject and proposed_action are required" }, 400);
    }
    if (subject.length > 160 || action.length > 1200) {
      return json({ error: "subject or proposed_action is too long" }, 400);
    }
    // The Council does not ask a human for a credential, and it does not carry one into a
    // published record either.
    const sensitive =
      requestsSensitiveData(`${subject} ${action}`) ?? handlesSensitiveData(`${subject} ${action}`);
    if (sensitive) {
      return json(
        {
          error: "the challenge asks for sensitive data",
          sensitive,
          why:
            "A challenge is a published record. It never carries a password, an API key, a token or a payment credential — not even as a field for the human to fill in.",
        },
        422,
      );
    }

    const challenge = await buildChallenge({
      at: new Date().toISOString(),
      axis: typeof body?.axis === "string" && body.axis.trim() ? body.axis.trim() : null,
      subject,
      proposed_action: action,
      raised_by: String(body?.raised_by ?? "reader"),
      source: typeof body?.source === "string" ? body.source : null,
      facts: typeof body?.facts === "string" ? body.facts : null,
      required_module: null,
    });
    await putChallenge(store, challenge);
    return json(
      {
        ...challenge,
        stored: Boolean(store),
        note: store
          ? "Recorded and waiting for a human. The decision path needs the operator token and a competency check."
          : "Raised. No decision store is bound, so this challenge is not persisted — carry it to the decision endpoint.",
      },
      201,
    );
  }

  // POST /api/hitl/modules — the competency check.
  if (path === "modules") {
    const moduleId = String(body?.module_id ?? body?.module ?? "").trim();
    const answer = String(body?.answer ?? "").trim();
    if (!moduleId) return json({ error: "module_id is required" }, 400);

    const checked = checkAnswer(board, moduleId, answer);
    if (!checked.ok || !checked.module) {
      return json(
        {
          ok: false,
          correct: false,
          module_id: moduleId,
          reason: checked.reason ?? "That module cannot be completed.",
          note: "The curriculum is derived from the live board's axis list, so a module that is not on the board cannot be completed.",
        },
        404,
      );
    }

    const module = checked.module;
    const stored = await markModuleCompleted(store, module.id, {
      module_id: module.id,
      axis: module.axis,
      at: new Date().toISOString(),
      correct: checked.correct,
    });

    return json({
      ok: true,
      correct: checked.correct,
      module_id: module.id,
      axis: module.axis,
      correct_option: module.correct_option,
      explanation: module.explanation,
      oversight_gate_unlocked: checked.correct,
      recorded: stored,
      note: checked.correct
        ? "Correct. The decision endpoint re-checks this answer against the live record at the moment of signing, so a stale answer cannot pass."
        : "Not correct. The record says otherwise.",
    });
  }

  // POST /api/hitl/decision — the human decides.
  if (path === "decision") {
    if (!decisionPathOpen(ctx.env)) {
      return json(
        {
          ok: false,
          blocked_by_competency_gate: false,
          error: "the decision path is locked",
          why:
            "No operator token is configured (HITL_DECIDE_TOKEN), so no decision can be recorded on this deployment. This is deliberate: an approval endpoint anyone can call is not a human in the loop.",
          how: "Set HITL_DECIDE_TOKEN as a Pages Production environment variable, then send it as the x-hitl-token header.",
        },
        503,
      );
    }
    if (!operatorTokenOk(ctx.env, presentedToken(ctx.request))) {
      return json(
        {
          ok: false,
          error: "operator token not accepted",
          why: "A decision requires the operator token. It is read from the x-hitl-token header or a bearer authorization header — never from the body, because a body gets logged.",
        },
        401,
      );
    }

    const decision = String(body?.decision ?? "").trim().toUpperCase() as HitlDecision;
    if (!HITL_DECISIONS.includes(decision)) {
      return json(
        {
          ok: false,
          error: "decision must be APPROVED, HOLD or REJECTED",
          allowed: [...HITL_DECISIONS],
        },
        400,
      );
    }

    const challenge = body?.challenge as HitlChallenge | undefined;
    if (!challenge || typeof challenge !== "object" || !challenge.id) {
      return json({ ok: false, error: "challenge is required" }, 400);
    }
    if (!(await verifyChallenge(challenge))) {
      return json(
        {
          ok: false,
          error: "the challenge does not verify",
          why:
            "The challenge id is the hash of its own content. A challenge whose content does not hash to its id was changed after it was raised, and a human cannot decide on a record that moved.",
        },
        422,
      );
    }

    const moduleId = String(body?.module_id ?? "").trim();
    const answer = String(body?.answer ?? "").trim();
    const checked = checkAnswer(board, moduleId, answer);
    if (!checked.ok || !checked.module) {
      return json(
        {
          ok: false,
          blocked_by_competency_gate: true,
          reason: `Human-in-the-Loop Competency Gate: complete the module for this axis before signing an oversight decision. ${
            checked.reason ?? ""
          }`.trim(),
        },
        422,
      );
    }
    if (challenge.axis && checked.module.axis !== challenge.axis) {
      return json(
        {
          ok: false,
          blocked_by_competency_gate: true,
          reason: `Human-in-the-Loop Competency Gate: this challenge concerns the axis "${challenge.axis}", and the module answered was for "${checked.module.axis}". Complete the module for the axis under review.`,
        },
        422,
      );
    }
    if (!checked.correct) {
      return json(
        {
          ok: false,
          blocked_by_competency_gate: true,
          reason: `Human-in-the-Loop Competency Gate: the answer for module "${checked.module.id}" does not match the live published record. Complete the module before signing an oversight decision.`,
        },
        422,
      );
    }

    const operator = String(body?.operator ?? "").trim() || "the operator";
    const note = String(body?.note ?? "").trim();
    const completed = await listCompletedModules(store);

    const receipt = await buildReceipt({
      operator,
      axis: challenge.axis ?? checked.module.axis,
      decision,
      note: note || `Competency-verified human-in-the-loop decision (${checked.module.id})`,
      competency_verified: true,
      completed_modules: Array.from(new Set([...completed, checked.module.id])).sort(),
      module_id: checked.module.id,
      challenge,
      at: new Date().toISOString(),
      signingKey: ctx.env.BOARD_SIGN_KEY_PKCS8_B64,
    });

    await putReceipt(store, receipt);

    return json({
      ok: true,
      blocked_by_competency_gate: false,
      receipt: publicReceipt(receipt),
      note: receipt.signature.value_hex
        ? "Signed under the board attestation key. Verify it against the published DID document."
        : `Recorded, but UNSIGNED: ${receipt.signature.unsigned_reason}.`,
    });
  }

  return json({ error: "unknown path", known: ["POST /api/hitl/challenge", "POST /api/hitl/modules", "POST /api/hitl/decision"] }, 404);
};

/** HEAD answers what GET answers, with no body (functions/api/_head.ts). */
export const onRequestHead = headFromGet(onRequestGet);
