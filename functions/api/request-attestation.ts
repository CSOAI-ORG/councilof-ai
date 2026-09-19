/**
 * GET /api/request-attestation — Tier 1: commission a signed card for a subject (× optional axis).
 *
 * Sell path: pay-to-recompute / re-attest per request — never a rank, never a certificate,
 * never a score. Lid: 22 axes · 14 fleets · 3 public leaders · 8 fact runs.
 *
 *   free   GET ?subject=<id>[&axis=<slug>]            → 402 challenge + a FREE PREVIEW of what
 *                                                        already exists for that subject (signed
 *                                                        cards, re-serve availability).
 *   paid   same URL + X-PAYMENT (facilitator-settled)   → ONE card-v0 leaf, surface ras.commission:
 *                                                        signed with #board-attestation-1 when the
 *                                                        Pages key is present, else sig_ed25519:null
 *                                                        with "sig_ed25519" in unmeasured[]. ≤3KB.
 *
 * What the buyer gets: the commission receipt (their settle tx cited in source_urls), references
 * to at most 24 signed measurement cards whose model field contains the requested subject text
 * (reserve_count reports the full match count), and an honest `fresh_run` state. A payment NEVER
 * mints a MEASURED cell; fresh cells appear only when a published run exists. Root inclusion of
 * the receipt is the public-root workflow's job (one writer) — listed in unmeasured[] until then.
 *
 * Bazaar: declares extensions.bazaar (info + schema) — the conformant discovery block. No
 * `discoverable: true` (not in the spec; x402 #2112 / #2207).
 */
import {
  verifyX402Payment,
  x402Accepts,
  buildPaymentRequiredV2,
  declareBazaarHttpGet,
  paymentRequiredResponseSigned,
  hasPaymentHeader,
  CSOAI_LID,
  type X402Env,
} from "./_x402";
import { railMode } from "./_x402_config";
import { REQUEST_ATTESTATION_DESCRIPTION } from "./_x402_descriptions";
import { AXES } from "./_axis_register";
import { AXES_A } from "./_gspc_axes_a";
import { AXES_B } from "./_gspc_axes_b";
import { signPayload, cardV0, canonicalBytes, PAYLOAD_CAP_BYTES } from "../_lib/cardSign";
import { classifyCommissionTarget } from "./_commission_target";
import { acknowledgeCommission, queueConfigured, ACK_LIMITS } from "./_commission_ack";

type Env = X402Env & { BOARD_SIGN_KEY_PKCS8_B64?: string; REVENUE_KV?: KVNamespace };

type Cell = { model: string; axis: string; card: string; card_url: string; signed: boolean; created?: string };



const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      ...extraHeaders,
    },
  });

const SUBJECT_RE = /^[A-Za-z0-9._:/@+-]{1,120}$/;
const AXIS_RE = /^[a-z0-9-]{1,48}$/;

