/**
 * _ras_door — the settle-and-deliver sequence shared by the three self-serve RAS doors
 * (functions/api/ras/*.ts). It adds NO payment logic: the challenge is buildPaymentRequiredV2 +
 * paymentRequiredResponseSigned, the payment is verifyX402Payment (verify → settle through the
 * configured facilitator, v2 + extensions.bazaar echoed), and the receipt is signPayload under the
 * Pages board key — the same four calls /api/wrapper and /api/pop/* make. Each handler still calls
 * x402Accepts itself so scripts/build_openapi.py can read its SKU from the handler source.
 *
 * THE ORDER IS THE DOCTRINE:
 *   1. no payment header           → 402 (no computation, no network)
 *   2. payment header, bad input    → 400, nothing sent to the facilitator
 *   3. payment header, input ok     → COMPUTE first. The computation never sees the payment.
 *   4. computation could not run    → the 402 again with the reason; nothing settled
 *      (our side failed: DNS unreadable, RPC down, signer error — the buyer is never charged
 *       for our failure)
 *   5. computation ran              → sign → settle → deliver. A result about the TARGET that is
 *      bad news (UNREACHABLE, NOT_MCP, NOT_CONFORMANT, REJECTED …) is a delivered result: the
 *      probe ran, and a paid probe that finds a failure is delivered as that failure.
 *   6. settle fails                 → the 402 again; the computed result is NOT released.
 * Nothing on this path writes to the GSPC board, the public root, or any card index: the only
 * write is the REVENUE_KV counter every metered door keeps.
 */
import {
  verifyX402Payment,
  buildPaymentRequiredV2,
  paymentRequiredResponseSigned,
  hasPaymentHeader,
  CSOAI_LID,
  type X402Accept,
  type X402Env,
} from "./_x402";
import { railMode } from "./_x402_config";
import { signPayload, canonicalBytes, PAYLOAD_CAP_BYTES } from "../_lib/cardSign";
import { VERDICT_RE } from "./rwa/evidence";

export type RasEnv = X402Env & { BOARD_SIGN_KEY_PKCS8_B64?: string; REVENUE_KV?: KVNamespace };

export const RAS_SKU = { skuId: "ras_fresh_read", tier: "per_read" } as const;
export const RAS_RECEIPT_SCHEMA = "https://councilof.ai/schema/card-v0.json";

export const rasJson = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", ...extraHeaders },
  });

/** Outcome of a door's computation. `delivered:false` means OUR side could not run it. */
export type RasComputation =
  | {
      delivered: true;
      /** The signed leaf. ≤ 3072 canonical bytes; big evidence goes in `evidence` with its sha256 here. */
      payload: Record<string, unknown>;
      subject: string;
      source_urls: string[];
      /** Unsigned bulk returned beside the receipt (its digest is inside payload). */
      evidence?: Record<string, unknown>;
      unmeasured?: string[];
    }
  | { delivered: false; status?: number; error: string; reason: string; detail?: Record<string, unknown> };

export type RasDoorSpec = {
  request: Request;
  env: RasEnv;
  schema: string;
  surface: string;
  resourceUrl: string;
  description: string;
  serviceName: string;
  tags: string[];
  accepts: X402Accept[];
  bazaar: { info: Record<string, unknown>; schema: Record<string, unknown> };
  deliverable: string;
  /** Path of the free look-first for this door (the contract's free_preview). A fresh computation
   *  cannot be previewed before it runs, so this names the LAST PUBLISHED, SIGNED run of the same
   *  instrument over its published population — what a result looks like, read free. */
  freePreviewPath: string;
  never: string[];
  /** Syntactic input check, no network. null = acceptable. */
  inputError: () => { status: number; error: string; reason: string; detail?: Record<string, unknown> } | null;
  compute: () => Promise<RasComputation>;
  counter: string;
};

/** A header that does not even decode to an x402 payload is refused before any computation. */
function paymentHeaderDecodes(request: Request): boolean {
  const h = request.headers.get("x-payment") || request.headers.get("payment-signature") || "";
  try {
    const t = h.trim();
    const v = JSON.parse(t.startsWith("{") ? t : atob(t));
    return !!v && typeof v === "object" && !Array.isArray(v);
  } catch {
    return false;
  }
}

