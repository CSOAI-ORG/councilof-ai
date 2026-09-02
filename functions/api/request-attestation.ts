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
 * What the buyer gets: the commission receipt (their settle tx cited in source_urls), a re-serve
 * pointer to every signed measurement card that already exists for the subject/axis, and an
 * honest `fresh_run` state. A payment NEVER mints a MEASURED cell; fresh cells appear only when a
 * published run exists. Root inclusion of the receipt is the public-root workflow's job (one
 * writer) — listed in unmeasured[] until then.
 *
 * Bazaar: declares extensions.bazaar (info + schema) — the conformant discovery block. No
 * `discoverable: true` (not in the spec; x402 #2112 / #2207).
 */
import {
  verifyX402Payment,
  x402Accepts,
  buildPaymentRequiredV2,
  declareBazaarHttpGet,
  paymentRequiredResponse,
  CSOAI_LID,
  type X402Env,
} from "./_x402";
import { railMode } from "./_x402_config";
import { AXES } from "./_axis_register";
import { signPayload, cardV0 } from "../_lib/cardSign";

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
  const resourceUrl = new URL("/api/request-attestation", origin).toString();
  const subject = (url.searchParams.get("subject") || "").trim();
  const axis = (url.searchParams.get("axis") || "").trim().toLowerCase();

  if (subject && !SUBJECT_RE.test(subject)) {
    return json({ schema: "csoai.request-attestation/0.2", error: "bad_request", reason: "subject: 1–120 chars of [A-Za-z0-9._:/@+-]" }, 400);
  }
  if (axis && !AXIS_RE.test(axis)) {
    return json({ schema: "csoai.request-attestation/0.2", error: "bad_request", reason: "axis: lowercase slug" }, 400);
  }
  const knownAxis = axis ? AXES.some((a) => a.axis === axis) : null;

  const description =
    "Request attestation (RAS): commission a signed card-v0 receipt for one subject on the frozen bank — " +
    "re-serves existing signed measurement cards, never invents a score. Measurement, not certification. " +
    CSOAI_LID + ".";
  const accepts = x402Accepts(env, resourceUrl, { skuId: "request_attestation", tier: "per_request", description });
  const payment = await verifyX402Payment(request, env, resourceUrl, accepts[0]);

  // The free preview is the same whether or not the caller pays: what already exists.
  const reserve = subject ? await reserveFor(origin, subject, axis) : { cells: [], as_of: null, source: "no subject given" };
  const preview = {
    subject: subject || null,
    axis: axis || null,
    axis_known: knownAxis,
    signed_cards_on_file: reserve.cells.length,
    cards: reserve.cells.slice(0, 40).map((c) => ({ axis: c.axis, card: c.card, card_url: c.card_url })),
    corpus_as_of: reserve.as_of,
    read_from: reserve.source,
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
        deliverable: "one card-v0 leaf, surface ras.commission, ≤3KB payload, signed when the Pages key is present",
        preview,
        rail: railMode(env),
        not_paid_reason: payment.reason,
        catalog: `${origin}/api/x402`,
        explainer: `${origin}/pricing-free`,
      },
    });
    return paymentRequiredResponse(paymentRequired);
  }

  // Paid path — issue the commission receipt. Never a score.
  if (!subject) {
    return json({ schema: "csoai.request-attestation/0.2", error: "bad_request", reason: "pass subject=<id> (and optional axis=) with the payment", lid: CSOAI_LID }, 400);
  }
  const as_of = new Date().toISOString();
  const tx = payment.settlement?.transaction || null;
  const source_urls = [
    resourceUrl + `?subject=${encodeURIComponent(subject)}` + (axis ? `&axis=${encodeURIComponent(axis)}` : ""),
    ...(tx ? [`https://basescan.org/tx/${tx}`] : []),
    reserve.source.startsWith("http") ? reserve.source : `${origin}/signed/card-matrix.json`,
  ];
  const payload: Record<string, unknown> = {
    status: "COMMISSIONED",
    subject,
    axis: axis || null,
    axis_known: knownAxis,
    settle: { network: payment.settlement?.network || null, transaction: tx, payer: payment.settlement?.payer || null },
    reserve: reserve.cells.slice(0, 24).map((c) => ({ axis: c.axis, card: c.card })),
    reserve_count: reserve.cells.length,
    fresh_run: "UNMEASURED",
    never: ["rank", "certificate", "grade"],
    lid: CSOAI_LID,
  };
  let leaf;
  try {
    leaf = await signPayload(payload, env.BOARD_SIGN_KEY_PKCS8_B64);
  } catch (e) {
    return json({ schema: "csoai.request-attestation/0.2", error: "uncheckable", reason: (e as Error).message }, 500);
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

  // Tally + queue when a store is bound. Absent store ⇒ nothing counted (null, never 0).
  if (env.REVENUE_KV) {
    try {
      const n = Number((await env.REVENUE_KV.get("count:issuances")) || "0") + 1;
      await env.REVENUE_KV.put("count:issuances", String(n));
      await env.REVENUE_KV.put(`ras:${leaf.sha256}`, JSON.stringify({ subject, axis: axis || null, tx, as_of }));
    } catch {
      /* a tally failure never blocks a paid deliverable */
    }
  }

  return json(
    { card, verify: `${origin}/gspc-verify`, signed: !!leaf.sig_ed25519, unsigned_reason: leaf.unsigned_reason, bytes: leaf.bytes, note: "Commission receipt. Not a grade, not a rank, not a certificate. Root inclusion follows the public-root workflow." },
    200,
    payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {},
  );
};
