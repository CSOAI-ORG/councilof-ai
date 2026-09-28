/**
 * GET /api/request-attestation — Tier 1: commission a signed card for a subject (× optional axis).
 *
 * Sell path: pay-to-recompute / re-attest per request — never a rank, never a certificate,
 * never a score. The current lid is imported from _x402 and must match GET /api/gspc.
 *
 *   free   GET ?subject=<id>[&axis=<slug>]            → 402 challenge + a FREE PREVIEW of what
 *                                                        already exists for that subject (signed
 *                                                        cards, re-serve availability).
 *   paid   same URL + X-PAYMENT (facilitator-settled)   → ONE card-v0 leaf, surface ras.commission:
 *                                                        signed with #board-attestation-1 when the
 *                                                        Pages key is present, else sig_ed25519:null
 *                                                        with "sig_ed25519" in unmeasured[]. ≤3KB.
 *
 * THE PROMISE IS DERIVED, NEVER TYPED. Until 2026-09-22 the 402 copy read "signed when the Pages
 * signing key is available" — a conditional with no date and no way for a buyer to check it before
 * paying. The 402 now carries csoai.signer, computed from the SAME env field signPayload() reads,
 * so the challenge says SIGNED or UNSIGNED (with the reason) for the receipt it would issue right
 * now. The offer on the same 402 is signed with the same key, so a buyer can verify the claim
 * against extensions["offer-receipt"] before spending anything.
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
import { headFromGet } from "./_head";
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
import { signPayload, cardV0, BOARD_ATTESTATION_DID } from "../_lib/cardSign";
import { classifyCommissionTarget } from "./_commission_target";

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

/**
 * What the receipt WOULD carry if issued now, read from the same env field signPayload() consumes.
 * Presence is the only thing checked here (an unparseable key surfaces as unsigned_reason at issue
 * time, exactly as signPayload reports it). Never a promise about a future date.
 */
export function signerState(env: { BOARD_SIGN_KEY_PKCS8_B64?: string }) {
  const present = Boolean((env.BOARD_SIGN_KEY_PKCS8_B64 || "").trim());
  return {
    did: BOARD_ATTESTATION_DID,
    key_present: present,
    receipt_will_be: present ? "SIGNED" : "UNSIGNED",
    unsigned_reason: present ? null : "BOARD_SIGN_KEY_PKCS8_B64 absent in Pages env",
    checked_how:
      "read at challenge time from the Pages env field the paid path signs with; the offer in " +
      'extensions["offer-receipt"] on this same response is signed with the same key, so verify that before paying',
  };
}

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


type InteropAvailability = {
  state: "ROOT_REFERENCES_AVAILABLE" | "UNCHECKABLE";
  pointer_url: string;
  root_url: string | null;
  root_sha256: string | null;
  root_as_of: string | null;
  root_active_leaves: number | null;
  matching_active_leaves: number | null;
  match_basis: "CASE_INSENSITIVE_MODEL_SUBSTRING";
  sample_card_urls: string[];
  root_integrity: "BYTE_MATCHES_UNSIGNED_POINTER" | "UNCHECKABLE";
  signature_verification: "NOT_PERFORMED";
  included_in_paid_reserve: false;
  note: string;
  reason?: string;
};

type InteropLeaf = { modelLower: string; axis: string; card: string };
type InteropRootCache = {
  key: string; asOf: string; nLeaves: number; leaves: InteropLeaf[];
};
const POINTER_LIMIT = 4 * 1024;
const ROOT_LIMIT = 8 * 1024 * 1024;
let interopRootCache: InteropRootCache | null = null;
let interopRootPending: { key: string; promise: Promise<InteropRootCache> } | null = null;

async function readBounded(response: Response, limit: number): Promise<Uint8Array> {
  const size = response.headers.get("content-length");
  if (size && /^\d+$/.test(size) && Number(size) > limit) throw new Error("source exceeds byte limit");
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > limit) throw new Error("source exceeds byte limit");
    return bytes;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > limit) throw new Error("source exceeds byte limit");
      chunks.push(part.value);
    }
  } catch (e) {
    await reader.cancel().catch(() => {});
    throw e;
  }
  const bytes = new Uint8Array(length);
  let at = 0;
  for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.byteLength; }
  return bytes;
}