/** Signed measurement cards already on file for this subject (× axis). Read, never typed. */
async function reserveFor(origin: string, subject: string, axis: string): Promise<{ cells: Cell[]; as_of: string | null; source: string }> {
  const src = new URL("/signed/card-matrix.json", origin).toString();
  try {
    const r = await fetch(src);
    if (!r.ok) return { cells: [], as_of: null, source: `${src} HTTP ${r.status}` };
    const m = (await r.json()) as { as_of?: string; cells?: Cell[] };
    const s = subject.toLowerCase();
    const cells = (m.cells || []).filter(
      (c) => c.signed && String(c.model || "").toLowerCase().includes(s) && (!axis || c.axis === axis),
    );
    return { cells, as_of: m.as_of || null, source: src };
  } catch (e) {
    return { cells: [], as_of: null, source: `${src} unreadable: ${(e as Error).message}` };
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;

  const subject = (url.searchParams.get("subject") || "").trim();
  const axis = (url.searchParams.get("axis") || "").trim().toLowerCase();

  if (["subject","axis"].some(k => url.searchParams.getAll(k).length > 1)) {
    return json({schema:"csoai.request-attestation/0.2",error:"ambiguous_query",reason:"Use exactly one subject and one axis."},400);
  }
  const resource = new URL("/api/request-attestation", origin);
  if (subject) resource.searchParams.set("subject",subject);
  if (axis) resource.searchParams.set("axis",axis);
  const resourceUrl = resource.toString();

  if (subject && !SUBJECT_RE.test(subject)) {
    return json({ schema: "csoai.request-attestation/0.2", error: "bad_request", reason: "subject: 1–120 chars of [A-Za-z0-9._:/@+-]" }, 400);
  }
  if (axis && !AXIS_RE.test(axis)) {
    return json({ schema: "csoai.request-attestation/0.2", error: "bad_request", reason: "axis: lowercase slug" }, 400);
  }
  // Validate the paid request before touching the facilitator. A missing subject used to reach
  // /verify and /settle first, then return 400 below — charging for an undeliverable commission.
  if (hasPaymentHeader(request) && !subject) {
    return json({ schema: "csoai.request-attestation/0.2", error: "bad_request", reason: "pass subject=<id> (and optional axis=) before presenting payment", lid: CSOAI_LID }, 400);
  }
  const knownAxis = axis ? AXES.some(a => a.axis === axis) || [...AXES_A,...AXES_B].some(a => a.kind === "model-comparison" && a.axis === axis) : null;
  // Typed contract: classify before admit. Ambiguous subjects never reach /verify|/settle.
  const targetEarly = subject ? classifyCommissionTarget(subject) : null;
  if (hasPaymentHeader(request) && targetEarly && !targetEarly.admit) {
    return json({
      schema: "csoai.request-attestation/0.2",
      error: "bad_request",
      reason: targetEarly.reason,
      subject,
      subject_kind: targetEarly.subject_kind,
      fulfillment: targetEarly.fulfillment,
      model: targetEarly.model,
      bank: targetEarly.bank,
      lid: CSOAI_LID,
    }, 400);
  }

  if (axis && !knownAxis) {
    return json({schema:"csoai.request-attestation/0.2",error:"unknown_axis",axis,settlement_attempted:false},400);
  }
  if (hasPaymentHeader(request) && !queueConfigured(env.REVENUE_KV)) {
    return json({schema:"csoai.request-attestation/0.2",error:"queue_unavailable",settlement_attempted:false,
      reason:"No usable commission store is configured. Payment must not be settled for unrecordable work."},503);
  }

  const description = REQUEST_ATTESTATION_DESCRIPTION;
  const accepts = x402Accepts(env, resourceUrl, { skuId: "request_attestation", tier: "per_request", description });
  const payment = await verifyX402Payment(request, env, resourceUrl, accepts[0]);

  // The free preview is the same whether or not the caller pays: what already exists.
  const reserve = subject ? await reserveFor(origin, subject, axis) : { cells: [], as_of: null, source: "no subject given" };
  const preview = {
    commission_store: queueConfigured(env.REVENUE_KV) ? "CONFIGURED_NOT_EXECUTION_PROOF" : "UNAVAILABLE",
    queue_binding_configured: queueConfigured(env.REVENUE_KV),
    execution_readiness: "NOT_ESTABLISHED_BY_THIS_PREVIEW",
    subject: subject || null,
    axis: axis || null,
    axis_known: knownAxis,
    signed_cards_on_file: reserve.cells.length,
    cards: reserve.cells.slice(0, 40).map((c) => ({ axis: c.axis, card: c.card, card_url: c.card_url })),
    corpus_as_of: reserve.as_of,
    read_from: reserve.source,
    free_preview: `${origin}/api/request-attestation?subject=<id>`,
        free_verify: `${origin}/gspc-verify`,
    free_board: `${origin}/api/gspc`,
  };

  if (!payment.ok) {
    const paymentRequired = buildPaymentRequiredV2({
      resourceUrl,
      description,
      serviceName: "CSOAI Request Attest",
      tags: ["attestation", "ras", "measurement", "x402"],
      accepts,
      bazaar: declareBazaarHttpGet({
        method: "GET",
        queryParams: { subject: subject || "model-or-subject-id", ...(axis ? { axis } : {}) },
        queryParamsSchema: {
          properties: {
            subject: { type: "string", description: "Subject to commission (model id, instrument id, or card sha)" },
            axis: { type: "string", description: "Optional axis slug; omit for the subject-level commission" },
          },
          required: ["subject"],
        },
        outputExample: {
          schema: "https://councilof.ai/schema/card-v0.json",
          surface: "ras.commission",
          subject: "model-or-subject-id",
          payload: { status: "COMMISSIONED", reserve: [], fresh_run: "UNMEASURED" },
          sig_ed25519: "<hex or null>",
          unmeasured: ["root_inclusion"],
        },
      }),
      csoai: {
        schema: "csoai.request-attestation/0.2",
        per: "request",
        lid: CSOAI_LID,
        never: ["rank", "certificate", "grade", "score-sale"],
        deliverable: description,
        preview,
        rail: railMode(env),
        not_paid_reason: payment.reason,
        catalog: `${origin}/api/x402`,
        explainer: `${origin}/pricing`,
      },
    });
    return paymentRequiredResponseSigned(paymentRequired, env);
  }

  // Paid path — issue the commission receipt. Never a score. `subject` was validated before
  // verify/settle above, so this branch cannot charge and then discover an invalid request.
  const as_of = new Date().toISOString();
  const tx = payment.settlement?.transaction || null;
  const source_urls = [
    resourceUrl,
    ...(tx ? [`https://basescan.org/tx/${tx}`] : []),
    reserve.source.startsWith("http") ? reserve.source : `${origin}/signed/card-matrix.json`,
  ];
  const target = targetEarly ?? classifyCommissionTarget(subject);
  const ack = await acknowledgeCommission(env.REVENUE_KV!,subject,axis,target,payment.settlement || {},as_of);
  if (ack.state !== "QUEUE_READBACK_CONFIRMED") {
    return json({schema:"csoai.request-attestation/0.2",state:"SETTLED_QUEUE_UNCONFIRMED",
      settlement:payment.settlement || null,payment_settled:ack.state === "SETTLEMENT_ID_MISSING" ? null : true,
      settlement_state:ack.state === "SETTLEMENT_ID_MISSING" ? "UNCONFIRMED_MISSING_ID" : "REPORTED_SETTLED",enqueued:null,queue_ack:ack,
      retry_payment:false,reason:"Payment was reported settled but queue acceptance is not confirmed. Preserve this response for reconciliation; do not automatically pay again.",
      execution:"NOT_OBSERVED",delivery:"NOT_OBSERVED",limits:ACK_LIMITS},202,
      payment.paymentResponse ? {"x-payment-response":payment.paymentResponse} : {});
  }
  const queue_ref = `${origin}/api/commission-queue`;

  const payload: Record<string, unknown> = {
    status: target.fulfillment === "QUEUED" ? "COMMISSIONED" : "RECEIPT_ONLY",
    subject,
    subject_kind: target.subject_kind,
    model: target.model,
    bank: target.bank,
    fulfillment: target.fulfillment,
    enqueued: target.fulfillment === "QUEUED",
    commission_id: ack.commission_id,
    request_scope_sha256: ack.scope_sha256,
    queue_ack: ack.state,
    queue: "commission",
    queue_ref,
    axis: axis || null,
    axis_known: knownAxis,
    settle: { network: payment.settlement?.network || null, transaction: tx, payer: payment.settlement?.payer || null },
    reserve: reserve.cells.slice(0, 24).map((c) => ({ axis: c.axis, card: c.card })),
    reserve_count: reserve.cells.length,
    reserve_returned: Math.min(reserve.cells.length, 24),
    reserve_limit: 24,
    fresh_run: "UNMEASURED",
    never: ["rank", "certificate", "grade"],
    lid: CSOAI_LID,
  };
  let leaf;
  try {
    // Keep the full match count, but fit references within the existing card atom.
    // Drop only displayed references, never underlying evidence or a count silently.
    const refs = payload.reserve as Array<{axis:string;card:string}>;
    while (refs.length && canonicalBytes(payload).byteLength > PAYLOAD_CAP_BYTES) {
      refs.pop(); payload.reserve_returned = refs.length;
    }
    leaf = await signPayload(payload, env.BOARD_SIGN_KEY_PKCS8_B64);
  } catch (e) {
    return json({schema:"csoai.request-attestation/0.2",state:"QUEUE_ACCEPTED_RECEIPT_UNAVAILABLE",queue_ack:ack,
      enqueued:ack.enqueued,settlement:payment.settlement || null,retry_payment:false,
      execution:"NOT_OBSERVED",delivery:"NOT_OBSERVED",reason:"The queue accepted this request but the receipt could not be assembled. Reconcile this commission id; do not automatically pay again."},202,
      payment.paymentResponse ? {"x-payment-response":payment.paymentResponse} : {});
  }
  const card = cardV0({
    surface: "ras.commission",
    subject,
    as_of,
    source_urls,
    payload,
    leaf,
    tags: ["rail:x402", "sku:request_attestation"],
    unmeasured: ["fresh_run_schedule"],
  });

  // The queue write/readback occurred before claiming acceptance. Receipt indexing and
  // telemetry are independent; failures here cannot erase or downgrade the observed job.
  let receipt_indexed = false;
  try {
    await env.REVENUE_KV!.put(`ras:${leaf.sha256}`, JSON.stringify({subject,axis:axis || null,tx,
      as_of,queued_at:ack.as_of,enqueued:target.fulfillment === "QUEUED",commission_id:ack.commission_id,
      request_scope_sha256:ack.scope_sha256,queue_ack:ack.state,queue:"commission",
      subject_kind:target.subject_kind,model:target.model,bank:target.bank,fulfillment:target.fulfillment}));
    receipt_indexed = true;
  } catch { /* explicitly reported below, not confused with queue acceptance */ }

  // Preserve the existing issuance metric, but never let its best-effort KV
  // read/modify/write decide whether a request reached the queue.
  let issuance_counter = ack.reused ? "NOT_UPDATED_REUSED_INTENT" : "NOT_UPDATED";
  if (!ack.reused && receipt_indexed) {
    try {
      const raw = await env.REVENUE_KV!.get("count:issuances");
      const count = raw === null ? 0 : /^\d+$/.test(raw) ? Number(raw) : NaN;
      if (!Number.isSafeInteger(count) || count < 0 || count >= Number.MAX_SAFE_INTEGER) {
        issuance_counter = "INVALID_EXISTING_COUNTER";
      } else {
        await env.REVENUE_KV!.put("count:issuances", String(count + 1));
        issuance_counter = "BEST_EFFORT_UPDATED_NOT_TRANSACTIONAL";
      }
    } catch { issuance_counter = "UPDATE_UNCONFIRMED"; }
  }

  return json(
    { card, queue_ack:ack,receipt_indexed,issuance_counter,execution:"NOT_OBSERVED",delivery:"NOT_OBSERVED",limits:ACK_LIMITS, verify: `${origin}/gspc-verify`, signed: !!leaf.sig_ed25519, unsigned_reason: leaf.unsigned_reason, bytes: leaf.bytes, note: "Commission receipt. Not a grade, not a rank, not a certificate. Root inclusion follows the public-root workflow." },
    200,
    payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {},
  );
};

/** Gold-402's gate POSTs {}. Query string still selects the paid tier; body is ignored. */
export const onRequestPost = onRequestGet;