export async function rasDoor(spec: RasDoorSpec): Promise<Response> {
  const { request, env, resourceUrl, accepts, bazaar } = spec;
  const origin = new URL(request.url).origin;
  const inputErr = spec.inputError();

  const challenge = (notPaidReason: string, extra: { error?: string; csoai?: Record<string, unknown> } = {}) => {
    const pr = buildPaymentRequiredV2({
      resourceUrl,
      description: spec.description,
      serviceName: spec.serviceName,
      tags: spec.tags,
      accepts,
      bazaar,
      csoai: {
        schema: spec.schema,
        per: "one fresh computation",
        lid: CSOAI_LID,
        deliverable: spec.deliverable,
        free_preview: `${origin}${spec.freePreviewPath}`,
        free_preview_is: "the last published, signed run of this instrument over its public population, free; not a preview of your target, which has not been computed",
        never: spec.never,
        payment_changes_result: false,
        board_effect: "none — nothing paid is written to the GSPC board, the public root or any card index",
        failure_is_delivered: "a result about the target that is bad news (unreachable, not conformant, not MCP …) is delivered as that result; only a computation OUR side could not run is left unsettled",
        input_check: inputErr ? { ok: false, ...inputErr, settled: false } : { ok: true, note: "syntax only; DNS and redirects are checked again at run time and a refusal there settles nothing" },
        verify_free: `${origin}/api/verify`,
        rail: railMode(env),
        not_paid_reason: notPaidReason,
        catalog: `${origin}/api/x402`,
        ...(extra.csoai || {}),
      },
    });
    return paymentRequiredResponseSigned(extra.error ? { ...pr, error: extra.error } : pr, env);
  };

  // 1. Unpaid: the challenge, and nothing else. An indexer reaches the 402 whatever the input.
  if (!hasPaymentHeader(request)) {
    return challenge((await verifyX402Payment(request, env, resourceUrl, accepts[0], { bazaar })).reason);
  }
  // 2. Paid but the input is refused: never sent to the facilitator.
  if (inputErr) {
    return rasJson({ schema: spec.schema, ...inputErr, settled: false, note: "No payment was taken: the input was refused before anything was computed or settled." }, inputErr.status);
  }
  if (!paymentHeaderDecodes(request)) {
    return challenge("x-payment header is not a decodable x402 payload — nothing was computed or settled");
  }

  // 3. Compute. The payment header is not an input to this function.
  let c: RasComputation;
  try {
    c = await spec.compute();
  } catch (e) {
    c = { delivered: false, error: "uncheckable", reason: `computation threw: ${(e as Error).message || e}` };
  }
  // 4. Our side could not run it: not settled.
  if (c.delivered === false) {
    if (c.status && c.status !== 402) {
      return rasJson({ schema: spec.schema, error: c.error, reason: c.reason, ...(c.detail || {}), settled: false, note: "No payment was taken." }, c.status);
    }
    return challenge(
      `computation not delivered: ${c.reason}. The payment was not sent to the facilitator, so nothing was settled.`,
      { error: `${c.error} — payment not settled`, csoai: { not_delivered: { error: c.error, reason: c.reason, ...(c.detail || {}), settled: false } } },
    );
  }

  // 5. Sign the leaf (the same rule /api/board-sign applies), then refuse anything that reads as a verdict.
  let leaf;
  try {
    leaf = await signPayload(c.payload, env.BOARD_SIGN_KEY_PKCS8_B64);
  } catch (e) {
    return rasJson({ schema: spec.schema, error: "uncheckable", reason: (e as Error).message, settled: false }, 500);
  }
  const unmeasured = [...(c.unmeasured || [])];
  if (!leaf.sig_ed25519) unmeasured.push(/absent/.test(leaf.unsigned_reason || "") ? "sig_ed25519 (no Pages key)" : "sig_ed25519 (sign failed)");
  const receipt: Record<string, unknown> = {
    schema: RAS_RECEIPT_SCHEMA,
    surface: spec.surface,
    subject: c.subject,
    as_of: String(c.payload.fetched_at || new Date().toISOString()),
    source_urls: c.source_urls,
    payload: c.payload,
    ...(leaf.did ? { did: leaf.did } : { did_intended: "did:web:csoai.org#board-attestation-1" }),
    sha256: leaf.sha256,
    sig_ed25519: leaf.sig_ed25519,
    unsigned_reason: leaf.unsigned_reason,
    unmeasured,
    tags: [`eater:${spec.surface}`, leaf.sig_ed25519 ? "signed" : "unsigned", "not-on-board"],
  };
  // The verdict guard reads OUR words only. `payload.target`, `subject` and `source_urls` carry
  // strings a buyer or a target chose (a URL, a host, a contract address); a probe of
  // https://certified.example/ must not be refused for the target's own spelling.
  const ours = { ...receipt, subject: null, source_urls: null, payload: { ...c.payload, target: null } };
  const text = new TextDecoder().decode(canonicalBytes(ours));
  if (VERDICT_RE.test(text)) {
    return rasJson({ schema: spec.schema, error: "refused", reason: `receipt carries a verdict word: ${text.match(VERDICT_RE)![0]}`, settled: false }, 500);
  }
  if (canonicalBytes(c.payload).byteLength > PAYLOAD_CAP_BYTES) {
    return rasJson({ schema: spec.schema, error: "uncheckable", reason: "payload over cap", settled: false }, 500);
  }

  // 6. Settle. Only a facilitator-confirmed settle releases the result.
  const payment = await verifyX402Payment(request, env, resourceUrl, accepts[0], { bazaar });
  if (!payment.ok) return challenge(payment.reason);

  if (env.REVENUE_KV) {
    try {
      const n = Number((await env.REVENUE_KV.get(spec.counter)) || "0") + 1;
      await env.REVENUE_KV.put(spec.counter, String(n));
    } catch { /* never blocks a paid deliverable */ }
  }

  return rasJson(
    {
      schema: spec.schema,
      kind: "receipt",
      result: c.payload,
      ...(c.evidence ? { evidence: c.evidence } : {}),
      receipt,
      settle: payment.settlement || null,
      ...(payment.receipt ? { payment_receipt: payment.receipt } : {}),
      ...(payment.receiptGap ? { payment_receipt_gap: payment.receiptGap } : {}),
      verify: { free: `${origin}/api/verify`, how: "POST the `receipt` object to /api/verify; the signature covers receipt.payload's canonical bytes (sorted keys, compact) under did:web:csoai.org#board-attestation-1" },
      payment_changes_result: false,
      board_effect: "none",
    },
    200,
    {
      "x-csoai-receipt-sha256": leaf.sha256,
      "x-csoai-signed": leaf.sig_ed25519 ? "true" : "false",
      ...(payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {}),
    },
  );
}

/** sha256 hex of UTF-8 text (WebCrypto). */
export async function sha256Text(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Bytes(b: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", b as BufferSource);
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