/** Free discovery of a separate mill-card root; never silently add its leaves to paid reserve. */
async function interopAvailabilityFor(origin: string, subject: string, axis: string): Promise<InteropAvailability> {
  const pointerUrl = new URL("/interop/card-root-latest.json", origin).toString();
  const base = {
    pointer_url: pointerUrl,
    match_basis: "CASE_INSENSITIVE_MODEL_SUBSTRING" as const,
    signature_verification: "NOT_PERFORMED" as const,
    included_in_paid_reserve: false as const,
    note: "These are active root references whose model contains the query text, not exact subject identities, card-v1 reserve entries or new GSPC board scores. Check each card signature independently; this unsigned pointer and root-byte match do not prove Bitcoin anchoring. Payment does not include these references.",
  };
  const uncheckable = (reason: string): InteropAvailability => ({
    ...base, state: "UNCHECKABLE", root_url: null, root_sha256: null, root_as_of: null,
    root_active_leaves: null, matching_active_leaves: null, sample_card_urls: [],
    root_integrity: "UNCHECKABLE", reason,
  });
  try {
    const pr = await fetch(pointerUrl);
    if (!pr.ok) return uncheckable("pointer HTTP " + pr.status);
    const pointer = JSON.parse(new TextDecoder().decode(await readBounded(pr, POINTER_LIMIT))) as Record<string, any>;
    const rootPath = String(pointer.root_url || "");
    const expected = String(pointer.root_sha256 || "");
    if (pointer.schema !== "csoai.card-root-pointer/1" ||
        pointer.kind !== "DISCOVERY_POINTER_ONLY" ||
        !/^\/interop\/card-root-\d{4}-\d{2}-\d{2}(?:-[a-f0-9]{12})?\.json$/.test(rootPath) ||
        !/^[a-f0-9]{64}$/.test(expected) ||
        !Number.isSafeInteger(pointer.n_leaves) || pointer.n_leaves < 0) {
      return uncheckable("pointer shape is not checkable");
    }
    const rootUrl = new URL(rootPath, origin).toString();
    const key = origin + "|" + expected;
    const loadRoot = async (): Promise<InteropRootCache> => {
      const rr = await fetch(rootUrl);
      if (!rr.ok) throw new Error("root HTTP " + rr.status);
      const bytes = await readBounded(rr, ROOT_LIMIT);
      const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes.buffer as ArrayBuffer))]
        .map((b) => b.toString(16).padStart(2, "0")).join("");
      if (digest !== expected) throw new Error("root bytes differ from pointer digest");
      const root = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, any>;
      if (root.kind !== "csoai.card-root/1" || !Array.isArray(root.leaves) ||
          root.leaves.length !== root.n_leaves ||
          !Number.isSafeInteger(root.n_leaves) || root.n_leaves < 0 ||
          !/^[a-f0-9]{64}$/.test(String(root.merkle_root || "")) ||
          !root.leaves.every((leaf: Record<string, unknown>) =>
            /^signed-[a-z0-9-]+-[a-f0-9]{12}\.json$/.test(String(leaf.card || "")) &&
            typeof leaf.model === "string" && typeof leaf.axis === "string")) {
        throw new Error("root shape is not checkable");
      }
      return {
        key, asOf: String(root.as_of), nLeaves: root.n_leaves,
        leaves: root.leaves.map((leaf: Record<string, string>) => ({
          modelLower: leaf.model.toLowerCase(), axis: leaf.axis, card: leaf.card,
        })),
      };
    };

    let current: InteropRootCache;
    if (interopRootCache?.key === key) {
      current = interopRootCache;
    } else {
      if (interopRootPending?.key !== key) interopRootPending = { key, promise: loadRoot() };
      const pending = interopRootPending!;
      try {
        current = await pending.promise;
        interopRootCache = current;
      } finally {
        if (interopRootPending === pending) interopRootPending = null;
      }
    }
    if (current.asOf !== pointer.as_of || current.nLeaves !== pointer.n_leaves)
      return uncheckable("root count or timestamp differs from pointer");
    const needle = subject.toLowerCase();
    const matching = current.leaves.filter((leaf) =>
      leaf.modelLower.includes(needle) && (!axis || leaf.axis === axis));
    return {
      ...base, state: "ROOT_REFERENCES_AVAILABLE", root_url: rootUrl, root_sha256: expected,
      root_as_of: current.asOf, root_active_leaves: current.nLeaves,
      matching_active_leaves: matching.length,
      sample_card_urls: matching.slice(0, 4).map((leaf) =>
        new URL("/interop/mill-cards-signed/" + leaf.card, origin).toString()),
      root_integrity: "BYTE_MATCHES_UNSIGNED_POINTER",
    };
  } catch (e) {
    return uncheckable((e as Error).message || "root unavailable");
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const subject = (url.searchParams.get("subject") || "").trim();
  const axis = (url.searchParams.get("axis") || "").trim().toLowerCase();

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
  const knownAxis = axis ? AXES.some((a) => a.axis === axis) : null;
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

  // Canonicalize only the validated inputs this route uses. Copying request.url would
  // leak ignored tracking or credential query parameters into a signed offer and paid receipt.
  const resource = new URL("/api/request-attestation", origin);
  if (subject) resource.searchParams.set("subject", subject);
  if (axis) resource.searchParams.set("axis", axis);
  const resourceUrl = resource.toString();

  const description = REQUEST_ATTESTATION_DESCRIPTION;
  const accepts = x402Accepts(env, resourceUrl, { skuId: "request_attestation", tier: "per_request", description });
  // Computed once, used twice: the 402 advertises this block and the paid path echoes the SAME
  // object into the PaymentPayload sent to the facilitator (specs/extensions/bazaar.md, Client
  // Behavior) — that echo is what gets a resource catalogued.
  const bazaar = declareBazaarHttpGet({
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
  });
  const payment = await verifyX402Payment(request, env, resourceUrl, accepts[0], { bazaar });

  // The free preview is the same whether or not the caller pays: what already exists.
  const reserve = subject ? await reserveFor(origin, subject, axis) : { cells: [], as_of: null, source: "no subject given" };
  const interop = !payment.ok && subject ? await interopAvailabilityFor(origin, subject, axis) : null;
  const preview = {
    subject: subject || null,
    axis: axis || null,
    axis_known: knownAxis,
    signed_cards_on_file: reserve.cells.length,
    cards: reserve.cells.slice(0, 40).map((c) => ({ axis: c.axis, card: c.card, card_url: c.card_url })),
    corpus_as_of: reserve.as_of,
    read_from: reserve.source,
    interop_collection: interop,
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
      bazaar,
      csoai: {
        schema: "csoai.request-attestation/0.2",
        per: "request",
        lid: CSOAI_LID,
        never: ["rank", "certificate", "grade", "score-sale"],
        deliverable: description,
        signer: signerState(env),
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
  const queue_ref = `${origin}/api/commission-queue`;
  const payload: Record<string, unknown> = {
    status: "COMMISSIONED",
    subject,
    subject_kind: target.subject_kind,
    model: target.model,
    bank: target.bank,
    fulfillment: target.fulfillment,
    enqueued: true,
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

  // Tally + mill-visible enqueue when a store is bound. Absent store ⇒ nothing counted (null, never 0).
  // Enqueue writes mill:commission:<subject> for GET /api/commission-queue. Failure never blocks receipt.
  if (env.REVENUE_KV) {
    try {
      const n = Number((await env.REVENUE_KV.get("count:issuances")) || "0") + 1;
      await env.REVENUE_KV.put("count:issuances", String(n));
      await env.REVENUE_KV.put(
        `ras:${leaf.sha256}`,
        JSON.stringify({
          subject,
          axis: axis || null,
          tx,
          as_of,
          enqueued: true,
          queue: "commission",
          subject_kind: target.subject_kind,
          model: target.model,
          bank: target.bank,
          fulfillment: target.fulfillment,
        }),
      );
      await env.REVENUE_KV.put(
        `mill:commission:${subject}`,
        JSON.stringify({
          subject,
          subject_kind: target.subject_kind,
          model: target.model,
          bank: target.bank,
          axis: axis || null,
          tx,
          as_of,
          receipt_sha: leaf.sha256,
          card_sha: leaf.sha256,
          status: "QUEUED",
          fulfillment: target.fulfillment,
        }),
      );
    } catch {
      /* a tally/enqueue failure never blocks a paid deliverable */
    }
  }

  return json(
    { card, verify: `${origin}/gspc-verify`, signed: !!leaf.sig_ed25519, unsigned_reason: leaf.unsigned_reason, bytes: leaf.bytes, note: "Commission receipt. Not a grade, not a rank, not a certificate. Root inclusion follows the public-root workflow." },
    200,
    payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {},
  );
};

/** Gold-402's gate POSTs {}. Query string still selects the paid tier; body is ignored. */
export const onRequestPost = onRequestGet;

// HEAD answers as GET would, with no body and never with a payment (functions/api/_head.ts).
export const onRequestHead = headFromGet(onRequestGet);
